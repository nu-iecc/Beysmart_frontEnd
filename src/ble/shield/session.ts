import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { Subscription } from 'react-native-ble-plx';
import {
  getConnectedDevice,
  readCharacteristic,
  writeCharacteristic,
} from '../bluetoothmanager';
import {
  SENTINEL_REF,
  bytesToHex,
  concat,
  equalBytes,
  hexToBytes,
  nonzero,
  readU16,
  readU32,
} from './bytes';
import { buildAppProof, buildAuthStart, buildClaimProof, buildClaimStart, sealCommand } from './codec';
import {
  claimBindingProof,
  claimSessionKey,
  decryptOwnerKey,
  gcmDecrypt,
  gcmNonce,
  originalClaimProof,
  verifyLockProof,
} from './crypto';
import { ShieldCommandError, ShieldIdentityError } from './errors';
import { isTerminalProcessMatch, matchProcessEvent } from './processEvent';
import { sameLock } from './reconnect';
import { loadOwner, saveOwner, StoredOwner } from './store';
import { randomBytes } from './random';
import { readTestKSetup } from './testConfig';
import {
  SHIELD_AUTH_RX_UUID,
  SHIELD_AUTH_TX_UUID,
  SHIELD_BOOTSTRAP_RX_UUID,
  SHIELD_BOOTSTRAP_TX_UUID,
  SHIELD_OP,
  SHIELD_PROTOCOL_INFO_UUID,
  SHIELD_SECURE_RX_UUID,
  SHIELD_SECURE_TX_UUID,
  SHIELD_SERVICE_UUID,
} from './uuids';

export interface ShieldStatus {
  lock: number;
  door: number;
  process: number;
  battery: number | null;
  calibration: number;
}

interface ProcessUpdate {
  operationId: Uint8Array;
  outcome: number;
  aborted?: boolean;
}

interface ResponseWaiter {
  opcode: number;
  sequence: number;
  resolve: (plaintext: Uint8Array) => void;
  reject: (error: Error) => void;
}

interface LiveSession {
  owner: StoredOwner;
  lockId: Uint8Array;
  contextId: Uint8Array;
  kC2l: Uint8Array;
  kL2c: Uint8Array;
  c2l: number;
  l2c: number;
  mode: number;
}

/**
 * Project Shield V2 test session.
 * One command is in flight at a time. Live keys are dropped on disconnect.
 */
class ShieldSession {
  private live: LiveSession | null = null;
  private chain: Promise<unknown> = Promise.resolve();
  private monitors: Subscription[] = [];
  private monitoring = false;
  private queues = {
    bootstrap: new ByteQueue(),
    auth: new ByteQueue(),
    secure: new ByteQueue(),
  };
  private processUpdates: ProcessUpdate[] = [];
  private processWaiters: Array<(update: ProcessUpdate) => void> = [];
  private rememberedLockId: Uint8Array | null = null;
  private onStatus: ((status: ShieldStatus, source: 'status' | 'event') => void) | null = null;
  private onProcess: ((outcome: number, operationId: Uint8Array) => void) | null = null;
  private responseWaiter: ResponseWaiter | null = null;
  private loopGeneration = 0;
  private loopActive = false;
  private activeLoopGeneration = -1;
  private loopDone: Promise<void> = Promise.resolve();
  private loopGate: Promise<void> = Promise.resolve();

  public isLive(): boolean {
    return this.live?.mode === 0x00;
  }

  public setProcessHandler(handler: (outcome: number, operationId: Uint8Array) => void): void {
    this.onProcess = handler;
  }

  public dropLive(): void {
    this.loopGeneration += 1;
    this.live = null;
    const responseWaiter = this.responseWaiter;
    this.responseWaiter = null;
    this.processUpdates = [];
    this.abortProcessWaiters();
    const ended = new Error('Shield session ended.');
    this.queues.bootstrap.fail(ended);
    this.queues.auth.fail(ended);
    this.queues.secure.fail(ended);
    responseWaiter?.reject(new ShieldCommandError('Shield session ended.', 'transport_failure'));
  }

  public onTransportLost(): void {
    this.dropLive();
    this.rememberedLockId = null;
    this.monitoring = false;
    this.monitors = [];
  }

  public getLockIdHex(): string | null {
    return this.rememberedLockId ? bytesToHex(this.rememberedLockId) : null;
  }

  public async prepare(
    onStatus: (status: ShieldStatus, source: 'status' | 'event') => void,
    options?: { expectedLockIdHex?: string; allowClaim?: boolean }
  ): Promise<ShieldStatus> {
    const allowClaim = options?.allowClaim !== false;
    return this.enqueue(async () => {
      this.onStatus = onStatus;
      await this.requestMtu();
      await this.ensureMonitors();
      const lockId = await this.readProtocolInfo();
      const lockHex = bytesToHex(lockId);
      if (options?.expectedLockIdHex && !sameLock(options.expectedLockIdHex, lockHex)) {
        throw new ShieldIdentityError('This lock is not the registered device.', 'identity_mismatch');
      }
      let owner = await loadOwner(lockId);

      if (!owner) {
        if (!allowClaim) {
          throw new ShieldIdentityError('No saved credential for this lock.', 'credentials');
        }
        owner = await this.claim(lockId);
      }

      try {
      if (!owner.ackDone) {
        try {
          await this.openSession(owner, 0x02);
          await this.sendCommand(
            SHIELD_OP.CLAIM_ACK,
            concat(hexToBytes(owner.enrollmentIdHex), hexToBytes(owner.epochHex))
          );
        } catch (error) {
          console.log(`🪪 Pending claim acknowledgement did not finish (${error instanceof Error ? error.message : 'unknown error'}). Trying a normal owner session.`);
          this.dropLive();
          await this.openSession(owner, 0x00);
        }
        owner = { ...owner, ackDone: true };
        await saveOwner(owner);
        if (this.live?.mode !== 0x00) {
          this.dropLive();
        }
      }

      if (!this.isLive()) {
        await this.openSession(owner, 0x00);
      }
      const testReply = await this.sendCommand(SHIELD_OP.TEST_0011, new Uint8Array());
      console.log(`🧪 Opcode 0011 reply ${bytesToHex(testReply)}`);
      await this.sendCommand(SHIELD_OP.SUBSCRIBE_RUNTIME, new Uint8Array([0x01]));
      return this.readStatus();
      } catch (error) {
        if (!allowClaim) {
          if (error instanceof ShieldIdentityError) throw error;
          throw new ShieldIdentityError(
            error instanceof Error ? error.message : 'Authentication failed.',
            'auth_failed'
          );
        }
        throw error;
      }
    });
  }

  public async status(): Promise<ShieldStatus> {
    return this.enqueue(async () => {
      await this.ensureOwnerSession();
      return this.readStatus();
    });
  }

  public async calibrationStart(): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureOwnerSession();
      this.requireResult(await this.sendCommand(SHIELD_OP.CALIBRATION_START, new Uint8Array()), 'Calibration start');
    });
  }

  public async calibrationStep(step: number): Promise<void> {
    await this.enqueue(async () => {
      await this.ensureOwnerSession();
      this.requireResult(
        await this.sendCommand(SHIELD_OP.CALIBRATION_ENCODER_STEP, new Uint8Array([step])),
        'Calibration step'
      );
    });
  }

  public async calibrationFinish(): Promise<number> {
    return this.enqueue(async () => {
      await this.ensureOwnerSession();
      const plain = await this.sendCommand(SHIELD_OP.CALIBRATION_FINISH, new Uint8Array(), 60000);
      if (plain[0] !== 0x00) {
        throw new Error(`Calibration finish was rejected (result 0x${plain[0].toString(16)}).`);
      }
      if (plain.length < 2) {
        throw new Error('Calibration finish response did not include a state.');
      }
      return plain[1];
    });
  }

  public async physicalAction(opcode: number): Promise<{ operationId: Uint8Array; outcome: number }> {
    return this.enqueue(async () => {
      await this.ensureOwnerSession();
      const plain = await this.sendCommand(opcode, new Uint8Array(), 30000);
      if (plain[0] !== 0x00 || plain.length < 17) {
        throw new ShieldCommandError(
          `Lock command was rejected (result 0x${(plain[0] ?? 0).toString(16)}).`,
          'rejected'
        );
      }
      const operationId = plain.slice(1, 17);
      console.log(`🪪 Operation ${bytesToHex(operationId)} accepted`);
      const outcome = await this.waitForProcess(operationId, 45000);
      return { operationId, outcome };
    });
  }

  private async ensureOwnerSession(): Promise<void> {
    if (this.live?.mode === 0x00) {
      return;
    }
    const lockId = this.rememberedLockId;
    if (!lockId) {
      throw new Error('Connect to the lock first.');
    }
    const owner = await loadOwner(lockId);
    if (!owner?.ackDone) {
      throw new Error('Reconnect to the lock to finish owner setup.');
    }
    await this.openSession(owner, 0x00);
    await this.sendCommand(SHIELD_OP.SUBSCRIBE_RUNTIME, new Uint8Array([0x01]));
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.chain.then(task, task);
    this.chain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async requestMtu(): Promise<void> {
    const device = this.requireDevice();
    try {
      const updated = await device.requestMTU(247);
      console.log(`📶 Negotiated MTU: ${updated.mtu}`);
      if (Platform.OS === 'android' && updated.mtu < 188) {
        throw new Error(`MTU ${updated.mtu} is below the required 188.`);
      }
    } catch (error) {
      if (Platform.OS === 'android') {
        throw error;
      }
      console.log('📶 iOS manages MTU. A full auth challenge confirms it is large enough.');
    }
  }

  private async readProtocolInfo(): Promise<Uint8Array> {
    const info = await readCharacteristic(SHIELD_SERVICE_UUID, SHIELD_PROTOCOL_INFO_UUID);
    if (info.length !== 24) {
      throw new Error(`ProtocolInfo was ${info.length} bytes. The link MTU is below 188.`);
    }
    if (info[0] !== 0x02 || info[1] !== 0x01 || info[23] !== 0x00) {
      throw new Error(
        `Unexpected ProtocolInfo protocol=${info[0]} profile=${info[1]} reserved=${info[23]}.`
      );
    }
    const lockId = info.slice(6, 22);
    this.rememberedLockId = lockId;
    console.log(`🔐 Protocol 02 profile 01 lock ${bytesToHex(lockId)}`);
    return lockId;
  }

  private async ensureMonitors(): Promise<void> {
    if (this.monitoring) {
      return;
    }
    const device = this.requireDevice();
    const watch = (uuid: string, queue: ByteQueue) => {
      const subscription = device.monitorCharacteristicForService(
        SHIELD_SERVICE_UUID,
        uuid,
        (error, characteristic) => {
          if (error) {
            console.log(`🔕 Shield indication ended on ${uuid}: ${error.message}`);
            return;
          }
          if (!characteristic?.value) return;
          const raw = new Uint8Array(Buffer.from(characteristic.value, 'base64'));
          if (uuid === SHIELD_SECURE_TX_UUID) {
            console.log(`📨 SecureTx raw len=${raw.length} hex=${bytesToHex(raw)} ${describeClearHeader(raw)}`);
          }
          queue.push(raw);
        }
      );
      this.monitors.push(subscription);
    };

    watch(SHIELD_BOOTSTRAP_TX_UUID, this.queues.bootstrap);
    watch(SHIELD_AUTH_TX_UUID, this.queues.auth);
    watch(SHIELD_SECURE_TX_UUID, this.queues.secure);
    this.monitoring = true;
    console.log(`🔔 SecureTx indications subscribed ${SHIELD_SECURE_TX_UUID}. Subscription stays active until the link drops.`);
  }

  private async claim(lockId: Uint8Array): Promise<StoredOwner> {
    const kSetup = readTestKSetup();
    const nonceApp = await randomBytes(16);
    console.log('🪪 Claim start');
    await writeCharacteristic(SHIELD_SERVICE_UUID, SHIELD_BOOTSTRAP_RX_UUID, buildClaimStart(lockId, nonceApp));
    const challenge = await this.queues.bootstrap.wait(45000);
    this.assertNotError(challenge, 0xc1, 'Claim');
    if (challenge.length !== 99 || challenge[0] !== 0xc1 || challenge[1] !== 0x21) {
      throw new Error(`Claim challenge was ${challenge.length} bytes.`);
    }
    if (!equalBytes(challenge.slice(83, 99), nonceApp) || !equalBytes(challenge.slice(3, 19), lockId)) {
      throw new Error('Claim challenge did not match this lock.');
    }

    const phase = challenge[2];
    const enrollmentId = challenge.slice(19, 35);
    const epoch = challenge.slice(35, 51);
    const originalNonce = challenge.slice(51, 67);
    if (![0x00, 0x01].includes(phase) || !nonzero(enrollmentId) || !nonzero(epoch) || !nonzero(originalNonce)) {
      throw new Error('Claim challenge fields were not valid.');
    }

    const originalProof = phase === 0x00
      ? originalClaimProof(kSetup, lockId, originalNonce)
      : new Uint8Array(32);
    await writeCharacteristic(
      SHIELD_SERVICE_UUID,
      SHIELD_BOOTSTRAP_RX_UUID,
      buildClaimProof(enrollmentId, claimBindingProof(kSetup, challenge), originalProof)
    );

    const delivery = await this.queues.bootstrap.wait(45000);
    this.assertNotError(delivery, 0xc1, 'Claim delivery');
    if (delivery.length !== 134 || delivery[0] !== 0xc1 || delivery[1] !== 0x23) {
      throw new Error(`Owner delivery was ${delivery.length} bytes.`);
    }
    if (!equalBytes(delivery.slice(2, 18), enrollmentId) || !equalBytes(delivery.slice(18, 34), epoch)) {
      throw new Error('Owner delivery did not match the claim challenge.');
    }

    const nested = delivery.slice(54, 134);
    if (nested[0] !== 0x02 || nested[1] !== 0x41 || nested[2] !== 0x00 || nested[3] !== 0x4c) {
      throw new Error('Owner delivery payload was not the expected format.');
    }
    const ownerId = nested.slice(4, 20);
    const kOwner = decryptOwnerKey(
      claimSessionKey(kSetup, lockId, originalNonce),
      lockId,
      ownerId,
      nested.slice(20, 32),
      nested.slice(32, 64),
      nested.slice(64, 80)
    );

    const owner: StoredOwner = {
      lockIdHex: bytesToHex(lockId),
      ownerIdHex: bytesToHex(ownerId),
      kOwnerHex: bytesToHex(kOwner),
      keyVersion: readU32(delivery, 50),
      enrollmentIdHex: bytesToHex(enrollmentId),
      epochHex: bytesToHex(epoch),
      ackDone: false,
    };
    await saveOwner(owner);
    console.log('🪪 Owner credential stored. Claim acknowledgement is next.');
    return owner;
  }

  private async openSession(owner: StoredOwner, mode: number): Promise<void> {
    const lockId = hexToBytes(owner.lockIdHex);
    const userId = hexToBytes(owner.ownerIdHex);
    const nonceApp = await randomBytes(16);
    console.log(`🔑 Auth mode ${mode.toString(16).padStart(2, '0')}`);
    await writeCharacteristic(
      SHIELD_SERVICE_UUID,
      SHIELD_AUTH_RX_UUID,
      buildAuthStart({
        role: 0x02,
        lockId,
        userId,
        keyVersion: owner.keyVersion,
        nonceApp,
        mode,
      })
    );

    const challenge = await this.queues.auth.wait(45000);
    this.assertNotError(challenge, 0x02, 'Auth');
    if (challenge.length !== 152 || challenge[0] !== 0x02 || challenge[1] !== 0x02) {
      throw new Error(`Auth challenge was ${challenge.length} bytes. The MTU may be below 188.`);
    }

    const transcript = challenge.slice(2, 120);
    this.assertTranscript(transcript, { lockId, userId, nonceApp, mode, keyVersion: owner.keyVersion });
    const keys = verifyLockProof(hexToBytes(owner.kOwnerHex), transcript, challenge.slice(120, 152));
    const contextId = transcript.slice(71, 87);

    await writeCharacteristic(
      SHIELD_SERVICE_UUID,
      SHIELD_AUTH_RX_UUID,
      buildAppProof(contextId, keys.appProof)
    );

    const frame = await this.queues.auth.wait(30000);
    this.assertNotError(frame, 0x02, 'Auth result');
    const opened = this.openFrame(frame, {
      key: keys.kL2c,
      kind: 0x13,
      role: 0x02,
      lockId,
      contextId,
      sequence: 0,
      reference: SENTINEL_REF,
      opcode: 0x0000,
    });
    if (opened.plaintext.length !== 1 || opened.plaintext[0] !== 0x00) {
      throw new Error('Auth result was not success.');
    }

    this.live = {
      owner,
      lockId,
      contextId,
      kC2l: keys.kC2l,
      kL2c: keys.kL2c,
      c2l: 0,
      l2c: 1,
      mode,
    };
    console.log('🔑 Session ready');
    void this.ensureSecureLoop();
  }

  private async sendCommand(opcode: number, plaintext: Uint8Array, timeoutMs = 30000): Promise<Uint8Array> {
    const live = this.live;
    if (!live) {
      throw new Error('No Shield session. Connect and claim the lock first.');
    }
    if (live.mode === 0x02 && opcode !== SHIELD_OP.CLAIM_ACK) {
      throw new Error('Pending owner can only acknowledge the claim.');
    }
    await this.ensureSecureLoop();

    const sequence = live.c2l;
    const frame = sealCommand({
      key: live.kC2l,
      role: 0x02,
      lockId: live.lockId,
      contextId: live.contextId,
      sequence,
      opcode,
      plaintext,
    });
    live.c2l += 1;
    console.log(`➡️ Command 0x${opcode.toString(16).padStart(4, '0')} seq ${sequence} (${frame.length} bytes)`);

    const response = new Promise<Uint8Array>((resolve, reject) => {
      const waiter: ResponseWaiter = {
        opcode,
        sequence,
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      const timer = setTimeout(() => {
        if (this.responseWaiter === waiter) this.responseWaiter = null;
        reject(new ShieldCommandError('Timed out waiting for the lock response.', 'transport_failure'));
      }, timeoutMs);
      this.responseWaiter = waiter;
    });
    void response.catch(() => undefined);

    try {
      await writeCharacteristic(SHIELD_SERVICE_UUID, SHIELD_SECURE_RX_UUID, frame);
    } catch (error) {
      const writeError = new ShieldCommandError(
        error instanceof Error ? error.message : 'Bluetooth write failed.',
        'write_failure'
      );
      const waiter = this.responseWaiter;
      this.responseWaiter = null;
      waiter?.reject(writeError);
      this.dropLive();
      throw writeError;
    }

    try {
      return await response;
    } catch (error) {
      this.responseWaiter = null;
      this.dropLive();
      if (error instanceof ShieldCommandError) throw error;
      throw new ShieldCommandError(
        error instanceof Error ? error.message : 'Secure response failed.',
        'transport_failure'
      );
    }
  }

  private async readStatus(): Promise<ShieldStatus> {
    const plain = await this.sendCommand(SHIELD_OP.STATUS, new Uint8Array());
    if (plain[0] !== 0x00 || plain.length < 6) {
      throw new Error('Status read failed.');
    }
    const status: ShieldStatus = {
      lock: plain[1],
      door: plain[2],
      process: plain[3],
      battery: plain[4] === 0xff ? null : plain[4],
      calibration: plain[5],
    };
    this.onStatus?.(status, 'status');
    console.log(`📊 Status lock=${status.lock} door=${status.door} battery=${status.battery ?? 'n/a'}`);
    return status;
  }

  private handleEvent(opcode: number, plaintext: Uint8Array): 'accepted' | 'ignored' {
    if (opcode === SHIELD_OP.LOCK_EVENT) {
      if (plaintext.length >= 1 && plaintext[0] !== 0xff && plaintext[0] !== 0x00) {
        this.onStatus?.(
          {
            lock: plaintext[0],
            door: 0xff,
            process: 0xff,
            battery: null,
            calibration: 0xff,
          },
          'event'
        );
        return 'accepted';
      }
      return 'ignored';
    }
    if (opcode === SHIELD_OP.PROCESS_EVENT) {
      if (plaintext.length < 17) return 'ignored';
      const update = { operationId: plaintext.slice(0, 16), outcome: plaintext[16] };
      this.onProcess?.(update.outcome, update.operationId);
      const waiter = this.processWaiters.shift();
      if (waiter) waiter(update);
      else this.processUpdates.push(update);
      console.log(`🔧 Process outcome ${update.outcome} operation ${bytesToHex(update.operationId)}`);
      return 'accepted';
    }
    return 'ignored';
  }

  private waitForProcess(operationId: Uint8Array, timeoutMs: number): Promise<number> {
    const existing = this.processUpdates.findIndex((update) =>
      isTerminalProcessMatch(matchProcessEvent(operationId, update.operationId, update.outcome))
    );
    if (existing >= 0) {
      const outcome = this.processUpdates[existing].outcome;
      this.processUpdates.splice(existing, 1);
      return Promise.resolve(outcome);
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.processWaiters = this.processWaiters.filter((waiter) => waiter !== onUpdate);
        reject(new ShieldCommandError(
          'The lock accepted the command but did not report completion.',
          'completion_timeout'
        ));
      }, Math.max(1, timeoutMs));

      const onUpdate = (update: ProcessUpdate) => {
        if (update.aborted) {
          clearTimeout(timer);
          reject(new ShieldCommandError('Shield session ended before completion.', 'transport_failure'));
          return;
        }
        const match = matchProcessEvent(operationId, update.operationId, update.outcome);
        if (match === 'different_operation') {
          this.processUpdates.push(update);
          this.processWaiters.push(onUpdate);
          return;
        }
        if (!isTerminalProcessMatch(match)) {
          this.processWaiters.push(onUpdate);
          return;
        }
        clearTimeout(timer);
        resolve(update.outcome);
      };
      this.processWaiters.push(onUpdate);
    });
  }

  private abortProcessWaiters(): void {
    const waiters = this.processWaiters.splice(0);
    for (const waiter of waiters) {
      waiter({ operationId: new Uint8Array(), outcome: 0, aborted: true });
    }
  }

  private ensureSecureLoop(): Promise<void> {
    const run = this.loopGate.then(async () => {
      if (!this.live) return;
      if (this.loopActive && this.activeLoopGeneration === this.loopGeneration) return;
      if (this.loopActive) await this.loopDone;
      if (!this.live || this.loopActive) return;
      const generation = this.loopGeneration;
      this.loopActive = true;
      this.activeLoopGeneration = generation;
      this.loopDone = this.runSecureLoop(generation).finally(() => {
        if (this.activeLoopGeneration === generation) this.loopActive = false;
      });
    });
    this.loopGate = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  private async runSecureLoop(generation: number): Promise<void> {
    if (this.loopGeneration !== generation || !this.live) return;
    this.queues.secure.fail(new Error('Discard unread secure frames.'));
    while (this.loopGeneration === generation && this.live) {
      let incoming: Uint8Array;
      try {
        incoming = await this.queues.secure.wait(60000);
      } catch (error) {
        if (this.loopGeneration !== generation || !this.live) return;
        const message = error instanceof Error ? error.message : '';
        if (message === 'Timed out waiting for the lock.') continue;
        return;
      }
      if (this.loopGeneration !== generation || !this.live) return;
      this.routeSecure(incoming);
    }
  }

  private routeSecure(frame: Uint8Array): void {
    const live = this.live;
    if (!live) {
      console.log(`📭 SecureTx disposition=dropped reason=no session ${describeClearHeader(frame)}`);
      return;
    }
    let opened: { kind: number; opcode: number; reference: number; plaintext: Uint8Array };
    try {
      opened = this.openFrame(frame, {
        key: live.kL2c,
        role: 0x02,
        lockId: live.lockId,
        contextId: live.contextId,
        sequence: live.l2c,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'authentication failed';
      console.log(`📭 SecureTx auth=rejected disposition=dropped ${describeClearHeader(frame)} reason=${message}`);
      return;
    }
    const sequence = live.l2c;
    live.l2c += 1;
    console.log(
      `📬 SecureTx frame=0x${opened.kind.toString(16)} opcode=0x${opened.opcode.toString(16).padStart(4, '0')} seq=${sequence} ref=${opened.reference} operation=${operationIdHex(opened.opcode, opened.plaintext)} payload=${bytesToHex(opened.plaintext)} auth=ok`
    );
    if (opened.kind === 0x12) {
      console.log(`📬 SecureTx disposition=${this.handleEvent(opened.opcode, opened.plaintext)}`);
      return;
    }
    if (opened.kind !== 0x11) {
      console.log(`📭 SecureTx disposition=dropped reason=unexpected frame kind 0x${opened.kind.toString(16)}`);
      this.dropLive();
      return;
    }
    const waiter = this.responseWaiter;
    if (!waiter) {
      console.log('📭 SecureTx disposition=ignored reason=no command waiting');
      return;
    }
    if (waiter.opcode !== opened.opcode || waiter.sequence !== opened.reference) {
      console.log('📭 SecureTx disposition=rejected reason=response did not match the command');
      this.responseWaiter = null;
      waiter.reject(new ShieldCommandError('Secure response did not match the command.', 'transport_failure'));
      this.dropLive();
      return;
    }
    console.log(`⬅️ Result 0x${(opened.plaintext[0] ?? 0).toString(16)} for 0x${opened.opcode.toString(16).padStart(4, '0')} disposition=accepted`);
    this.responseWaiter = null;
    waiter.resolve(opened.plaintext);
  }

  private openFrame(
    frame: Uint8Array,
    expected: {
      key: Uint8Array;
      kind?: number;
      role: number;
      lockId: Uint8Array;
      contextId: Uint8Array;
      sequence: number;
      reference?: Uint8Array;
      opcode?: number;
    }
  ): { kind: number; opcode: number; reference: number; plaintext: Uint8Array } {
    if (frame.length < 72 || frame[0] !== 0x02) {
      this.dropLive();
      throw new Error(`Protected frame was ${frame.length} bytes.`);
    }
    const kind = frame[1];
    const direction = frame[2];
    const payloadLength = readU16(frame, 54);
    if (expected.kind !== undefined && kind !== expected.kind) {
      this.dropLive();
      throw new Error(`Unexpected frame kind 0x${kind.toString(16)}.`);
    }
    if (direction !== 0x01 || frame[3] !== expected.role) {
      this.dropLive();
      throw new Error('Protected frame role or direction was wrong.');
    }
    if (!equalBytes(frame.slice(4, 20), expected.lockId) || !equalBytes(frame.slice(20, 36), expected.contextId)) {
      this.dropLive();
      throw new Error('Protected frame was for a different session.');
    }
    const sequence = Number(readBig(frame, 36));
    if (sequence !== expected.sequence) {
      this.dropLive();
      throw new Error(`Unexpected sequence ${sequence}, expected ${expected.sequence}.`);
    }
    if (frame.length !== 72 + payloadLength) {
      this.dropLive();
      throw new Error('Protected frame length did not match its header.');
    }
    const header = frame.slice(0, 56);
    const ciphertext = frame.slice(56, 56 + payloadLength);
    const tag = frame.slice(56 + payloadLength);
    let plaintext: Uint8Array;
    try {
      plaintext = gcmDecrypt(expected.key, gcmNonce(direction, sequence), header, ciphertext, tag);
    } catch {
      this.dropLive();
      throw new Error('Protected frame authentication failed.');
    }
    const opcode = readU16(frame, 52);
    if (expected.opcode !== undefined && opcode !== expected.opcode) {
      this.dropLive();
      throw new Error(`Unexpected opcode 0x${opcode.toString(16)}.`);
    }
    if (expected.reference && !equalBytes(frame.slice(44, 52), expected.reference)) {
      this.dropLive();
      throw new Error('Protected frame reference did not match.');
    }
    return { kind, opcode, reference: Number(readBig(frame, 44)), plaintext };
  }

  private assertTranscript(
    transcript: Uint8Array,
    expected: { lockId: Uint8Array; userId: Uint8Array; nonceApp: Uint8Array; mode: number; keyVersion: number }
  ): void {
    const version = readU32(transcript, 35);
    const counter = readBig(transcript, 89);
    if (
      transcript.length !== 118 ||
      transcript[0] !== 0x02 ||
      transcript[1] !== 0x00 ||
      transcript[2] !== 0x02 ||
      transcript[87] !== expected.mode ||
      transcript[88] !== 0x00 ||
      transcript[101] !== 0x00 ||
      version !== expected.keyVersion ||
      counter !== 0n ||
      !equalBytes(transcript.slice(3, 19), expected.lockId) ||
      !equalBytes(transcript.slice(19, 35), expected.userId) ||
      !equalBytes(transcript.slice(39, 55), expected.nonceApp) ||
      !nonzero(transcript.slice(55, 71)) ||
      !nonzero(transcript.slice(71, 87)) ||
      !nonzero(transcript.slice(102, 118)) ||
      readU32(transcript, 97) === 0
    ) {
      throw new Error('Auth transcript did not match this phone.');
    }
  }

  private assertNotError(packet: Uint8Array, marker: number, label: string): void {
    if (packet.length === 3 && packet[0] === marker && packet[1] === 0x7f) {
      throw new Error(`${label} failed (result 0x${packet[2].toString(16)}).`);
    }
  }

  private requireResult(plaintext: Uint8Array, label: string): void {
    if (plaintext[0] !== 0x00) {
      throw new Error(`${label} failed (result 0x${plaintext[0].toString(16)}).`);
    }
  }

  private requireDevice() {
    const device = getConnectedDevice();
    if (!device) {
      throw new Error('Not connected to a lock.');
    }
    return device;
  }
}

class ByteQueue {
  private items: Uint8Array[] = [];
  private waiters: Array<{
    resolve: (bytes: Uint8Array) => void;
    reject: (error: Error) => void;
  }> = [];

  push(bytes: Uint8Array): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve(bytes);
      return;
    }
    this.items.push(bytes);
  }

  wait(timeoutMs: number): Promise<Uint8Array> {
    const existing = this.items.shift();
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (bytes: Uint8Array) => {
          clearTimeout(timer);
          resolve(bytes);
        },
        reject: (error: Error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((item) => item !== waiter);
        reject(new Error('Timed out waiting for the lock.'));
      }, Math.max(1, timeoutMs));
      this.waiters.push(waiter);
    });
  }

  fail(error: Error): void {
    const waiters = this.waiters.splice(0);
    this.items = [];
    for (const waiter of waiters) waiter.reject(error);
  }
}

function describeClearHeader(frame: Uint8Array): string {
  if (frame.length < 56 || frame[0] !== 0x02) return 'unparsed';
  const opcode = readU16(frame, 52);
  return `frame=0x${frame[1].toString(16)} opcode=0x${opcode.toString(16).padStart(4, '0')} seq=${readBig(frame, 36).toString()}`;
}

function operationIdHex(opcode: number, plaintext: Uint8Array): string {
  if (opcode === SHIELD_OP.PROCESS_EVENT && plaintext.length >= 16) {
    return bytesToHex(plaintext.slice(0, 16));
  }
  if (
    (opcode === SHIELD_OP.LOCK || opcode === SHIELD_OP.UNLOCK_NO_LATCH) &&
    plaintext.length >= 17 &&
    plaintext[0] === 0x00
  ) {
    return bytesToHex(plaintext.slice(1, 17));
  }
  return '-';
}

function readBig(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]);
  }
  return value;
}

export const shieldSession = new ShieldSession();

// Run with: node scripts/test-owner-reset.js
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const bleDir = path.resolve(__dirname, '../src/ble');
const loaded = new Map();

function loadTypeScript(file, mocks = {}) {
  const filename = path.join(bleDir, file);
  if (loaded.has(filename)) return loaded.get(filename);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  loaded.set(filename, mod.exports);
  const realRequire = Module.createRequire(filename);
  mod.require = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('./') || id.startsWith('../')) {
      const resolved = path.resolve(path.dirname(filename), id);
      const relative = path.relative(bleDir, resolved);
      return loadTypeScript(relative.endsWith('.ts') ? relative : `${relative}.ts`, mocks);
    }
    return realRequire(id);
  };
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  return mod.exports;
}

function memoryStorage() {
  const values = new Map();
  return {
    values,
    async getItem(key) { return values.has(key) ? values.get(key) : null; },
    async setItem(key, value) { values.set(key, String(value)); },
    async removeItem(key) { values.delete(key); },
  };
}

const LOCK_A = 'ab'.repeat(16);
const LOCK_B = 'cd'.repeat(16);
const SECRET = '11'.repeat(32);

function authChallenge(lockId, epoch, mode = 0x00) {
  const challenge = new Uint8Array(152);
  challenge[0] = 0x02;
  challenge[1] = 0x02;
  challenge[4] = 0x02;
  challenge.set(lockId, 5);
  challenge[89] = mode;
  challenge.set(epoch, 104);
  return challenge;
}

test('owner reset keeps the raw 16-byte epoch and rejects a bad result', () => {
  loaded.clear();
  const {
    ownerResetAccepted,
    ownerResetOutcome,
    ownerResetFrameReady,
    ownershipEpochFromAuthChallenge,
    claimAllowedAfterReset,
    OWNER_RESET_FRAME_LENGTH,
  } = loadTypeScript('shield/ownerReset.ts');
  const lockId = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const epoch = Uint8Array.from({ length: 16 }, (_, index) => 0xa0 + index);
  const challenge = authChallenge(lockId, epoch);
  const extracted = ownershipEpochFromAuthChallenge(challenge, lockId);
  assert.equal(extracted.length, 16);
  assert.deepEqual(Array.from(extracted), Array.from(epoch));
  assert.notEqual(extracted.buffer, epoch.buffer);
  assert.throws(() => ownershipEpochFromAuthChallenge(challenge, new Uint8Array(16)), /did not match/);
  assert.throws(() => ownershipEpochFromAuthChallenge(authChallenge(lockId, new Uint8Array(16)), lockId), /did not match/);
  assert.throws(() => ownershipEpochFromAuthChallenge(authChallenge(lockId, epoch, 0x02), lockId), /did not match/);
  assert.throws(() => ownershipEpochFromAuthChallenge(challenge.slice(0, 40), lockId), /did not match/);

  assert.equal(ownerResetOutcome(new Uint8Array([0x00])), 'success');
  assert.equal(ownerResetOutcome(new Uint8Array([0x01])), 'invalid_packet');
  assert.equal(ownerResetOutcome(new Uint8Array([0x13])), 'epoch_mismatch');
  assert.equal(ownerResetOutcome(new Uint8Array()), 'unknown');
  assert.equal(ownerResetOutcome(undefined), 'unknown');
  assert.equal(ownerResetAccepted(new Uint8Array([0x00])), true);
  assert.equal(ownerResetAccepted(new Uint8Array([0x01])), false);
  assert.equal(ownerResetAccepted(new Uint8Array([0x13])), false);
  assert.equal(claimAllowedAfterReset(true, 0x00), true);
  assert.equal(claimAllowedAfterReset(true, 0x01), false);

  const { sealCommand } = loadTypeScript('shield/codec.ts');
  const key = new Uint8Array(32).fill(7);
  const frame = sealCommand({
    key,
    role: 0x02,
    lockId,
    contextId: new Uint8Array(16).fill(3),
    sequence: 3,
    opcode: 0x0109,
    plaintext: extracted,
  });
  const empty = sealCommand({
    key,
    role: 0x02,
    lockId,
    contextId: new Uint8Array(16).fill(3),
    sequence: 3,
    opcode: 0x0109,
    plaintext: new Uint8Array(),
  });
  assert.equal(frame.length, OWNER_RESET_FRAME_LENGTH);
  assert.equal(frame[52], 0x01);
  assert.equal(frame[53], 0x09);
  assert.equal(frame[54], 0x00);
  assert.equal(frame[55], 0x10);
  assert.equal(ownerResetFrameReady(extracted, frame), true);
  assert.equal(empty.length, 72);
  assert.equal(ownerResetFrameReady(new Uint8Array(), empty), false);
  assert.notDeepEqual(Array.from(frame.slice(56, 72)), Array.from(extracted));
});

test('confirmed reset clears only that lock and keeps the failure retryable', async () => {
  loaded.clear();
  const storage = memoryStorage();
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const store = loadTypeScript('shield/store.ts', {
      '@react-native-async-storage/async-storage': { default: storage },
    });
    await store.saveOwner({
      lockIdHex: LOCK_A,
      ownerIdHex: '22'.repeat(16),
      kOwnerHex: SECRET,
      keyVersion: 1,
      enrollmentIdHex: '33'.repeat(16),
      epochHex: '44'.repeat(16),
      ackDone: true,
    });
    await store.saveOwner({
      lockIdHex: LOCK_B,
      ownerIdHex: '55'.repeat(16),
      kOwnerHex: '66'.repeat(32),
      keyVersion: 1,
      enrollmentIdHex: '77'.repeat(16),
      epochHex: '88'.repeat(16),
      ackDone: true,
    });
    await store.saveDeviceBinding('device-a', { lockIdHex: LOCK_A, peripheralId: 'phone-a' });
    await store.saveDeviceBinding('device-same-lock', { lockIdHex: LOCK_A, peripheralId: 'phone-b' });
    await store.saveDeviceBinding('device-b', { lockIdHex: LOCK_B, peripheralId: 'phone-c' });
    await store.rememberPendingLock(LOCK_A);

    assert.equal(await store.loadOwnerResetConfirmed('device-a'), null);
    await store.markOwnerResetConfirmed('device-a', LOCK_A);
    const confirmed = await store.loadOwnerResetConfirmed('device-a');
    assert.deepEqual(confirmed, { lockIdHex: LOCK_A, unclaimedVerified: false, localCleared: false });
    assert.deepEqual((await store.listOwnerLockIds()).sort(), [LOCK_A, LOCK_B].sort());

    await storage.setItem('shield-expect-unclaimed-v1', JSON.stringify({ [LOCK_A]: true }));
    await store.clearOwnerLocalRecords(LOCK_A, 'device-a');
    await store.markOwnerResetLocalCleared('device-a');
    assert.deepEqual(await store.listOwnerLockIds(), [LOCK_B]);
    assert.equal(await store.loadDeviceBinding('device-a'), null);
    assert.equal(await store.loadDeviceBinding('device-same-lock'), null);
    assert.equal((await store.loadDeviceBinding('device-b')).lockIdHex, LOCK_B);
    assert.equal(await store.loadPendingLock(), null);
    assert.equal(await store.expectsUnclaimed(LOCK_A), false);
    assert.equal((await store.loadOwnerResetConfirmed('device-a')).localCleared, true);
    assert.equal(logs.some((line) => line.includes(SECRET)), false);
    assert.equal(logs.some((line) => line.includes('Setup credential was not changed.')), true);

    await store.markOwnerResetUnclaimed('device-a');
    await store.markOwnerResetConfirmed('device-a', LOCK_A);
    assert.equal((await store.loadOwnerResetConfirmed('device-a')).localCleared, true);
    assert.equal((await store.loadOwnerResetConfirmed('device-a')).unclaimedVerified, true);
  } finally {
    console.log = original;
  }
});

test('a failed lock command does not confirm or clear the owner', async () => {
  loaded.clear();
  const calls = [];
  let connected = true;
  let failCommand = true;
  let failConfirm = false;
  const types = loadTypeScript('types.ts');
  const { smartLockService } = loadTypeScript('SmartLockService.ts', {
    './bleConfig': {},
    './bluetoothmanager': {
      setDisconnectionCallback() {},
      isConnected: () => connected,
      async disconnectFromDevice() { calls.push('disconnect'); connected = false; },
    },
    './shield/errors': {},
    './shield/ownerReset': loadTypeScript('shield/ownerReset.ts'),
    './shield/reconnect': {},
    './shield/session': {
      shieldSession: {
        async resetOwnership() {
          calls.push('command');
          if (failCommand) throw new Error('timed out waiting for the lock response');
          return LOCK_A;
        },
        onTransportLost() {},
        setProcessHandler() {},
        isLive() { return false; },
      },
    },
    './shield/store': {
      async loadOwnerResetConfirmed() {
        calls.push('load-confirmation');
        return null;
      },
      async markOwnerResetConfirmed() {
        calls.push('confirm');
        if (failConfirm) throw new Error('confirmation storage failed');
      },
      async clearOwnerLocalRecords() { calls.push('clear'); },
      async markOwnerResetLocalCleared() { calls.push('local-flag'); },
    },
    './shield/uuids': {},
    './types': types,
  });

  connected = false;
  await assert.rejects(smartLockService.resetLockOwnership('device-a'), /Connect to the lock/);
  assert.deepEqual(calls, ['load-confirmation']);

  calls.length = 0;
  connected = true;
  await assert.rejects(smartLockService.resetLockOwnership('device-a'), /timed out/);
  assert.deepEqual(calls, ['load-confirmation', 'command']);

  calls.length = 0;
  failCommand = false;
  failConfirm = true;
  await assert.rejects(smartLockService.resetLockOwnership('device-a'), /confirmation storage failed/);
  assert.deepEqual(calls, ['load-confirmation', 'command', 'confirm']);
});

test('account deletion stays after a confirmed reset in the settings action', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../app/(Lock/Unlock)/DeviceSettings.tsx'), 'utf8');
  const body = source.slice(
    source.indexOf('const handleResetOwnership'),
    source.indexOf('// Handle delete device')
  );
  const command = body.indexOf('resetLockOwnership');
  const deletion = body.indexOf('apiClient.delete');
  assert.ok(command > 0);
  assert.ok(body.indexOf("stage = 'delete'") > command);
  assert.ok(deletion > body.indexOf("stage = 'delete'"));
  assert.equal(body.includes('0x0109'), false);
});

test('a lost reset response keeps local credentials unless the lock is unclaimed', async () => {
  loaded.clear();
  const calls = [];
  let connected = true;
  let failVerify = true;
  let unknown = true;
  const saved = { current: null };
  const { OwnerResetUnknownError } = loadTypeScript('shield/ownerReset.ts');
  const types = loadTypeScript('types.ts');
  const { smartLockService } = loadTypeScript('SmartLockService.ts', {
    './bleConfig': {},
    './bluetoothmanager': {
      setDisconnectionCallback() {},
      isConnected: () => connected,
      async disconnectFromDevice() { calls.push('disconnect'); connected = false; },
    },
    './shield/errors': loadTypeScript('shield/errors.ts'),
    './shield/ownerReset': loadTypeScript('shield/ownerReset.ts'),
    './shield/reconnect': {},
    './shield/session': {
      shieldSession: {
        async resetOwnership() {
          calls.push('command');
          if (unknown) throw new OwnerResetUnknownError('timed out waiting for the lock response');
          return LOCK_A;
        },
        getLockIdHex() { return LOCK_A; },
        async verifyUnclaimed() {
          calls.push('verify');
          if (failVerify) throw new Error('lock is not unclaimed');
        },
        onTransportLost() {},
        setProcessHandler() {},
        isLive() { return false; },
      },
    },
    './shield/store': {
      async loadOwnerResetConfirmed() {
        calls.push('load-confirmation');
        return saved.current;
      },
      async markOwnerResetConfirmed(_deviceId, lockIdHex) {
        calls.push('confirm');
        saved.current = { lockIdHex, unclaimedVerified: false, localCleared: false };
      },
      async markOwnerResetUnclaimed() {
        calls.push('unclaimed');
        saved.current = { ...saved.current, unclaimedVerified: true };
      },
      async clearOwnerLocalRecords() { calls.push('clear'); },
      async markOwnerResetLocalCleared() {
        calls.push('local-flag');
        saved.current = { ...saved.current, localCleared: true };
      },
    },
    './shield/uuids': {},
    './types': types,
  });

  await assert.rejects(smartLockService.resetLockOwnership('device-a'), /not unclaimed/);
  assert.deepEqual(calls, ['load-confirmation', 'command', 'verify']);
  assert.equal(saved.current, null);

  calls.length = 0;
  failVerify = false;
  await smartLockService.resetLockOwnership('device-a');
  assert.deepEqual(calls, [
    'load-confirmation', 'command', 'verify', 'confirm', 'unclaimed',
    'load-confirmation', 'clear', 'local-flag', 'disconnect',
  ]);
  assert.equal(saved.current.localCleared, true);

  calls.length = 0;
  saved.current = null;
  unknown = false;
  connected = true;
  await smartLockService.resetLockOwnership('device-a');
  assert.deepEqual(calls, [
    'load-confirmation', 'command', 'confirm',
    'load-confirmation', 'verify', 'unclaimed', 'clear', 'local-flag', 'disconnect',
  ]);
});

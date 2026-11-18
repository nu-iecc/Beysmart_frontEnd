import AsyncStorage from '@react-native-async-storage/async-storage';
import { bytesToHex } from './bytes';
import { ownerResetLog } from './ownerReset';

const STORAGE_KEY = 'shield-test-owner-v1';
const BINDING_KEY = 'shield-device-lock-v1';
const PENDING_KEY = 'shield-pending-lock-v1';
const RESET_CONFIRMED_KEY = 'shield-owner-reset-confirmed-v1';
const EXPECT_UNCLAIMED_KEY = 'shield-expect-unclaimed-v1';
let bindingWrites: Promise<void> = Promise.resolve();

export interface StoredOwner {
  lockIdHex: string;
  ownerIdHex: string;
  kOwnerHex: string;
  keyVersion: number;
  enrollmentIdHex: string;
  epochHex: string;
  ackDone: boolean;
}

export interface DeviceLockBinding {
  lockIdHex: string;
  peripheralId: string;
}

export interface OwnerResetConfirmation {
  lockIdHex: string;
  unclaimedVerified: boolean;
  localCleared: boolean;
}

function normalize(lockIdHex: string): string {
  return lockIdHex.trim().toLowerCase();
}

async function readOwners(): Promise<Record<string, StoredOwner>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as StoredOwner & { owners?: Record<string, StoredOwner> };
  if (parsed.owners && typeof parsed.owners === 'object') {
    return parsed.owners;
  }
  if (typeof parsed.lockIdHex === 'string') {
    return { [normalize(parsed.lockIdHex)]: parsed };
  }
  return {};
}

export async function loadOwner(lockId: Uint8Array): Promise<StoredOwner | null> {
  const owners = await readOwners();
  return owners[bytesToHex(lockId)] ?? null;
}

export async function saveOwner(owner: StoredOwner): Promise<void> {
  const owners = await readOwners();
  const lockIdHex = normalize(owner.lockIdHex);
  owners[lockIdHex] = { ...owner, lockIdHex };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ owners }));
}

export async function listOwnerLockIds(): Promise<string[]> {
  return Object.keys(await readOwners());
}

async function readBindings(): Promise<Record<string, DeviceLockBinding>> {
  const raw = await AsyncStorage.getItem(BINDING_KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as Record<string, DeviceLockBinding>;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

export async function loadDeviceBinding(backendDeviceId: string): Promise<DeviceLockBinding | null> {
  const bindings = await readBindings();
  return Object.prototype.hasOwnProperty.call(bindings, backendDeviceId)
    ? bindings[backendDeviceId] ?? null : null;
}

/** Strict reconnects require a device-specific, 16-byte ProtocolInfo identity. */
export async function loadStrictDeviceBinding(backendDeviceId: string): Promise<DeviceLockBinding | null> {
  if (typeof backendDeviceId !== 'string' || !backendDeviceId.trim()) return null;
  const binding = await loadDeviceBinding(backendDeviceId);
  if (!binding || typeof binding.lockIdHex !== 'string') return null;
  const lockIdHex = normalize(binding.lockIdHex);
  if (!/^[0-9a-f]{32}$/.test(lockIdHex)) return null;
  return {
    lockIdHex,
    peripheralId: typeof binding.peripheralId === 'string' ? binding.peripheralId : '',
  };
}

function serializeBindingWrite<T>(work: () => Promise<T>): Promise<T> {
  const result = bindingWrites.then(work);
  bindingWrites = result.then(() => undefined, () => undefined);
  return result;
}

export async function saveDeviceBinding(backendDeviceId: string, binding: DeviceLockBinding): Promise<void> {
  await serializeBindingWrite(async () => {
    const bindings = await readBindings();
    bindings[backendDeviceId] = {
      lockIdHex: normalize(binding.lockIdHex),
      peripheralId: binding.peripheralId,
    };
    await AsyncStorage.setItem(BINDING_KEY, JSON.stringify(bindings));
  });
}

/** Update only the locator, and never recreate or replace a changed binding. */
export async function updateBoundPeripheral(
  backendDeviceId: string,
  expectedLockIdHex: string,
  peripheralId: string
): Promise<boolean> {
  return serializeBindingWrite(async () => {
    const bindings = await readBindings();
    const binding = Object.prototype.hasOwnProperty.call(bindings, backendDeviceId)
      ? bindings[backendDeviceId] : null;
    if (!binding || typeof binding.lockIdHex !== 'string' ||
        normalize(binding.lockIdHex) !== expectedLockIdHex) return false;
    bindings[backendDeviceId] = { ...binding, peripheralId };
    await AsyncStorage.setItem(BINDING_KEY, JSON.stringify(bindings));
    return true;
  });
}

export async function listDeviceBindings(): Promise<DeviceLockBinding[]> {
  return Object.values(await readBindings());
}

export async function rememberPendingLock(lockIdHex: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, normalize(lockIdHex));
}

export async function loadPendingLock(): Promise<string | null> {
  return AsyncStorage.getItem(PENDING_KEY);
}

/**
 * The lock already paired on this phone.
 * A device with no binding can use the only saved owner when no other device is bound.
 * It cannot take a lock that already belongs to another device.
 */
export async function resolveExpectedLock(backendDeviceId?: string): Promise<string | null> {
  if (backendDeviceId) {
    const binding = await loadDeviceBinding(backendDeviceId);
    if (binding) return binding.lockIdHex;
  }
  const owners = await listOwnerLockIds();
  const bindings = await listDeviceBindings();
  if (owners.length === 1 && bindings.length === 0) return owners[0];
  return null;
}

async function readJsonRecord(key: string): Promise<Record<string, unknown>> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    ownerResetLog(`stored record ${key} could not be read (${error instanceof Error ? error.message : 'unknown error'}).`);
    return {};
  }
}

function confirmationFrom(value: unknown): OwnerResetConfirmation | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<OwnerResetConfirmation>;
  if (typeof record.lockIdHex !== 'string') return null;
  const lockIdHex = normalize(record.lockIdHex);
  if (!/^[0-9a-f]{32}$/.test(lockIdHex)) return null;
  return {
    lockIdHex,
    unclaimedVerified: record.unclaimedVerified === true,
    localCleared: record.localCleared === true,
  };
}

export async function loadOwnerResetConfirmed(backendDeviceId: string): Promise<OwnerResetConfirmation | null> {
  if (!backendDeviceId.trim()) return null;
  const raw = (await readJsonRecord(RESET_CONFIRMED_KEY))[backendDeviceId];
  const saved = confirmationFrom(raw);
  if (raw != null && !saved) {
    ownerResetLog(`confirmation for device ${backendDeviceId} was invalid. Account device kept until a new confirmed reset.`);
  }
  return saved;
}

/** Record that 0x0109 returned success before any local or account record changes. */
export async function markOwnerResetConfirmed(backendDeviceId: string, lockIdHex: string): Promise<void> {
  const deviceId = backendDeviceId.trim();
  const confirmedLockId = normalize(lockIdHex);
  if (!deviceId || !/^[0-9a-f]{32}$/.test(confirmedLockId)) {
    throw new Error('Owner reset confirmation is missing a device or lock id.');
  }
  const all = await readJsonRecord(RESET_CONFIRMED_KEY);
  const previous = confirmationFrom(all[deviceId]);
  all[deviceId] = {
    lockIdHex: confirmedLockId,
    unclaimedVerified: previous?.lockIdHex === confirmedLockId ? previous.unclaimedVerified : false,
    localCleared: previous?.lockIdHex === confirmedLockId ? previous.localCleared : false,
  };
  await AsyncStorage.setItem(RESET_CONFIRMED_KEY, JSON.stringify(all));
  ownerResetLog(`confirmation saved for device ${deviceId} lock ${confirmedLockId}. Account device is still present.`);
}

export async function markOwnerResetUnclaimed(backendDeviceId: string): Promise<void> {
  const all = await readJsonRecord(RESET_CONFIRMED_KEY);
  const previous = confirmationFrom(all[backendDeviceId]);
  if (!previous) {
    throw new Error('No confirmed owner reset to mark as unclaimed.');
  }
  all[backendDeviceId] = { ...previous, unclaimedVerified: true };
  await AsyncStorage.setItem(RESET_CONFIRMED_KEY, JSON.stringify(all));
  ownerResetLog(`unclaimed state confirmed for device ${backendDeviceId} lock ${previous.lockIdHex}.`);
}

export async function markOwnerResetLocalCleared(backendDeviceId: string): Promise<void> {
  const all = await readJsonRecord(RESET_CONFIRMED_KEY);
  const previous = confirmationFrom(all[backendDeviceId]);
  if (!previous) {
    throw new Error('No confirmed owner reset to mark as cleared.');
  }
  all[backendDeviceId] = { ...previous, localCleared: true };
  await AsyncStorage.setItem(RESET_CONFIRMED_KEY, JSON.stringify(all));
}

export async function clearOwnerResetConfirmed(backendDeviceId: string): Promise<void> {
  const all = await readJsonRecord(RESET_CONFIRMED_KEY);
  if (!Object.prototype.hasOwnProperty.call(all, backendDeviceId)) return;
  delete all[backendDeviceId];
  await AsyncStorage.setItem(RESET_CONFIRMED_KEY, JSON.stringify(all));
}

export async function expectsUnclaimed(lockIdHex: string): Promise<boolean> {
  const lockId = normalize(lockIdHex);
  return (await readJsonRecord(EXPECT_UNCLAIMED_KEY))[lockId] === true;
}

export async function clearExpectUnclaimed(lockIdHex: string): Promise<void> {
  const lockId = normalize(lockIdHex);
  const all = await readJsonRecord(EXPECT_UNCLAIMED_KEY);
  if (all[lockId] !== true) return;
  delete all[lockId];
  await AsyncStorage.setItem(EXPECT_UNCLAIMED_KEY, JSON.stringify(all));
}

/**
 * Remove this phone's owner record after a confirmed reset.
 * Setup credentials stay in the app build, and other locks are left alone.
 */
export async function clearOwnerLocalRecords(lockIdHex: string, backendDeviceId: string): Promise<void> {
  const lockId = normalize(lockIdHex);
  if (!/^[0-9a-f]{32}$/.test(lockId)) {
    throw new Error('Owner reset local clear is missing a lock id.');
  }
  await serializeBindingWrite(async () => {
    const owners = await readOwners();
    delete owners[lockId];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ owners }));

    const bindings = await readBindings();
    for (const [id, binding] of Object.entries(bindings)) {
      if (id === backendDeviceId || (binding && normalize(binding.lockIdHex) === lockId)) {
        delete bindings[id];
      }
    }
    await AsyncStorage.setItem(BINDING_KEY, JSON.stringify(bindings));

    const pending = await AsyncStorage.getItem(PENDING_KEY);
    if (pending && normalize(pending) === lockId) {
      await AsyncStorage.removeItem(PENDING_KEY);
    }

    const expected = await readJsonRecord(EXPECT_UNCLAIMED_KEY);
    if (expected[lockId] === true) {
      delete expected[lockId];
      await AsyncStorage.setItem(EXPECT_UNCLAIMED_KEY, JSON.stringify(expected));
    }
  });
  ownerResetLog(`local owner cleared for lock ${lockId}. Setup credential was not changed.`);
}

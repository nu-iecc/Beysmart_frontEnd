import AsyncStorage from '@react-native-async-storage/async-storage';
import { bytesToHex } from './bytes';

const STORAGE_KEY = 'shield-test-owner-v1';
const BINDING_KEY = 'shield-device-lock-v1';
const PENDING_KEY = 'shield-pending-lock-v1';
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

export type ProbeOutcome = 'authenticated' | 'unavailable' | 'identity_mismatch' | 'auth_failed' | 'credentials';

export interface ReconnectProgress {
  expectedLockIdHex: string;
  cachedPeripheralId: string | null;
  tried: string[];
  discovered: string[];
  scanned: boolean;
  authenticatedPeripheralId: string | null;
  locatorUpdated: boolean;
  createdRecord: boolean;
}

export type ReconnectStep =
  | { action: 'connect'; peripheralId: string }
  | { action: 'scan' }
  | { action: 'restored'; peripheralId: string; locatorChanged: boolean }
  | { action: 'stop'; reason: 'not_found' };

export function sameLock(expected: string, observed: string): boolean {
  return expected.trim().toLowerCase() === observed.trim().toLowerCase();
}

export function beginReconnect(
  cachedPeripheralId: string | null,
  expectedLockIdHex: string
): ReconnectProgress {
  return {
    expectedLockIdHex: expectedLockIdHex.trim().toLowerCase(),
    cachedPeripheralId: cachedPeripheralId || null,
    tried: [],
    discovered: [],
    scanned: false,
    authenticatedPeripheralId: null,
    locatorUpdated: false,
    createdRecord: false,
  };
}

export function nextReconnectStep(progress: ReconnectProgress): ReconnectStep {
  if (progress.authenticatedPeripheralId) {
    return {
      action: 'restored',
      peripheralId: progress.authenticatedPeripheralId,
      locatorChanged: progress.locatorUpdated,
    };
  }
  if (progress.cachedPeripheralId && !progress.tried.includes(progress.cachedPeripheralId)) {
    return { action: 'connect', peripheralId: progress.cachedPeripheralId };
  }
  if (!progress.scanned) {
    return { action: 'scan' };
  }
  const next = progress.discovered.find((id) => !progress.tried.includes(id));
  if (!next) {
    return { action: 'stop', reason: 'not_found' };
  }
  return { action: 'connect', peripheralId: next };
}

export function noteScan(progress: ReconnectProgress, discovered: string[]): ReconnectProgress {
  return { ...progress, scanned: true, discovered, createdRecord: false };
}

/**
 * A new Bluetooth address is stored only after the registered lock authenticates.
 * A mismatch or a failed sign-in leaves the saved locator and credentials alone.
 */
export function noteProbe(
  progress: ReconnectProgress,
  peripheralId: string,
  outcome: ProbeOutcome
): ReconnectProgress {
  const tried = progress.tried.includes(peripheralId) ? progress.tried : [...progress.tried, peripheralId];
  if (outcome !== 'authenticated') {
    return { ...progress, tried, createdRecord: false };
  }
  return {
    ...progress,
    tried,
    authenticatedPeripheralId: peripheralId,
    locatorUpdated: peripheralId !== progress.cachedPeripheralId,
    createdRecord: false,
  };
}

import { equalBytes, nonzero } from './bytes';

export const OWNER_RESET_FRAME_LENGTH = 88;
export const OWNER_RESET_EPOCH_LENGTH = 16;
export const OWNER_RESET_EPOCH_OFFSET = 104;

export class OwnerResetUnknownError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OwnerResetUnknownError';
  }
}

export type OwnerResetOutcome = 'success' | 'invalid_packet' | 'epoch_mismatch' | 'rejected' | 'unknown';

/** A confirmed owner reset is plaintext result 0x00 and nothing else. */
export function ownerResetAccepted(plaintext: Uint8Array | null | undefined): boolean {
  return ownerResetOutcome(plaintext) === 'success';
}

export function ownerResetOutcome(plaintext: Uint8Array | null | undefined): OwnerResetOutcome {
  if (plaintext == null || plaintext.length < 1) return 'unknown';
  if (plaintext[0] === 0x00) return 'success';
  if (plaintext[0] === 0x01) return 'invalid_packet';
  if (plaintext[0] === 0x13) return 'epoch_mismatch';
  return 'rejected';
}

export function ownerResetFrameReady(plaintext: Uint8Array, frame: Uint8Array): boolean {
  return plaintext.length === OWNER_RESET_EPOCH_LENGTH && frame.length === OWNER_RESET_FRAME_LENGTH;
}

/**
 * Raw ownership epoch from the verified AuthTx challenge, offsets 104–119.
 * The bytes stay binary. This does not read a stored or previous session.
 */
export function ownershipEpochFromAuthChallenge(challenge: Uint8Array, lockId: Uint8Array): Uint8Array {
  if (
    challenge.length < OWNER_RESET_EPOCH_OFFSET + OWNER_RESET_EPOCH_LENGTH ||
    challenge[0] !== 0x02 ||
    challenge[1] !== 0x02 ||
    lockId.length !== 16
  ) {
    throw new Error('Ownership epoch did not match this authenticated session.');
  }
  const transcript = challenge.slice(2, 120);
  const epoch = challenge.slice(OWNER_RESET_EPOCH_OFFSET, OWNER_RESET_EPOCH_OFFSET + OWNER_RESET_EPOCH_LENGTH);
  if (
    transcript.length !== 118 ||
    transcript[2] !== 0x02 ||
    transcript[87] !== 0x00 ||
    !equalBytes(transcript.slice(3, 19), lockId) ||
    epoch.length !== OWNER_RESET_EPOCH_LENGTH ||
    !nonzero(epoch)
  ) {
    throw new Error('Ownership epoch did not match this authenticated session.');
  }
  return epoch.slice();
}

/**
 * After a confirmed reset, the next claim must observe the unclaimed phase.
 * A normal claim may also resume phase 0x01.
 */
export function claimAllowedAfterReset(expectUnclaimed: boolean, phase: number): boolean {
  if (expectUnclaimed) return phase === 0x00;
  return phase === 0x00 || phase === 0x01;
}

export function ownerResetErrorText(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
  const message = error instanceof Error && error.message ? error.message : 'unknown error';
  return typeof status === 'number' ? `${message} (HTTP ${status})` : message;
}

export function ownerResetLog(message: string): void {
  console.log(`♻️ Owner reset: ${message}`);
}

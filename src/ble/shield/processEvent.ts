import { equalBytes } from './bytes';

/** Firmware process-event values. These are used as transmitted, with no 0/1 conversion. */
export const PROCESS_SUCCESS = 2;
export const PROCESS_FAILED = 3;
export const PROCESS_IN_PROGRESS = 4;

export type ProcessMatch =
  | 'success'
  | 'failed'
  | 'in_progress'
  | 'ignored'
  | 'different_operation';

export function matchProcessEvent(
  pendingOperationId: Uint8Array,
  eventOperationId: Uint8Array,
  outcome: number
): ProcessMatch {
  if (!equalBytes(pendingOperationId, eventOperationId)) {
    return 'different_operation';
  }
  if (outcome === PROCESS_SUCCESS) return 'success';
  if (outcome === PROCESS_FAILED) return 'failed';
  if (outcome === PROCESS_IN_PROGRESS) return 'in_progress';
  return 'ignored';
}

export function isTerminalProcessMatch(match: ProcessMatch): boolean {
  return match === 'success' || match === 'failed';
}

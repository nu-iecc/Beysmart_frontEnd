import { PROCESS_FAILED, PROCESS_SUCCESS } from './processEvent';
import { ShieldCommandErrorKind } from './errors';

export type AttemptAction = 'lock' | 'unlock';

export interface PendingAttempt {
  action: AttemptAction;
  preActionLocked: boolean;
}

export interface AttemptState {
  pending: PendingAttempt | null;
}

export type AttemptLog =
  | { type: 'success'; action: AttemptAction }
  | { type: 'device_failure'; action: AttemptAction; message: string }
  | { type: 'completion_timeout'; action: AttemptAction; message: string }
  | { type: 'write_failure'; action: AttemptAction; message: string }
  | { type: 'transport_failure'; action: AttemptAction; message: string }
  | { type: 'rejected'; action: AttemptAction; message: string };

export type AttemptEvent =
  | { type: 'position'; locked: boolean }
  | { type: 'process'; state: number }
  | { type: 'command_settled'; result: number | null; errorKind?: ShieldCommandErrorKind };

export function commandErrorKind(error: unknown): ShieldCommandErrorKind {
  if (typeof error === 'object' && error !== null && 'kind' in error) {
    const kind = (error as { kind?: unknown }).kind;
    if (
      kind === 'completion_timeout' ||
      kind === 'write_failure' ||
      kind === 'transport_failure' ||
      kind === 'rejected'
    ) {
      return kind;
    }
  }
  if (error instanceof Error && error.message === 'The lock accepted the command but did not report completion.') {
    return 'completion_timeout';
  }
  return 'transport_failure';
}

/**
 * One physical operation produces at most one activity record.
 * Position updates do not count as failure. A timeout is not a write failure.
 */
export function reduceAttempt(
  state: AttemptState,
  event: AttemptEvent
): { state: AttemptState; logs: AttemptLog[]; stopTransition: boolean } {
  const pending = state.pending;
  if (!pending) {
    return { state, logs: [], stopTransition: false };
  }

  if (event.type === 'position') {
    const expectedLocked = pending.action === 'lock';
    const reachedExpected = event.locked === expectedLocked && event.locked !== pending.preActionLocked;
    if (!reachedExpected) {
      return { state, logs: [], stopTransition: false };
    }
    return {
      state: { pending: null },
      logs: [{ type: 'success', action: pending.action }],
      stopTransition: true,
    };
  }

  if (event.type === 'process') {
    if (event.state !== PROCESS_FAILED) {
      return { state, logs: [], stopTransition: false };
    }
    return {
      state: { pending: null },
      logs: [{
        type: 'device_failure',
        action: pending.action,
        message: `Lock ${pending.action} failed - device reported failure`,
      }],
      stopTransition: true,
    };
  }

  if (event.errorKind === 'completion_timeout') {
    return {
      state: { pending: null },
      logs: [{
        type: 'completion_timeout',
        action: pending.action,
        message: `Lock ${pending.action} completion timed out. The lock accepted the command but did not report completion.`,
      }],
      stopTransition: true,
    };
  }
  if (event.errorKind === 'write_failure') {
    return {
      state: { pending: null },
      logs: [{
        type: 'write_failure',
        action: pending.action,
        message: `Failed to write ${pending.action} command to device`,
      }],
      stopTransition: true,
    };
  }
  if (event.errorKind === 'transport_failure') {
    return {
      state: { pending: null },
      logs: [{
        type: 'transport_failure',
        action: pending.action,
        message: `Lock ${pending.action} failed because the Bluetooth link failed.`,
      }],
      stopTransition: true,
    };
  }
  if (event.errorKind === 'rejected') {
    return {
      state: { pending: null },
      logs: [{
        type: 'rejected',
        action: pending.action,
        message: `Lock rejected the ${pending.action} command.`,
      }],
      stopTransition: true,
    };
  }
  if (event.result === PROCESS_FAILED) {
    return {
      state: { pending: null },
      logs: [{
        type: 'device_failure',
        action: pending.action,
        message: `Lock ${pending.action} failed - device reported failure`,
      }],
      stopTransition: true,
    };
  }
  if (event.result === PROCESS_SUCCESS) {
    return { state, logs: [], stopTransition: true };
  }
  return { state, logs: [], stopTransition: false };
}

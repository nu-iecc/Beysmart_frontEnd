import { AttemptEvent, AttemptState, reduceAttempt } from './attemptLog';
import { matchProcessEvent } from './processEvent';

const operationA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const operationB = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    failed += 1;
    console.error(`FAIL ${name}\n  actual   ${left}\n  expected ${right}`);
  }
}

function run(events: AttemptEvent[]): { types: string[]; messages: string[] } {
  let state: AttemptState = {
    pending: { action: 'unlock', preActionLocked: true },
  };
  const types: string[] = [];
  const messages: string[] = [];
  for (const event of events) {
    const reduced = reduceAttempt(state, event);
    state = reduced.state;
    for (const entry of reduced.logs) {
      types.push(entry.type);
      if (entry.type !== 'success') messages.push(entry.message);
    }
  }
  return { types, messages };
}

check('success outcome', matchProcessEvent(operationA, operationA, 2), 'success');
check('confirmed failure outcome', matchProcessEvent(operationA, operationA, 3), 'failed');
check('in progress does not finish', matchProcessEvent(operationA, operationA, 4), 'in_progress');
check('old success value is ignored', matchProcessEvent(operationA, operationA, 1), 'ignored');
check('zero outcome is ignored', matchProcessEvent(operationA, operationA, 0), 'ignored');
check('other operation is kept apart', matchProcessEvent(operationA, operationB, 2), 'different_operation');

const success = run([
  { type: 'process', state: 4 },
  { type: 'position', locked: true },
  { type: 'process', state: 2 },
  { type: 'position', locked: false },
  { type: 'command_settled', result: 2 },
]);
check('success logs once', success, { types: ['success'], messages: [] });

const successWithoutMove = run([
  { type: 'process', state: 4 },
  { type: 'process', state: 2 },
  { type: 'command_settled', result: 2 },
  { type: 'position', locked: false },
]);
check('late position still records one success', successWithoutMove, {
  types: ['success'],
  messages: [],
});

const confirmed = run([
  { type: 'position', locked: true },
  { type: 'process', state: 3 },
  { type: 'command_settled', result: 3 },
]);
check('confirmed failure logs once', confirmed, {
  types: ['device_failure'],
  messages: ['Lock unlock failed - device reported failure'],
});

const timeout = run([
  { type: 'position', locked: true },
  { type: 'position', locked: true },
  { type: 'command_settled', result: null, errorKind: 'completion_timeout' },
  { type: 'command_settled', result: 3 },
  { type: 'command_settled', result: null, errorKind: 'write_failure' },
]);
check('timeout is not a second failure', timeout, {
  types: ['completion_timeout'],
  messages: [
    'Lock unlock completion timed out. The lock accepted the command but did not report completion.',
  ],
});

const write = run([
  { type: 'command_settled', result: null, errorKind: 'write_failure' },
]);
check('write failure logs once', write, {
  types: ['write_failure'],
  messages: ['Failed to write unlock command to device'],
});

const transport = run([
  { type: 'command_settled', result: null, errorKind: 'transport_failure' },
]);
check('transport failure is not a write failure', transport.messages.some((message) => message.includes('Failed to write')), false);
check('transport failure logs once', transport.types, ['transport_failure']);

if (failed > 0) {
  console.error(`${failed} event-flow checks failed`);
  process.exit(1);
}
console.log('Shield event flow checks passed.');

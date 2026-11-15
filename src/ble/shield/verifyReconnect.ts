import {
  beginReconnect,
  nextReconnectStep,
  noteProbe,
  noteScan,
  ReconnectProgress,
} from './reconnect';

let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) {
    failed += 1;
    console.error(`FAIL ${name}\n  actual   ${left}\n  expected ${right}`);
  }
}

function replay(
  cached: string | null,
  discovered: string[],
  probes: Record<string, 'authenticated' | 'unavailable' | 'identity_mismatch' | 'auth_failed' | 'credentials'>
): { peripheralId: string | null; locatorChanged: boolean; createdRecord: boolean; reason?: string } {
  let progress: ReconnectProgress = beginReconnect(cached, 'aabbccddeeff00112233445566778899');
  for (let guard = 0; guard < 12; guard += 1) {
    const step = nextReconnectStep(progress);
    if (step.action === 'restored') {
      return {
        peripheralId: step.peripheralId,
        locatorChanged: step.locatorChanged,
        createdRecord: progress.createdRecord,
      };
    }
    if (step.action === 'stop') {
      return { peripheralId: null, locatorChanged: false, createdRecord: false, reason: step.reason };
    }
    if (step.action === 'scan') {
      progress = noteScan(progress, discovered);
      continue;
    }
    const outcome = probes[step.peripheralId] ?? 'unavailable';
    if (outcome === 'auth_failed' || outcome === 'credentials') {
      progress = noteProbe(progress, step.peripheralId, outcome);
      return {
        peripheralId: null,
        locatorChanged: progress.locatorUpdated,
        createdRecord: progress.createdRecord,
        reason: outcome,
      };
    }
    progress = noteProbe(progress, step.peripheralId, outcome);
  }
  return { peripheralId: null, locatorChanged: false, createdRecord: false, reason: 'not_found' };
}

check('normal reconnect keeps the locator', replay('peripheral-a', [], {
  'peripheral-a': 'authenticated',
}), {
  peripheralId: 'peripheral-a',
  locatorChanged: false,
  createdRecord: false,
});

check('power cycle updates the locator after authentication', replay('peripheral-old', ['peripheral-old', 'peripheral-new', 'other-lock'], {
  'peripheral-old': 'unavailable',
  'peripheral-new': 'authenticated',
  'other-lock': 'identity_mismatch',
}), {
  peripheralId: 'peripheral-new',
  locatorChanged: true,
  createdRecord: false,
});

check('another lock is skipped', replay(null, ['other-lock', 'registered-lock'], {
  'other-lock': 'identity_mismatch',
  'registered-lock': 'authenticated',
}), {
  peripheralId: 'registered-lock',
  locatorChanged: true,
  createdRecord: false,
});

check('rejected credentials do not replace the locator', replay('peripheral-a', ['peripheral-b'], {
  'peripheral-a': 'auth_failed',
}), {
  peripheralId: null,
  locatorChanged: false,
  createdRecord: false,
  reason: 'auth_failed',
});

check('missing credential does not create a lock', replay('peripheral-a', ['peripheral-b'], {
  'peripheral-a': 'credentials',
}), {
  peripheralId: null,
  locatorChanged: false,
  createdRecord: false,
  reason: 'credentials',
});

check('nothing nearby reports not found', replay('peripheral-old', ['peripheral-old'], {
  'peripheral-old': 'unavailable',
}), {
  peripheralId: null,
  locatorChanged: false,
  createdRecord: false,
  reason: 'not_found',
});

if (failed > 0) {
  console.error(`${failed} reconnect checks failed`);
  process.exit(1);
}
console.log('Shield reconnect checks passed.');

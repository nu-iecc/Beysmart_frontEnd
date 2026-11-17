// Run with: node scripts/test-lock-control-binding.js
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

// Exercise the actual screen callback without loading the React Native runtime.
const filename = path.resolve(__dirname, '../app/(Lock/Unlock)/LockControlScreen.tsx');
const source = fs.readFileSync(filename, 'utf8');
const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let callback;
let errorClass;
let messageFunction;
function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(file) === 'openRegisteredLock') {
    callback = node.initializer.arguments[0].getText(file);
  }
  if (ts.isClassDeclaration(node) && node.name?.text === 'NoRegisteredLockBindingError') errorClass = node.getText(file);
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'registeredLockMessage') messageFunction = node.getText(file);
  ts.forEachChild(node, visit);
}
visit(file);
assert.ok(callback && errorClass && messageFunction, 'Screen reconnect callback and error handling must exist');
const code = ts.transpileModule(`${errorClass}\n${messageFunction}\nreturn { openRegisteredLock: ${callback}, registeredLockMessage };`, {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;
const createCallback = new Function('deviceId', 'loadDeviceBinding', 'smartLockService', 'getConnectedDevice',
  'deviceBleIdRef', 'ownedDeviceRef', 'apiClient', 'ShieldIdentityError', code);

function setup({ deviceId = 'device-1', binding = { lockIdHex: 'aabb' }, resultLockId = 'aabb', load } = {}) {
  const calls = { loads: [], reconnects: [], disconnects: 0, patches: 0 };
  const owned = { current: null };
  const locator = { current: 'cached-locator' };
  let connected = null;
  let onConnected;
  const service = {
    isConnected: () => connected !== null,
    async disconnect() { calls.disconnects++; connected = null; },
    on(event, listener) {
      assert.equal(event, 'connected');
      onConnected = listener;
      return () => { onConnected = undefined; };
    },
    // Deliberately behaves like the service's single-credential fallback.
    async reconnectRegisteredLock(input) {
      calls.reconnects.push(input);
      connected = { id: 'peripheral-1' };
      onConnected();
      return { peripheralId: connected.id, lockIdHex: resultLockId, locatorChanged: false };
    },
  };
  const readBinding = async (id) => {
    calls.loads.push(id);
    return load ? load(id) : binding;
  };
  class ShieldIdentityError extends Error {}
  const screen = createCallback(deviceId, readBinding, service, () => connected, locator, owned,
    { patch: async () => { calls.patches++; } }, ShieldIdentityError);
  return { ...screen, calls, owned, getConnected: () => connected };
}

test('missing device-specific binding cannot invoke credential fallback', async () => {
  for (const binding of [null, {}, { lockIdHex: '' }, { lockIdHex: '  ' }, { lockIdHex: 123 }]) {
    const screen = setup({ binding });
    await assert.rejects(screen.openRegisteredLock(() => true), (error) => {
      assert.match(screen.registeredLockMessage(error), /no registered lock binding/i);
      return true;
    });
    assert.deepEqual(screen.calls.loads, ['device-1']);
    assert.equal(screen.calls.reconnects.length, 0);
    assert.equal(screen.owned.current, null);
  }
  for (const deviceId of ['', ' ', null, ['device-1']]) {
    const screen = setup({ deviceId });
    await assert.rejects(screen.openRegisteredLock(() => true), /no registered lock binding/i);
    assert.equal(screen.calls.loads.length, 0);
    assert.equal(screen.calls.reconnects.length, 0);
  }
});

test('a binding permits reconnect without requiring a saved peripheral locator', async () => {
  const screen = setup({ binding: { lockIdHex: ' AABB ' }, resultLockId: 'aabb' });
  assert.equal(await screen.openRegisteredLock(() => true), true);
  assert.deepEqual(screen.calls.reconnects, [{ backendDeviceId: 'device-1', cachedPeripheralId: 'cached-locator', strictBackendBinding: true }]);
  assert.equal(screen.owned.current, screen.getConnected());
});

test('a changed lock identity is disconnected and never adopted', async () => {
  const screen = setup({ resultLockId: 'ccdd' });
  await assert.rejects(screen.openRegisteredLock(() => true), /does not match the device binding/i);
  assert.equal(screen.calls.disconnects, 1);
  assert.equal(screen.getConnected(), null);
  assert.equal(screen.owned.current, null);
  assert.equal(screen.calls.patches, 0);
});

test('storage failure or a stale screen cannot trigger reconnect', async () => {
  const failure = setup({ load: async () => { throw new Error('Storage unavailable'); } });
  await assert.rejects(failure.openRegisteredLock(() => true), /Storage unavailable/);
  assert.equal(failure.calls.reconnects.length, 0);
  let current = true;
  const stale = setup({ load: async () => { current = false; return { lockIdHex: 'aabb' }; } });
  assert.equal(await stale.openRegisteredLock(() => current), false);
  assert.equal(stale.calls.reconnects.length, 0);
});
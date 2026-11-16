// Run with: node scripts/test-shield-status.js
/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const bleDir = path.resolve(__dirname, '../src/ble');
function loadTypeScript(file, mocks = {}) {
  const filename = path.join(bleDir, file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`Unexpected dependency: ${id}`);
  };
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  return mod.exports;
}

test('Shield status resets unknown cached values without extra runtime events', async () => {
  const types = loadTypeScript('types.ts');
  let onStatus;
  let disconnect;
  let response;
  const shieldSession = {
    setProcessHandler() {},
    async prepare(handler) { onStatus = handler; handler(response, 'status'); },
    async status() { onStatus(response, 'status'); },
    isLive() { return true; },
    onTransportLost() {},
  };
  const { smartLockService: service } = loadTypeScript('SmartLockService.ts', {
    './bleConfig': {},
    './bluetoothmanager': { setDisconnectionCallback(callback) { disconnect = callback; } },
    './shield/errors': {},
    './shield/reconnect': {},
    './shield/session': { shieldSession },
    './shield/store': {},
    './shield/uuids': {},
    './types': types,
  });
  const positions = [];
  const initialStates = [];
  service.on('lockPositionChanged', ({ lockPosition }) => positions.push(lockPosition));
  service.on('initialStateLoaded', ({ state }) => initialStates.push(state));
  const status = (lock, door = 0x00, battery = 80) => ({
    lock, door, battery, process: 0xff, calibration: 0xff,
  });

  // Seed state from one device, then simulate disconnect and a new connection.
  response = status(2);
  await service.prepareShieldSession();
  assert.equal(service.getState().lockPosition, types.LockPosition.CLOSED_LOCKED_POSITION);
  disconnect();
  response = status(0xff, 0xff, null);
  await service.prepareShieldSession();
  assert.equal(initialStates.at(-1).lockPosition, types.LockPosition.UNKNOWN);
  assert.equal(service.getState().lockPosition, types.LockPosition.UNKNOWN);
  assert.equal(initialStates.at(-1).doorState, types.DoorState.UNKNOWN);
  assert.equal(initialStates.at(-1).batteryLevel, 0);
  assert.deepEqual(positions, [2]);

  // Both unknown encodings clear previously known positions on refresh.
  for (const unknown of [0x00, 0xff]) {
    response = status(3, 0x01, 42);
    await service.refreshState();
    response = status(unknown, 0x01, 0);
    await service.refreshState();
    assert.equal(initialStates.at(-1).lockPosition, types.LockPosition.UNKNOWN);
    assert.equal(initialStates.at(-1).doorState, types.DoorState.CLOSED);
    assert.equal(initialStates.at(-1).batteryLevel, 0);
  }

  // Unknown runtime events are ignored, including their placeholder fields.
  response = status(4, 0x00, 55);
  await service.refreshState();
  const previous = service.getState();
  const eventCount = positions.length;
  const initialCount = initialStates.length;
  for (const unknown of [0x00, 0xff]) onStatus(status(unknown, 0xff, null), 'event');
  assert.deepEqual(service.getState(), previous);
  assert.equal(positions.length, eventCount);
  assert.equal(initialStates.length, initialCount);

  // Known runtime positions keep their existing event behavior.
  onStatus(status(5, 0xff, null), 'event');
  assert.equal(positions.at(-1), 5);
  assert.equal(service.getState().lockPosition, 5);
  assert.equal(service.getState().doorState, types.DoorState.OPEN);
  assert.equal(service.getState().batteryLevel, 55);
  assert.equal(initialStates.length, initialCount);
});
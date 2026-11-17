// Run with: node --test scripts/test-guest-flow.js
// TypeScript is transpiled in memory; every app dependency is an explicit mock.
// No network, native modules, credentials, or persistent storage are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const BASE_URL = 'https://example.invalid/api/';

function load(file, mocks = {}) {
  const filename = path.join(root, file);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`Unexpected dependency in ${file}: ${id}`);
  };
  const source = fs.readFileSync(filename, 'utf8');
  mod._compile(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React,
    esModuleInterop: true,
  } }).outputText, filename);
  return mod.exports;
}

function locksWith(get) {
  return load('services/locks.ts', {
    '@/constants/api': { BASE_URL },
    '@/utils/api': { default: { get }, __esModule: true },
  });
}

test('lock roles fail closed and explicit roles override ownership hints', () => {
  const { deviceRole } = locksWith(() => { throw new Error('unexpected request'); });
  assert.equal(deviceRole({ role: 'guest', is_owner: true }), 'guest');
  assert.equal(deviceRole({ role: 'unexpected', is_owner: true }), undefined);
  assert.equal(deviceRole({ access_role: 'owner' }), 'owner');
  assert.equal(deviceRole({ is_owner: true }), 'owner');
  assert.equal(deviceRole({ is_owner: false }), undefined);
});

test('device pages are combined and deduplicated; unsafe and cyclic links are rejected', async () => {
  const calls = [];
  const responses = [
    { status: 200, data: { results: [{ id: 1 }, { id: 2 }], next: '?page=2' } },
    { status: 200, data: { results: [{ id: '2' }, { id: 3 }], next: null } },
  ];
  const service = locksWith(async url => { calls.push(url); return responses.shift(); });
  assert.deepEqual(await service.getAccessibleDevices(), [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(calls, [`${BASE_URL}home/devices/`, `${BASE_URL}home/devices/?page=2`]);
  for (const next of ['https://evil.invalid/api/home/devices/', '/other/', '?page=1']) {
    let count = 0;
    const unsafe = locksWith(async () => {
      count++;
      return { status: 200, data: { results: [], next } };
    });
    await assert.rejects(unsafe.getAllPages('home/devices/?page=1'), /Invalid pagination link/);
    assert.equal(count, 1);
  }
});

test('metadata 403 does not use a rejected response and malformed pages fail', async () => {
  let config;
  const denied = locksWith(async (_url, options) => { config = options; return { status: 403 }; });
  await assert.rejects(denied.getAllPages('home/homes/', true), /Metadata access denied/);
  assert.equal(config.validateStatus(403), true);
  assert.equal(config.validateStatus(401), false);
  const malformed = locksWith(async () => ({ status: 200, data: { results: {}, next: null } }));
  await assert.rejects(malformed.getAllPages('home/devices/'), /Invalid paginated response/);
});

test('invalid email credentials must not trigger the session-expiry redirect', async () => {
  let onResponseSuccess;
  let onResponseError;
  let response;
  let rejectedResponses = 0;
  const timers = [];
  const redirects = [];
  const removed = [];
  const client = {
    interceptors: { request: { use() {} }, response: { use(success, failure) { onResponseSuccess = success; onResponseError = failure; } } },
    async post(_url, _data, config = {}) {
      const validateStatus = config.validateStatus || (status => status >= 200 && status < 300);
      if (validateStatus(response.status)) return onResponseSuccess(response);
      rejectedResponses++;
      return onResponseError({ response });
    },
  };
  const storage = { async multiRemove(keys) { removed.push(...keys); } };
  const api = load('services/api.ts', {
    '@/constants/api': { API_BASE_URL: 'https://example.invalid' },
    '@react-native-async-storage/async-storage': { __esModule: true, default: storage },
    axios: { __esModule: true, default: { create: () => client } },
    'expo-router': { router: { replace: route => redirects.push(route) } },
  }).default;
  const auth = load('services/auth.ts', {
    '@/constants/api': { API_ENDPOINTS: { LOGIN: '/api/auth/login/' } },
    '@/constants/errors': { SUCCESS_MESSAGES: {} }, './api': { __esModule: true, default: api },
  }).authAPI;
  const originalTimer = global.setTimeout;
  try {
    global.setTimeout = (callback, delay) => { timers.push({ callback, delay }); };
    for (const status of [401, 403]) {
      response = { status, data: { success: true, user: { id: 9 }, error: 'Invalid credentials' } };
      const result = await auth.login({ email: 'guest@example.com', password: 'wrong' });
      assert.equal(result.success, false);
      assert.equal(result.error, 'Invalid credentials');
    }
    response = { status: 401, data: null };
    assert.deepEqual(await auth.login({ email: 'guest@example.com', password: 'wrong' }), { success: false });
    assert.equal(rejectedResponses, 0);
    timers.filter(timer => timer.delay === 100).forEach(timer => timer.callback());
    assert.deepEqual(removed, []);
    assert.deepEqual(redirects, []);

    response = { status: 400, data: { success: true, error: 'Bad request' } };
    assert.deepEqual(await auth.login({ email: 'guest@example.com', password: 'wrong' }),
      { success: false, error: 'Bad request' });
    assert.equal(rejectedResponses, 1);
    assert.deepEqual(removed, []);

    response = { status: 500, data: null };
    assert.deepEqual(await auth.login({ email: 'guest@example.com', password: 'wrong' }), { success: false });
    assert.equal(rejectedResponses, 2);

    response = { status: 200, data: { success: true, user: { id: 9 } } };
    assert.deepEqual(await auth.login({ email: 'guest@example.com', password: 'correct' }), response.data);

    response = { status: 401, data: {} };
    await assert.rejects(client.post('/protected/'));
    timers.filter(timer => timer.delay === 100).forEach(timer => timer.callback());
    assert.deepEqual(removed, ['userData', 'csrftoken', 'isAuthenticated', 'loginMethod']);
    assert.deepEqual(redirects, ['/(auth)/welcome']);
  } finally {
    global.setTimeout = originalTimer;
  }
});

// Minimal deterministic hook renderer: components produce an inspectable element
// tree; native/design components are never executed. Effects run on render with
// dependency cleanup. This exercises the actual screen closures, not copied logic.
function screen(file, options = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let tree;
  let focused = true;
  const requests = [];
  const navigation = [];
  const alerts = [];
  const toasts = [];
  const storage = new Map([['userData', JSON.stringify({ id: 42 })]]);
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'Fragment',
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useCallback: callback => callback,
    useEffect(callback, deps) {
      const i = cursor++;
      const previous = slots[i];
      if (!previous || !deps || deps.some((item, index) => !Object.is(item, previous.deps[index]))) {
        effects.push(() => {
          previous?.cleanup?.();
          slots[i] = { deps, cleanup: callback() };
        });
      }
    },
  };
  const storageMock = {
    async getItem(key) { return storage.get(key) ?? null; },
    async setItem(key, value) { storage.set(key, value); },
    async multiSet(entries) { for (const [key, value] of entries) storage.set(key, value); },
    async removeItem(key) { storage.delete(key); },
  };
  const router = {
    replace: value => navigation.push(value), push: value => navigation.push(value), back() {},
  };
  const api = {
    async get(url, config) {
      requests.push({ method: 'get', url, config });
      return options.get ? options.get(url, config) : { status: 200, data: { role: 'owner' } };
    },
    async post(url, data, config) {
      requests.push({ method: 'post', url, data, config });
      if (!options.post) throw new Error('Unexpected post');
      return options.post(url, data, config);
    },
  };
  const biometric = {
    async resetBiometricAttempts() { if (options.biometricError) throw new Error('biometric unavailable'); },
    async isFirstLogin() { return false; }, async canSetupBiometrics() { return false; },
  };
  const colors = { primary: {}, text: '', secondaryText: '', disabled: '', error: '' };
  const constants = {
    AUTH_COUNTRIES: [{ code: 'EG', dial: '+20', name: 'Egypt' }],
    AUTH_COPY: { completeRegistration: { buttons: {} } },
    AUTH_TEXT: {}, AUTH_THEME: {}, AUTH_VISUALS: { completeRegistration: { backIcon: 'Back', headerIcon: 'Header' } },
  };
  const defaultModule = value => ({ __esModule: true, default: value });
  const native = { Alert: { alert: (...args) => alerts.push(args) }, StyleSheet: { create: x => x },
    View: 'View', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity', ActivityIndicator: 'ActivityIndicator' };
  const password = load('utils/passwordValidation.ts');
  const lockService = locksWith(async () => { throw new Error('Unexpected lock request'); });
  const mocks = {
    react: { __esModule: true, default: react, ...react }, 'react-native': native,
    '@react-native-async-storage/async-storage': defaultModule(storageMock),
    '@react-navigation/native': { useNavigation: () => ({ isFocused: () => focused }), useIsFocused: () => focused,
      useFocusEffect: callback => react.useEffect(callback, []) },
    'expo-router': { router, useRouter: () => router, useLocalSearchParams: () => options.params || {} },
    axios: { __esModule: true, default: {}, isAxiosError: error => !!error?.isAxiosError },
    '@/utils/api': defaultModule(api), '../../utils/api': defaultModule(api),
    '@/services': { authAPI: { login: options.login || (() => { throw new Error('Unexpected login'); }) }, biometricsService: biometric },
    '../../services': { biometricsService: biometric }, '@/services/locks': lockService,
    '@/constants/api': { BASE_URL }, '../../constants/api': { BASE_URL },
    '@/constants/Login': { LOGIN_STRINGS: { emailLogin: { title: '', subtitle: '', fields: {}, actions: { login: 'Log in' } } } },
    '@/constants/errors': { ERROR_MESSAGES: { LOGIN_FAILED: 'Login failed', UNEXPECTED_ERROR: 'Unexpected error', NETWORK_ERROR: 'Network error' } },
    '@/components/AuthScreen': defaultModule('AuthScreen'), '@/components/BiometricSetupModal': defaultModule('BiometricModal'),
    '../../components/BiometricSetupModal': defaultModule('BiometricModal'),
    '@/components/LockSubpage': { __esModule: true, default: 'LockSubpage', subpageStyles: {} },
    '@/design-system': { AppButton: 'AppButton', Typography: 'Typography', colors, Spacing: {} },
    '@/design-system/colors/colors': { colors }, '../../design-system/colors': { colors },
    '@/design-system/Layout': { Grid: {}, Margin: {}, Padding: {} },
    '@/design-system/icons/filled/BackIcon': defaultModule('Back'), '@/design-system/icons/filled/HomeIcon': defaultModule('Home'),
    '@/design-system/inputs/TextField': defaultModule('TextField'),
    '../../design-system/inputs': { TextField: 'TextField' },
    '../../design-system/auth/constants': constants, '../../design-system/Buttons/Buttons': { AppButton: 'AppButton' },
    '../../design-system/Layout/margins': { Margin: {} }, '../../design-system/Layout/padding': { Padding: {} },
    '../../design-system/Layout/spacing': { Spacing: {} }, '../../design-system/typography/typography': { Typography: 'Typography' },
    '../../utils/passwordValidation': password, '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'sonner-native': { toast: { success: message => toasts.push(['success', message]), error: message => toasts.push(['error', message]) } },
  };
  const Component = load(file, mocks).default;
  function render() {
    cursor = 0;
    effects = [];
    tree = Component();
    const pending = effects;
    effects = [];
    pending.forEach(effect => effect());
    return tree;
  }
  function find(predicate) {
    const matches = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (predicate(node)) matches.push(node);
      walk(node.props?.children);
    }
    walk(tree);
    return matches;
  }
  function byProp(key, value) {
    const matches = find(node => node.props?.[key] === value);
    assert.equal(matches.length, 1, `Expected one ${key}=${value}, got ${matches.length}`);
    return matches[0];
  }
  render();
  return { render, find, byProp, requests, navigation, alerts, toasts, storage,
    setFocus(value) { focused = value; render(); } };
}

const flush = () => new Promise(resolve => setImmediate(resolve));
function setField(s, label, value) { s.byProp('label', label).props.onChangeText(value); s.render(); }
function press(s, title) { return s.byProp('title', title).props.onPress(); }

test('invitation code sends normalized email and routes only to guest completion', async () => {
  const s = screen('app/(auth)/emaillogin.tsx', { post: async () => ({ status: 200, data: { next: 'create_password' } }) });
  const toggle = s.find(node => node.type === 'TouchableOpacity' && node.props.accessibilityRole === 'button')[0];
  toggle.props.onPress(); s.render();
  const fields = s.find(node => node.type === 'TextField');
  fields[0].props.onChangeText('  Guest@Example.com '); fields[1].props.onChangeText('1234'); s.render();
  await press(s, 'Verify invitation');
  assert.deepEqual(s.requests[0].data, { email: 'guest@example.com', otp: '1234' });
  assert.deepEqual(s.navigation, [{ pathname: '/(auth)/Complete-Registeration', params: { email: 'guest@example.com', flow: 'guest-invite' } }]);
});

test('invalid invitation code does not navigate or authenticate', async () => {
  const s = screen('app/(auth)/emaillogin.tsx', { post: async (_url, _data, config) => {
    assert.equal(config.validateStatus(403), true);
    return { status: 403, data: {} };
  } });
  s.find(node => node.type === 'TouchableOpacity' && node.props.accessibilityRole === 'button')[0].props.onPress(); s.render();
  const fields = s.find(node => node.type === 'TextField');
  fields[0].props.onChangeText('guest@example.com'); fields[1].props.onChangeText('1234'); s.render();
  await press(s, 'Verify invitation'); s.render();
  assert.deepEqual(s.navigation, []);
  assert.equal(s.storage.has('isAuthenticated'), false);
  assert.ok(s.find(node => node.props?.children?.includes('Invitation verification failed. Please check your email and code and try again.')).length);
});

test('successful password login stores the user and navigates home', async () => {
  let credentials;
  const s = screen('app/(auth)/emaillogin.tsx', { login: async data => {
    credentials = data;
    return { success: true, user: { id: 9 } };
  } });
  const fields = s.find(node => node.type === 'TextField');
  fields[0].props.onChangeText(' guest@example.com '); fields[1].props.onChangeText('Example1!'); s.render();
  await press(s, 'Log in');
  assert.deepEqual(credentials, { email: 'guest@example.com', password: 'Example1!' });
  assert.equal(s.storage.get('isAuthenticated'), 'true');
  assert.equal(JSON.parse(s.storage.get('userData')).email, 'guest@example.com');
  assert.deepEqual(s.navigation, ['/(app)/home']);
});

test('guest completion rejects responses without a user', async () => {
  const s = screen('app/(auth)/Complete-Registeration.tsx', { params: { flow: 'guest-invite', email: 'guest@example.com' },
    post: async () => ({ status: 200, data: { success: true } }) });
  setField(s, 'First name', 'Guest'); setField(s, 'Last name', 'Example'); setField(s, 'Phone number', '123456789');
  setField(s, 'Password', 'Example1!'); setField(s, 'Confirm Password', 'Example1!');
  await press(s, 'Save password and continue');
  assert.equal(s.storage.has('isAuthenticated'), false);
  assert.equal(s.navigation.length, 0);
  assert.equal(s.alerts[0][0], 'Unable to complete sign in');
});

test('guest completion remains successful if optional biometrics fail', async () => {
  const s = screen('app/(auth)/Complete-Registeration.tsx', { params: { flow: 'guest-invite', email: 'guest@example.com' },
    biometricError: true, post: async () => ({ status: 200, data: { success: true, user: { id: 9 } } }) });
  setField(s, 'First name', ' Guest '); setField(s, 'Last name', ' Example '); setField(s, 'Phone number', '0123456789');
  setField(s, 'Password', 'Example1!'); setField(s, 'Confirm Password', 'Example1!');
  await press(s, 'Save password and continue');
  assert.deepEqual(s.requests[0].data, { first_name: 'Guest', last_name: 'Example', email: 'guest@example.com',
    phone_number: '+20123456789', password: 'Example1!', confirm_password: 'Example1!', user_type: 'CUSTOMER' });
  assert.equal(s.storage.get('isAuthenticated'), 'true');
  assert.deepEqual(s.navigation, ['/(app)/home']);
});

test('owner invite rechecks role and sends normalized email', async () => {
  const s = screen('app/(app)/lock-invite.tsx', { params: { deviceId: 'lock/1' }, post: async () => ({ status: 200, data: { pending: true } }) });
  await flush(); s.render();
  setField(s, 'Guest email', ' Guest@Example.com ');
  setField(s, 'Phone number (optional)', ' +20 123456 ');
  await press(s, 'Send invitation');
  assert.equal(s.requests.filter(x => x.method === 'get').length, 2);
  assert.equal(s.requests[2].url, 'home/devices/lock%2F1/invite-guest/');
  assert.deepEqual(s.requests[2].data, { invitee_email: 'guest@example.com', invitee_phone: '+20 123456', role: 'guest' });
  assert.deepEqual(s.toasts, [['success', 'Invitation code sent.']]);
});

test('revoked owner cannot invite after the form was opened', async () => {
  let checks = 0;
  const s = screen('app/(app)/lock-invite.tsx', { params: { deviceId: '1' },
    get: async () => ({ status: 200, data: { role: ++checks === 1 ? 'owner' : 'guest' } }) });
  await flush(); s.render(); setField(s, 'Guest email', 'guest@example.com');
  await press(s, 'Send invitation'); s.render();
  assert.equal(s.requests.filter(x => x.method === 'post').length, 0);
  assert.ok(s.find(node => node.props?.children?.includes('Owner access required')).length);
});

test('failed login response with a user must not authenticate', async () => {
  const s = screen('app/(auth)/emaillogin.tsx', { login: async () => ({ success: false, user: { id: 9 } }) });
  const fields = s.find(node => node.type === 'TextField');
  fields[0].props.onChangeText('guest@example.com'); fields[1].props.onChangeText('wrong'); s.render();
  await press(s, 'Log in');
  assert.equal(s.storage.has('isAuthenticated'), false);
  assert.equal(s.navigation.length, 0);
});

test('biometric setup failure must not strand an already authenticated email login', async () => {
  const s = screen('app/(auth)/emaillogin.tsx', { biometricError: true, login: async () => ({ success: true, user: { id: 9 } }) });
  const fields = s.find(node => node.type === 'TextField');
  fields[0].props.onChangeText('guest@example.com'); fields[1].props.onChangeText('Example1!'); s.render();
  await press(s, 'Log in');
  assert.equal(s.storage.get('isAuthenticated'), 'true');
  assert.deepEqual(s.navigation, ['/(app)/home']);
});

test('guest completion must reject user objects without an identity', async () => {
  const s = screen('app/(auth)/Complete-Registeration.tsx', { params: { flow: 'guest-invite', email: 'guest@example.com' },
    post: async () => ({ status: 200, data: { success: true, user: { email: 'guest@example.com' } } }) });
  setField(s, 'First name', 'Guest'); setField(s, 'Last name', 'Example'); setField(s, 'Phone number', '123456789');
  setField(s, 'Password', 'Example1!'); setField(s, 'Confirm Password', 'Example1!');
  await press(s, 'Save password and continue');
  assert.equal(s.storage.has('isAuthenticated'), false);
  assert.equal(s.navigation.length, 0);
});

test('invite response explicitly reporting failure must not show success', async () => {
  const s = screen('app/(app)/lock-invite.tsx', { params: { deviceId: '1' }, post: async () => ({ status: 200, data: { success: false } }) });
  await flush(); s.render(); setField(s, 'Guest email', 'guest@example.com');
  await press(s, 'Send invitation');
  assert.equal(s.toasts.some(([kind]) => kind === 'success'), false);
});

test('temporary owner-detail server errors should remain retryable', async () => {
  let checks = 0;
  const s = screen('app/(app)/lock-invite.tsx', { params: { deviceId: '1' }, get: async () => {
    if (++checks === 1) return { status: 200, data: { role: 'owner' } };
    throw Object.assign(new Error('Server error'), { isAxiosError: true, response: { status: 500 } });
  } });
  await flush(); s.render(); setField(s, 'Guest email', 'guest@example.com');
  await press(s, 'Send invitation'); s.render();
  assert.equal(s.find(node => node.props?.children?.includes('Owner access required')).length, 0);
});

test('an invite response after leaving the screen must not display a stale toast', async () => {
  let resolvePost;
  const s = screen('app/(app)/lock-invite.tsx', { params: { deviceId: '1' },
    post: () => new Promise(resolve => { resolvePost = resolve; }) });
  await flush(); s.render(); setField(s, 'Guest email', 'guest@example.com');
  const sending = press(s, 'Send invitation');
  await flush();
  assert.equal(typeof resolvePost, 'function');
  s.setFocus(false);
  resolvePost({ status: 200, data: { pending: true } });
  await sending;
  assert.deepEqual(s.toasts, []);
});
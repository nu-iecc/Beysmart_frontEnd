/**
 * Test-build credential for Project Shield V2.
 *
 * Paste the 32-byte K_setup from the embedded team as 64 hex characters.
 * The placeholder below is rejected on connect so a wrong key is not sent.
 * Reset of a half-claimed lock stays with the embedded team.
 */
export const SHIELD_TEST_K_SETUP_HEX =
  '997BF6EEC7B65A7EF14ABF8E5F9179C9768706FF23B4E29427374701B0DAF494';

const PLACEHOLDER = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

export function readTestKSetup(): Uint8Array {
  const hex = SHIELD_TEST_K_SETUP_HEX.trim().toLowerCase();
  if (hex === PLACEHOLDER) {
    throw new Error(
      'Set SHIELD_TEST_K_SETUP_HEX in src/ble/shield/testConfig.ts to this lock\'s K_setup (64 hex characters).'
    );
  }
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error('SHIELD_TEST_K_SETUP_HEX must be exactly 64 hex characters (32 bytes).');
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

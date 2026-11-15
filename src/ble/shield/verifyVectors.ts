import fs from 'fs';
import path from 'path';
import { bytesToHex, hexToBytes } from './bytes';
import { sealCommand } from './codec';
import { deriveSessionKeys, gcmEncrypt, gcmNonce } from './crypto';

const doc = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../Project-Shield-Access-V2-H1-Test-Vectors.json'), 'utf8')
);

function readBig(bytes: Uint8Array, offset: number): bigint {
  let value = 0n;
  for (let i = 0; i < 8; i++) {
    value = (value << 8n) | BigInt(bytes[offset + i]);
  }
  return value;
}

let failed = 0;
const check = (name: string, actual: string, expected: string) => {
  if (actual !== expected) {
    failed += 1;
    console.error(`FAIL ${name}\n  actual   ${actual}\n  expected ${expected}`);
  }
};

for (const vector of doc.vectors) {
  const transcript = hexToBytes(vector.transcript);
  const keys = deriveSessionKeys(hexToBytes(vector.synthetic_credential), transcript);
  check(`${vector.name} salt`, bytesToHex(keys.salt), vector.salt);
  check(`${vector.name} PRK`, bytesToHex(keys.prk), vector.PRK);
  check(`${vector.name} K_lock_proof`, bytesToHex(keys.kLockProof), vector.K_lock_proof);
  check(`${vector.name} K_app_proof`, bytesToHex(keys.kAppProof), vector.K_app_proof);
  check(`${vector.name} K_c2l`, bytesToHex(keys.kC2l), vector.K_c2l);
  check(`${vector.name} K_l2c`, bytesToHex(keys.kL2c), vector.K_l2c);
  check(`${vector.name} lock_proof`, bytesToHex(keys.lockProof), vector.lock_proof);
  check(`${vector.name} app_proof`, bytesToHex(keys.appProof), vector.app_proof);

  for (const frameName of ['auth_ok', 'command', 'response', 'guest_result'] as const) {
    const frame = vector[frameName];
    if (!frame) continue;
    const header = hexToBytes(frame.header);
    const direction = header[2];
    const sequence = Number(readBig(header, 36));
    const plaintext = frame.plaintext ? hexToBytes(frame.plaintext) : new Uint8Array();
    const key = direction === 0x00 ? keys.kC2l : keys.kL2c;
    const sealed = gcmEncrypt(key, gcmNonce(direction, sequence), header, plaintext);
    check(`${vector.name} ${frameName} ciphertext`, bytesToHex(sealed.ciphertext), frame.ciphertext);
    check(`${vector.name} ${frameName} tag`, bytesToHex(sealed.tag), frame.tag);
  }
}

const owner = doc.vectors[0];
const ownerTranscript = hexToBytes(owner.transcript);
const ownerKeys = deriveSessionKeys(hexToBytes(owner.synthetic_credential), ownerTranscript);
const ownerFrame = sealCommand({
  key: ownerKeys.kC2l,
  role: 0x02,
  lockId: hexToBytes('000102030405060708090a0b0c0d0e0f'),
  contextId: hexToBytes('b0b1b2b3b4b5b6b7b8b9babbbcbdbebf'),
  sequence: 0,
  opcode: 0x0001,
  plaintext: new Uint8Array(),
});
check('owner lock frame', bytesToHex(ownerFrame), owner.command.frame);

if (failed > 0) {
  console.error(`${failed} vector checks failed`);
  process.exit(1);
}
console.log(`Shield vectors matched (${doc.vectors.length} sessions).`);

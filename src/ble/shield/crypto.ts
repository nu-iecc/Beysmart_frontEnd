import { gcm } from '@noble/ciphers/aes.js';
import { expand, extract } from '@noble/hashes/hkdf.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { ascii, concat, equalBytes } from './bytes';

export interface SessionKeys {
  salt: Uint8Array;
  prk: Uint8Array;
  kLockProof: Uint8Array;
  kAppProof: Uint8Array;
  kC2l: Uint8Array;
  kL2c: Uint8Array;
  lockProof: Uint8Array;
  appProof: Uint8Array;
}

export function sha256Bytes(data: Uint8Array): Uint8Array {
  return sha256(data);
}

export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  return hmac(sha256, key, message);
}

export function deriveSessionKeys(kRole: Uint8Array, transcript: Uint8Array): SessionKeys {
  const digest = sha256(transcript);
  const salt = sha256(concat(ascii('PS_ACCESS_V2_SALT'), transcript));
  const prk = extract(sha256, kRole, salt);
  const expandKey = (label: string) => expand(sha256, prk, concat(ascii(label), digest), 32);

  const kLockProof = expandKey('PS_ACCESS_V2_LOCK_PROOF');
  const kAppProof = expandKey('PS_ACCESS_V2_APP_PROOF');
  const kC2l = expandKey('PS_ACCESS_V2_C2L');
  const kL2c = expandKey('PS_ACCESS_V2_L2C');

  return {
    salt,
    prk,
    kLockProof,
    kAppProof,
    kC2l,
    kL2c,
    lockProof: hmacSha256(kLockProof, concat(ascii('PS_ACCESS_V2_LOCK_AUTH'), transcript)),
    appProof: hmacSha256(kAppProof, concat(ascii('PS_ACCESS_V2_APP_AUTH'), transcript)),
  };
}

export function verifyLockProof(kRole: Uint8Array, transcript: Uint8Array, lockProof: Uint8Array): SessionKeys {
  const keys = deriveSessionKeys(kRole, transcript);
  if (!equalBytes(keys.lockProof, lockProof)) {
    throw new Error('Lock proof did not match. The stored owner key is not valid for this lock.');
  }
  return keys;
}

export function gcmNonce(direction: number, sequence: number): Uint8Array {
  const nonce = new Uint8Array(12);
  const view = new DataView(nonce.buffer);
  view.setUint32(0, direction, false);
  view.setBigUint64(4, BigInt(sequence), false);
  return nonce;
}

export function gcmEncrypt(
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array,
  plaintext: Uint8Array
): { ciphertext: Uint8Array; tag: Uint8Array } {
  const sealed = gcm(key, nonce, aad).encrypt(plaintext);
  return {
    ciphertext: sealed.slice(0, sealed.length - 16),
    tag: sealed.slice(sealed.length - 16),
  };
}

export function gcmDecrypt(
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array
): Uint8Array {
  return gcm(key, nonce, aad).decrypt(concat(ciphertext, tag));
}

export function claimBindingProof(kSetup: Uint8Array, challenge: Uint8Array): Uint8Array {
  return hmacSha256(kSetup, concat(ascii('PS_CLAIM_BIND_V2'), challenge));
}

export function originalClaimProof(kSetup: Uint8Array, lockId: Uint8Array, originalNonce: Uint8Array): Uint8Array {
  return hmacSha256(kSetup, concat(ascii('OWNER_CLAIM_V1'), lockId, originalNonce));
}

export function claimSessionKey(kSetup: Uint8Array, lockId: Uint8Array, originalNonce: Uint8Array): Uint8Array {
  return hmacSha256(kSetup, concat(ascii('CLAIM_SESSION_V1'), lockId, originalNonce));
}

export function decryptOwnerKey(
  kClaim: Uint8Array,
  lockId: Uint8Array,
  ownerId: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  tag: Uint8Array
): Uint8Array {
  const aad = concat(ascii('PROJECT_SHIELD_OWNER_DELIVERY_V1'), lockId, ownerId);
  const key = gcmDecrypt(kClaim, iv, aad, ciphertext, tag);
  if (key.length !== 32 || !key.some((byte) => byte !== 0)) {
    throw new Error('Owner credential from Claim was empty.');
  }
  return key;
}

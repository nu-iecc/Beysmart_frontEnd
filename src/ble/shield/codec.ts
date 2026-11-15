import { SENTINEL_REF, concat, writeU16, writeU32, writeU64 } from './bytes';
import { gcmEncrypt, gcmNonce } from './crypto';

export function buildClaimStart(lockId: Uint8Array, nonceApp: Uint8Array): Uint8Array {
  return concat(new Uint8Array([0xc1, 0x20]), lockId, nonceApp);
}

export function buildClaimProof(
  enrollmentId: Uint8Array,
  bindingProof: Uint8Array,
  originalProof: Uint8Array
): Uint8Array {
  return concat(new Uint8Array([0xc1, 0x22]), enrollmentId, bindingProof, originalProof);
}

export function buildAuthStart(input: {
  role: number;
  lockId: Uint8Array;
  userId: Uint8Array;
  keyVersion: number;
  nonceApp: Uint8Array;
  mode: number;
}): Uint8Array {
  return concat(
    new Uint8Array([0x02, 0x01, input.role]),
    input.lockId,
    input.userId,
    writeU32(input.keyVersion),
    input.nonceApp,
    new Uint8Array([input.mode, 0x00]),
    writeU64(0n),
    new Uint8Array([0x00])
  );
}

export function buildAppProof(contextId: Uint8Array, appProof: Uint8Array): Uint8Array {
  return concat(new Uint8Array([0x02, 0x03]), contextId, appProof);
}

export function buildHeader(input: {
  kind: number;
  direction: number;
  role: number;
  lockId: Uint8Array;
  contextId: Uint8Array;
  sequence: number;
  reference: Uint8Array;
  opcode: number;
  payloadLength: number;
}): Uint8Array {
  return concat(
    new Uint8Array([0x02, input.kind, input.direction, input.role]),
    input.lockId,
    input.contextId,
    writeU64(BigInt(input.sequence)),
    input.reference,
    writeU16(input.opcode),
    writeU16(input.payloadLength)
  );
}

export function sealCommand(input: {
  key: Uint8Array;
  role: number;
  lockId: Uint8Array;
  contextId: Uint8Array;
  sequence: number;
  opcode: number;
  plaintext: Uint8Array;
}): Uint8Array {
  const header = buildHeader({
    kind: 0x10,
    direction: 0x00,
    role: input.role,
    lockId: input.lockId,
    contextId: input.contextId,
    sequence: input.sequence,
    reference: SENTINEL_REF,
    opcode: input.opcode,
    payloadLength: input.plaintext.length,
  });
  const { ciphertext, tag } = gcmEncrypt(
    input.key,
    gcmNonce(0x00, input.sequence),
    header,
    input.plaintext
  );
  return concat(header, ciphertext, tag);
}

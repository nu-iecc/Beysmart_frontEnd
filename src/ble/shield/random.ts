import { Buffer } from 'buffer';
import { requireNativeModule } from 'expo-modules-core';

type ExpoCryptoModule = {
  getRandomBase64StringAsync: (length: number) => Promise<string>;
};

/**
 * Protocol nonces come from SecRandomCopyBytes through
 * ExpoCrypto.getRandomBase64StringAsync. A failure is returned as a normal error.
 */
export async function randomBytes(length: number): Promise<Uint8Array> {
  const ExpoCrypto = requireNativeModule<ExpoCryptoModule>('ExpoCrypto');

  let base64: string;
  try {
    base64 = await ExpoCrypto.getRandomBase64StringAsync(length);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Secure random failed.';
    throw new Error(message);
  }

  const bytes = new Uint8Array(Buffer.from(base64, 'base64'));
  if (bytes.length !== length || !bytes.some((byte) => byte !== 0)) {
    return randomBytes(length);
  }
  return bytes;
}

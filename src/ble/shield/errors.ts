export type ShieldCommandErrorKind =
  | 'completion_timeout'
  | 'write_failure'
  | 'transport_failure'
  | 'rejected';

export type ShieldIdentityErrorKind = 'identity_mismatch' | 'credentials' | 'auth_failed';

export class ShieldIdentityError extends Error {
  readonly kind: ShieldIdentityErrorKind;

  constructor(message: string, kind: ShieldIdentityErrorKind) {
    super(message);
    this.name = 'ShieldIdentityError';
    this.kind = kind;
  }
}

export class ShieldCommandError extends Error {
  readonly kind: ShieldCommandErrorKind;

  constructor(message: string, kind: ShieldCommandErrorKind) {
    super(message);
    this.name = 'ShieldCommandError';
    this.kind = kind;
  }
}

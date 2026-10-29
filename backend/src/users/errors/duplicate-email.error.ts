export class DuplicateEmailError extends Error {
  constructor(message = 'Email already registered') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

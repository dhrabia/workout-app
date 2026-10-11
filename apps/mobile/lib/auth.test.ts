import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { AuthFormError, isValidEmail, signInWithEmail, signUpWithEmail } from './auth';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { auth: { signUp: jest.fn(), signInWithPassword: jest.fn() } } }));

const signUp = supabase.auth.signUp as jest.Mock;
const signInWithPassword = supabase.auth.signInWithPassword as jest.Mock;
const credentials = { email: 'tester@example.com', password: 'password1' };

const GENERIC = 'Something went wrong. Please try again.';
const GENERIC_ONLY = /^Something went wrong\. Please try again\.$/;
const INVALID_CREDENTIALS = /^Invalid email or password\. Please try again\.$/;

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('tester@example.com')).toBe(true);
  });

  it.each(['', 'tester', 'tester@', '@example.com', 'tester@example', 'te ster@example.com'])(
    'rejects %p',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    }
  );
});

// Behaviour both flows share: one request, friendly mapped errors, no leaked details.
describe.each([
  ['signUpWithEmail', signUpWithEmail, signUp],
  ['signInWithEmail', signInWithEmail, signInWithPassword],
])('%s', (_name, run, request: jest.Mock) => {
  beforeEach(() => request.mockReset());

  it('resolves when Supabase returns a session', async () => {
    request.mockResolvedValue({ data: { session: { access_token: 'token' }, user: {} }, error: null });

    await expect(run(credentials)).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(credentials);
  });

  it.each([
    ['a rate limit', new AuthApiError('Rate limit', 429, 'over_request_rate_limit'), /Too many attempts/],
    ['an email rate limit', new AuthApiError('Rate limit', 429, 'over_email_send_rate_limit'), /Too many attempts/],
    ['an invalid email', new AuthApiError('Invalid email', 400, 'email_address_invalid'), /valid email/],
    ['a malformed email', new AuthApiError('Unable to validate email address', 400, 'validation_failed'), /valid email/],
    ['a network failure', new AuthRetryableFetchError('Failed to fetch', 0), /No internet connection/],
    [
      'an unexpected server error (without leaking its details)',
      new AuthApiError('relation "auth.users" does not exist', 500, 'unexpected_failure'),
      GENERIC_ONLY,
    ],
  ])('maps %s to a friendly message', async (_case, error, message) => {
    request.mockResolvedValue({ data: { session: null, user: null }, error });

    const result = run(credentials);
    await expect(result).rejects.toBeInstanceOf(AuthFormError);
    await expect(result).rejects.toThrow(message);
  });

  it('falls back to a generic message when the request itself throws', async () => {
    request.mockRejectedValue(new TypeError('Network request failed'));

    await expect(run(credentials)).rejects.toThrow(GENERIC);
  });
});

describe('signUpWithEmail errors', () => {
  beforeEach(() => signUp.mockReset());

  it.each([
    ['an email that is already registered', new AuthApiError('User already registered', 422, 'user_already_exists'), /already exists/],
    ['a weak password', new AuthApiError('Password is too weak', 422, 'weak_password'), /stronger password/],
  ])('maps %s to a friendly message', async (_case, error, message) => {
    signUp.mockResolvedValue({ data: { session: null, user: null }, error });

    await expect(signUpWithEmail(credentials)).rejects.toThrow(message);
  });

  it('reports a missing session as email confirmation being required', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { id: 'user-id' } }, error: null });

    await expect(signUpWithEmail(credentials)).rejects.toThrow(/Email confirmation is required/);
  });
});

describe('signInWithEmail errors', () => {
  beforeEach(() => signInWithPassword.mockReset());

  it.each([
    ['wrong credentials', new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'), INVALID_CREDENTIALS],
    ['an unknown account', new AuthApiError('User not found', 400, 'user_not_found'), INVALID_CREDENTIALS],
    ['an unconfirmed email', new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'), /hasn't been confirmed/],
  ])('maps %s to a friendly message', async (_case, error, message) => {
    signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error });

    await expect(signInWithEmail(credentials)).rejects.toThrow(message);
  });

  it('treats a missing session without an error as a generic failure', async () => {
    signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error: null });

    await expect(signInWithEmail(credentials)).rejects.toThrow(GENERIC);
  });
});

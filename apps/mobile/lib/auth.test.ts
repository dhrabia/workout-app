import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { isValidEmail, SignUpError, signUpWithEmail } from './auth';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { auth: { signUp: jest.fn() } } }));

const signUp = supabase.auth.signUp as jest.Mock;
const credentials = { email: 'tester@example.com', password: 'password1' };

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

describe('signUpWithEmail', () => {
  beforeEach(() => signUp.mockReset());

  it('resolves when Supabase returns a session', async () => {
    signUp.mockResolvedValue({ data: { session: { access_token: 'token' }, user: {} }, error: null });

    await expect(signUpWithEmail(credentials)).resolves.toBeUndefined();
    expect(signUp).toHaveBeenCalledWith(credentials);
  });

  it.each([
    ['an email that is already registered', new AuthApiError('User already registered', 422, 'user_already_exists'), /already exists/],
    ['a weak password', new AuthApiError('Password is too weak', 422, 'weak_password'), /stronger password/],
    ['a rate limit', new AuthApiError('Rate limit', 429, 'over_request_rate_limit'), /Too many attempts/],
    ['an email rate limit', new AuthApiError('Rate limit', 429, 'over_email_send_rate_limit'), /Too many attempts/],
    ['an invalid email', new AuthApiError('Invalid email', 400, 'email_address_invalid'), /valid email/],
    ['a malformed email', new AuthApiError('Unable to validate email address', 400, 'validation_failed'), /valid email/],
    ['a network failure', new AuthRetryableFetchError('Failed to fetch', 0), /No internet connection/],
    [
      'an unexpected server error (without leaking its details)',
      new AuthApiError('duplicate key value violates constraint "users_pkey"', 500, 'unexpected_failure'),
      /^Something went wrong\. Please try again\.$/,
    ],
  ])('maps %s to a friendly message', async (_name, error, message) => {
    signUp.mockResolvedValue({ data: { session: null, user: null }, error });

    const result = signUpWithEmail(credentials);
    await expect(result).rejects.toBeInstanceOf(SignUpError);
    await expect(result).rejects.toThrow(message);
  });

  it('falls back to a generic message when the request itself throws', async () => {
    signUp.mockRejectedValue(new TypeError('Network request failed'));

    await expect(signUpWithEmail(credentials)).rejects.toThrow('Something went wrong. Please try again.');
  });

  it('reports a missing session as email confirmation being required', async () => {
    signUp.mockResolvedValue({ data: { session: null, user: { id: 'user-id' } }, error: null });

    await expect(signUpWithEmail(credentials)).rejects.toThrow(/Email confirmation is required/);
  });
});

import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

import { supabase } from "./supabase";

// Client-side pre-check; the server enforces its own (possibly lower) minimum.
export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type Credentials = { email: string; password: string };

// Always carries a message that is safe to show to the user.
export class AuthFormError extends Error {}

const GENERIC_ERROR = "Something went wrong. Please try again.";
const OFFLINE_ERROR = "No internet connection. Check your connection and try again.";

// Messages by Supabase error code. Anything not listed falls back to GENERIC_ERROR.
type ErrorMessages = Partial<Record<string, string>>;

const SHARED_ERRORS: ErrorMessages = {
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  over_email_send_rate_limit: "Too many attempts. Please wait a moment and try again.",
  email_address_invalid: "Enter a valid email address.",
  validation_failed: "Enter a valid email address.",
};

const SIGN_UP_ERRORS: ErrorMessages = {
  user_already_exists: "An account with this email already exists.",
  email_exists: "An account with this email already exists.",
  weak_password: "Choose a stronger password.",
  signup_disabled: "Registration is currently unavailable.",
  email_provider_disabled: "Registration is currently unavailable.",
};

// invalid_credentials covers both a wrong password and an unknown email, so
// the form doesn't tell the two apart.
const SIGN_IN_ERRORS: ErrorMessages = {
  invalid_credentials: "Invalid email or password. Please try again.",
  user_not_found: "Invalid email or password. Please try again.",
  email_not_confirmed: "Your email address hasn't been confirmed yet.",
};

function errorMessage(error: AuthError, flowErrors: ErrorMessages) {
  if (isAuthRetryableFetchError(error)) return OFFLINE_ERROR;
  const code = error.code ?? "";
  return SHARED_ERRORS[code] ?? flowErrors[code] ?? GENERIC_ERROR;
}

async function requestSession(
  request: () => Promise<{ data: { session: unknown }; error: AuthError | null }>,
  flowErrors: ErrorMessages
) {
  let result;
  try {
    result = await request();
  } catch {
    throw new AuthFormError(GENERIC_ERROR);
  }

  if (result.error) throw new AuthFormError(errorMessage(result.error, flowErrors));
  return result.data.session;
}

export async function signUpWithEmail(credentials: Credentials) {
  const session = await requestSession(() => supabase.auth.signUp(credentials), SIGN_UP_ERRORS);

  // With "Confirm email" enabled Supabase creates the user but returns no
  // session until the address is confirmed, which this flow can't complete.
  if (!session) {
    throw new AuthFormError("Email confirmation is required for this project, which isn't supported yet.");
  }
}

export async function signInWithEmail(credentials: Credentials) {
  const session = await requestSession(() => supabase.auth.signInWithPassword(credentials), SIGN_IN_ERRORS);
  if (!session) throw new AuthFormError(GENERIC_ERROR);
}

// "local" ends only this device's session (the default "global" would also
// sign the user out everywhere else). supabase-js drops the stored session
// even when the revoke request fails, so a returned error needs no handling.
export async function signOut() {
  await supabase.auth.signOut({ scope: "local" });
}

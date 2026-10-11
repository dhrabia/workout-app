import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";

import { supabase } from "./supabase";

// Client-side pre-check; the server enforces its own (possibly lower) minimum.
export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Always carries a message that is safe to show to the user.
export class SignUpError extends Error {}

const GENERIC_ERROR = "Something went wrong. Please try again.";

function signUpErrorMessage(error: AuthError) {
  if (isAuthRetryableFetchError(error)) {
    return "No internet connection. Check your connection and try again.";
  }
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists.";
    case "email_address_invalid":
    case "validation_failed":
      return "Enter a valid email address.";
    case "weak_password":
      return "Choose a stronger password.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a moment and try again.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "Registration is currently unavailable.";
    default:
      return GENERIC_ERROR;
  }
}

export async function signUpWithEmail({ email, password }: { email: string; password: string }) {
  let result;
  try {
    result = await supabase.auth.signUp({ email, password });
  } catch {
    throw new SignUpError(GENERIC_ERROR);
  }

  if (result.error) throw new SignUpError(signUpErrorMessage(result.error));

  // With "Confirm email" enabled Supabase creates the user but returns no
  // session until the address is confirmed, which this flow can't complete.
  if (!result.data.session) {
    throw new SignUpError("Email confirmation is required for this project, which isn't supported yet.");
  }
}

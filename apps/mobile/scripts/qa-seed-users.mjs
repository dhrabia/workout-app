// Creates (or restores) the QA test accounts used by the Maestro flows.
//
//   pnpm --filter mobile qa:seed            create missing accounts, reset profiles of existing ones
//   pnpm --filter mobile qa:seed --reset    delete and recreate them, wiping all their data
//   pnpm --filter mobile qa:seed --cleanup  also delete throwaway accounts created by sign-up flows
//
// Needs EXPO_PUBLIC_SUPABASE_URL (from .env) plus SUPABASE_SERVICE_ROLE_KEY and
// QA_PASSWORD (from .env.local, see .env.local.example). The service role key
// bypasses row-level security, so it must never end up in .env or the app bundle.
import { createClient } from '@supabase/supabase-js';

const QA_DOMAIN = '@example.com';
// Sign-up flows register `qa-signup-<timestamp>@example.com`; --cleanup removes them.
const SIGNUP_PREFIX = 'qa-signup-';

// Keep in sync with the "Test accounts" table in .claude/skills/qa/SKILL.md.
const TEST_USERS = [
  {
    // Fresh account: signed up, onboarding questionnaire not done, no data.
    email: `qa-new${QA_DOMAIN}`,
    profile: {
      username: null,
      gender: null,
      age: null,
      height_cm: null,
      target_weight_kg: null,
      goal_start_weight_kg: null,
      onboarding_completed: false,
    },
  },
  {
    // Returning user with a filled-in profile.
    email: `qa-onboarded${QA_DOMAIN}`,
    profile: {
      username: 'QA Onboarded',
      gender: 'male',
      age: 30,
      height_cm: 180,
      target_weight_kg: 75,
      goal_start_weight_kg: null,
      onboarding_completed: true,
    },
  },
];

const { EXPO_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, QA_PASSWORD: password } = process.env;
const missing = Object.entries({ EXPO_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, QA_PASSWORD: password })
  .filter(([, value]) => !value)
  .map(([name]) => name);
if (missing.length > 0) {
  console.error(`Missing ${missing.join(', ')}. Copy .env.local.example to .env.local and fill it in.`);
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const reset = args.has('--reset');
const cleanup = args.has('--cleanup');

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listQaUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  // Only ever touch accounts on the reserved QA domain.
  return users.filter((user) => user.email?.startsWith('qa-') && user.email.endsWith(QA_DOMAIN));
}

async function deleteUser(user) {
  // Deleting the auth user cascades to the profile and every row the user owns.
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw error;
}

async function ensureUser({ email, profile }, existing) {
  let user = existing;
  if (user && reset) {
    await deleteUser(user);
    user = undefined;
  }

  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }

  // The on_auth_user_created trigger has already inserted the profile row.
  const { error } = await supabase.from('profiles').update(profile).eq('id', user.id);
  if (error) throw error;

  console.log(`${existing && !reset ? 'updated' : 'created'}  ${email}`);
}

const qaUsers = await listQaUsers();
const byEmail = new Map(qaUsers.map((user) => [user.email, user]));

for (const testUser of TEST_USERS) {
  await ensureUser(testUser, byEmail.get(testUser.email));
}

if (cleanup) {
  const throwaway = qaUsers.filter((user) => user.email.startsWith(SIGNUP_PREFIX));
  for (const user of throwaway) {
    await deleteUser(user);
    console.log(`deleted  ${user.email}`);
  }
  if (throwaway.length === 0) console.log('no sign-up accounts to clean up');
}

import { createContext, useContext, useState } from 'react';

import { useProfile } from '@/hooks/queries/use-profile';
import { snapToWeightWheel } from '@/lib/profile-fields';
import type { Gender } from '@/lib/types';

// The profile setup questionnaire shown after sign-up (app/setup/). Answers
// live in this shared draft while the user moves between steps, so going Back
// never loses anything, and are written to the database together once the
// last data step is confirmed (see useSaveProfileSetup).

export const PROFILE_SETUP_STEPS = ['gender', 'age', 'height', 'weight', 'target-weight'] as const;
export type ProfileSetupStep = (typeof PROFILE_SETUP_STEPS)[number];

export type ProfileSetupDraft = {
  gender: Gender | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
};

type ProfileSetupContextValue = {
  draft: ProfileSetupDraft;
  update: (changes: Partial<ProfileSetupDraft>) => void;
  // Bumped by reset(), so inputs keyed on it remount with fresh values.
  resetKey: number;
  reset: () => void;
};

const EMPTY_DRAFT: ProfileSetupDraft = {
  gender: null,
  age: null,
  heightCm: null,
  weightKg: null,
  targetWeightKg: null,
};

const ProfileSetupContext = createContext<ProfileSetupContextValue | null>(null);

export function ProfileSetupProvider({ children }: { children: React.ReactNode }) {
  const { data: profile } = useProfile();

  // Seeded from whatever is already saved, so a user who quit mid-way (e.g. on
  // the All Set screen, before tapping through) resumes with their answers.
  const [draft, setDraft] = useState<ProfileSetupDraft>(() => ({
    gender: profile?.gender ?? null,
    age: profile?.age ?? null,
    heightCm: profile?.height_cm ?? null,
    // Onboarding saves the current weight as the goal's baseline too.
    weightKg: profile?.goal_start_weight_kg != null ? snapToWeightWheel(profile.goal_start_weight_kg) : null,
    targetWeightKg: profile?.target_weight_kg != null ? snapToWeightWheel(profile.target_weight_kg) : null,
  }));

  const [resetKey, setResetKey] = useState(0);

  function update(changes: Partial<ProfileSetupDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setResetKey((key) => key + 1);
  }

  return (
    <ProfileSetupContext.Provider value={{ draft, update, resetKey, reset }}>{children}</ProfileSetupContext.Provider>
  );
}

export function useProfileSetup() {
  const value = useContext(ProfileSetupContext);
  if (!value) throw new Error('useProfileSetup must be used inside ProfileSetupProvider');
  return value;
}

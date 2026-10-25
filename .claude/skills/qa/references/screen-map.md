# Screen map

Routes are Expo Router files under `apps/mobile/app`. `testID`s listed here are the ones a flow needs to drive each screen; `<id>` is a database id. When this map and the code disagree, the code wins: update this file in the same PR.

To check that a `testID` exists: `grep -rn 'testID="<id>"' apps/mobile/app apps/mobile/components`.

## App start

- No session → onboarding (`app/onboarding/*`). A session (after sign-up or log-in) → tabs, starting on **Plans**.
- While the stored session loads, a spinner shows: `app-loading`.
- The tab bar is native (`NativeTabs`) and has no `testID`s: tap the labels **Plans**, **Workout**, **Body**, **Profile**.
- On iOS, logging in shows the system "Save Password?" sheet (buttons "Not Now" / "Save"). It covers the app, so nothing underneath can be found until it is dismissed.

## Onboarding and auth (`app/onboarding`)

| Screen | Route | Key testIDs |
| --- | --- | --- |
| Welcome | `welcome` | `welcome-get-started-button`; copy "Your training." / "Your progress." |
| Create account | `create-account` | `create-account-back-button`, `create-account-email-button`, `create-account-login-button`; `create-account-apple-button` and `create-account-google-button` are placeholders that do nothing yet |
| Email sign-up | `email-sign-up` | `signup-back-button`, `signup-email-input`, `signup-email-error`, `signup-password-input`, `signup-password-visibility-toggle`, `signup-error-message`, `signup-submit-button` |
| Log in | `log-in` | `login-back-button`, `login-email-input`, `login-email-error`, `login-password-input`, `login-password-visibility-toggle`, `login-error-message`, `login-submit-button`, `login-create-account-link` |

Behavior worth testing:
- Submit buttons stay disabled until the email is valid and the password is filled in (sign-up: at least 6 characters, with the helper text "Must be at least 6 characters.").
- `*-email-error` appears after leaving an invalid email field.
- Server errors (wrong password, email taken) show in `*-error-message` and clear when either field is edited.
- Success needs no extra step: the app swaps onboarding for the tabs.
- Not built yet: the onboarding questionnaire (`profiles.onboarding_completed` is stored but unused), Apple/Google sign-in, password reset, email confirmation.

## Plans tab (`app/(tabs)/plans`, `app/plans`)

| Screen | Route | Key testIDs |
| --- | --- | --- |
| Plans list | `(tabs)/plans` | `plans-create-button`, `plan-card-<id>`, `plan-<id>-active-pill`; context menu action `plan-<id>-set-active` |
| Plan form (modal) | `plans/form` | `plan-form-close-button`, `plan-form-name-input`, `plan-form-description-input`, `plan-form-save-button` |
| Plan detail | `plans/[planId]` | `plan-add-day-button`, `day-card-<id>` |
| Day form (modal) | `plans/[planId]/days/form` | `day-form-close-button`, `day-form-name-input`, `day-form-save-button` |
| Day detail | `plans/[planId]/days/[dayId]` | `day-add-exercise-button`, `exercise-row-<id>` |
| Muscle group picker (modal) | `…/exercises/categories` | `categories-close-button`, `muscle-group-tile-<group>` |
| Exercise picker (modal) | `…/exercises/picker` | `picker-close-button`, `picker-search-input`, `picker-create-custom-button`, `exercise-picker-row-<id>` |
| Exercise in day (modal) | `…/exercises/form` | `exercise-form-close-button`, `exercise-form-delete-button`, steppers `exercise-form-sets` / `-reps` / `-weight` / `-rest` (each with `-minus`, `-plus`, `-value`), `exercise-form-notes-input`, `exercise-form-save-button` |
| New custom exercise (modal) | `exercises/new` | `new-exercise-close-button`, `new-exercise-name-input`, `muscle-group-chip-<group>`, `new-exercise-equipment-input`, `new-exercise-save-button` |

Plans, days and exercises can be reordered by dragging; long-press opens the context menu (`context-menu`).

## Workout tab (`app/(tabs)/workout`, `app/workout`)

| Screen | Route | Key testIDs |
| --- | --- | --- |
| Workout home | `(tabs)/workout` | segments `workout-tab-plans` / `workout-tab-history`; `workout-next-day-card`, `workout-start-button`, `workout-plan-row-<id>`; history: `workout-history-filter-button`, `workout-history-filter-<option>`, `workout-history-row-<id>` |
| Pick a day | `workout/[planId]` | `start-workout-day-<id>`, `start-workout-button` |
| Session | `workout/[planId]/[dayId]` | `start-next-exercise-button`, `session-exercise-row-<id>`, `session-exercise-row-<id>-toggle` |
| Exercise in session | `workout/[planId]/[dayId]/[planExerciseId]` | `exercise-session-reps`, `exercise-session-weight` (with `-minus` / `-plus`), `exercise-session-set-<direction>`, `log-set-button`; rest timer: `rest-pause-button`, `rest-skip-button`; after the last set: `exercise-completed-pill`, `exercise-completed-next-card`, `exercise-completed-rest-card`, `exercise-completed-skip-button`; finishing the workout: `workout-complete-save-button` |

Needs an active plan with at least one day and exercise. The first plan a user creates becomes active.

## Body tab (`app/(tabs)/body`, `app/body`)

| Screen | Route | Key testIDs |
| --- | --- | --- |
| Body | `(tabs)/body` | `body-log-weight-button`, `body-set-target-button`, `body-weight-history-button`, `body-measurement-history-button`, `measurement-cell-<key>`; modals `weight-modal`, `measurement-modal-<key>` |
| Weight history | `body/weight-history` | `weight-history-log-button`, `weight-history-empty-log-button`, `weight-log-row-<id>`, `weight-history-modal` |
| Measurement history | `body/measurement-history` | `measurement-pill-<key>`, `measurement-history-log-button`, `measurement-history-empty-add-button`, `measurement-log-row-<id>`, `measurement-history-modal-<key>` |

## Profile tab (`app/(tabs)/profile`, `app/profile`)

| Screen | Route | Key testIDs |
| --- | --- | --- |
| Profile | `(tabs)/profile` | `profile-screen`, `profile-avatar-button`, `profile-display-name` ("Add your name" when empty), `profile-edit-button`, rows `profile-row-<key>` with values `profile-row-<key>-value` (keys: `gender`, `age`, `weight`, `height`, `target-weight`; empty value "Not set"), `profile-logout-button` |
| Profile modals | — | `gender-modal` (options `gender-modal-option-male` / `-female`), `age-modal`, `height-modal`, `weight-modal`, `target-weight-modal`; each has `-save` and `-backdrop` |
| Edit profile (modal) | `profile/edit` | `edit-profile-close-button`, `edit-profile-name-input`, `edit-profile-save-button` |

- Log out asks for confirmation in a native alert ("Log out?", button "Log out") and returns to Welcome.
- Weight on Profile is the latest weight log, so saving it adds a log visible on the Body tab.
- The avatar button opens a native action sheet and the system photo picker, which Maestro can't fully drive. Leave avatar upload to manual testing.

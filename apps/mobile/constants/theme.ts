import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

/**
 * Mercedes-AMG Petronas F1-inspired palette. `dark` is the reference values;
 * `light` is a derived counterpart (not part of the original palette) that
 * keeps the same brand accents over light neutrals.
 */

// Brand accents — shared between themes, since they're the identity of the
// app rather than a function of light/dark surface elevation.
const primary = '#00A19B';
const primaryBright = '#00C2B8';
const primaryDark = '#007F7A';
const success = '#35C98A';
const warning = '#F5B942';
const error = '#FF5252';

export const Colors = {
  light: {
    text: '#0D1214',
    // Secondary/muted text and icons (e.g. list-row meta lines).
    icon: '#5B6668',
    textDisabled: '#9AA5A8',
    background: '#F2F4F4',
    cardBackground: '#FFFFFF',
    cardElevated: '#FFFFFF',
    border: '#E1E5E5',
    tint: primary,
    tintBright: primaryBright,
    tintDark: primaryDark,
    buttonText: '#FFFFFF',
    success,
    warning,
    error,
  },
  dark: {
    text: '#F5F7F7',
    icon: '#9AA5A8',
    textDisabled: '#596265',
    background: '#080A0C',
    cardBackground: '#121619',
    cardElevated: '#1A2023',
    border: '#293134',
    tint: primary,
    tintBright: primaryBright,
    tintDark: primaryDark,
    buttonText: '#F5F7F7',
    success,
    warning,
    error,
  },
};

// React Navigation's native-stack header reads its background/tint/text
// colors from this theme (colors.card/primary/text), not from our own
// Colors above, so without this the native header renders React
// Navigation's default surface — a different shade of dark than our own
// screen background, producing a visible seam between header and content.
// Setting `card` to the same value as `background` is what makes the header
// blend into the screen instead of looking like a separate panel.
export const NavigationThemes: { light: Theme; dark: Theme } = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.tint,
      background: Colors.light.background,
      card: Colors.light.background,
      text: Colors.light.text,
      border: Colors.light.cardElevated,
      notification: Colors.light.error,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.tint,
      background: Colors.dark.background,
      card: Colors.dark.background,
      text: Colors.dark.text,
      border: Colors.dark.cardElevated,
      notification: Colors.dark.error,
    },
  },
};

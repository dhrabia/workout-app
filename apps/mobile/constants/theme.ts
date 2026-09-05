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

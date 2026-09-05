/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    buttonText: '#fff',
    icon: '#687076',
    // iOS secondarySystemBackground — the fill used for grouped-list cards.
    cardBackground: '#F2F2F7',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    buttonText: '#151718',
    icon: '#9BA1A6',
    // iOS secondarySystemBackground (dark) — the fill used for grouped-list cards.
    cardBackground: '#1C1C1E',
  },
};

import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

const FADE: [string, string] = [`${OnboardingColors.background}00`, OnboardingColors.background];

export function OnboardingPhoto({
  source,
  height,
  fadeStart = 0.6,
  contentPosition,
}: {
  source: ImageProps['source'];
  height: DimensionValue;
  fadeStart?: number;
  contentPosition?: ImageProps['contentPosition'];
}) {
  return (
    <View style={[styles.photo, { height }]} pointerEvents="none">
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={contentPosition} />
      <LinearGradient colors={FADE} locations={[fadeStart, 1]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { position: 'absolute', top: 0, left: 0, right: 0 },
});

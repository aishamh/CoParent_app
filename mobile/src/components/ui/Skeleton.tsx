import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../theme/useTheme";

// ---------------------------------------------------------------------------
// Skeleton — Base animated shimmer block
// ---------------------------------------------------------------------------

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius,
          backgroundColor: colors.muted,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonLine — Text line placeholder
// ---------------------------------------------------------------------------

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
}

export function SkeletonLine({
  width = "100%",
  height = 14,
}: SkeletonLineProps) {
  return <Skeleton width={width} height={height} borderRadius={4} />;
}

// ---------------------------------------------------------------------------
// SkeletonCircle — Avatar / icon placeholder
// ---------------------------------------------------------------------------

interface SkeletonCircleProps {
  size?: number;
}

export function SkeletonCircle({ size = 40 }: SkeletonCircleProps) {
  return (
    <Skeleton width={size} height={size} borderRadius={size / 2} />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — Card-shaped placeholder matching the app's Card component
// ---------------------------------------------------------------------------

export function SkeletonCard() {
  const { colors, shadows: themeShadows } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card },
        themeShadows.md,
      ]}
    >
      <SkeletonLine width="60%" height={14} />
      <View style={styles.cardSpacer} />
      <SkeletonLine width="90%" height={12} />
      <View style={styles.cardSpacerSmall} />
      <SkeletonLine width="40%" height={12} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },
  cardSpacer: {
    height: 10,
  },
  cardSpacerSmall: {
    height: 6,
  },
});

import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

import { useCachedImage } from "../../hooks/useCachedImage";
import { useTheme } from "../../theme/useTheme";

interface CachedImageProps {
  /** Remote image URL to cache locally. */
  uri: string | undefined;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  /** Feather icon name shown when image fails or is unavailable. */
  fallbackIcon?: string;
  /** Tint color for the fallback icon. */
  fallbackColor?: string;
}

/**
 * Drop-in image component that downloads remote images to local storage
 * on first load and serves them from disk on subsequent renders.
 */
export function CachedImage({
  uri,
  style,
  containerStyle,
  resizeMode = "cover",
  fallbackIcon = "image",
  fallbackColor,
}: CachedImageProps) {
  const { colors } = useTheme();
  const { localUri, isLoading, error } = useCachedImage(uri);

  const iconColor = fallbackColor ?? colors.mutedForeground;

  // No URL provided — show fallback icon
  if (!uri) {
    return (
      <View style={[styles.placeholder, style, containerStyle]}>
        <Icon name={fallbackIcon} size={28} color={iconColor} />
      </View>
    );
  }

  // Downloading — show loading indicator
  if (isLoading) {
    return (
      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.card },
          style,
          containerStyle,
        ]}
      >
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      </View>
    );
  }

  // Download failed — show fallback icon
  if (error || !localUri) {
    return (
      <View style={[styles.placeholder, style, containerStyle]}>
        <Icon name={fallbackIcon} size={28} color={iconColor} />
      </View>
    );
  }

  // Cached image available — render from local disk
  return (
    <Image
      source={{ uri: localUri }}
      style={style}
      resizeMode={resizeMode}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
});

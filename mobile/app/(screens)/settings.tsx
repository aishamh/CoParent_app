import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../src/auth/useAuth";
import { useTheme } from "../../src/theme/useTheme";
import type { ThemeMode } from "../../src/theme/ThemeContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? "1.0.0";

  const handleToggleDarkMode = (value: boolean) => {
    const newMode: ThemeMode = value ? "dark" : "light";
    setThemeMode(newMode);
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  function ProfileSection() {
    const displayName = user?.display_name || user?.username || "User";
    const email = user?.email || "No email set";
    const role = user?.role ?? "parent";

    return (
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{getInitials(displayName)}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
        <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{role}</Text>
        </View>
      </View>
    );
  }

  function SettingsRow({
    icon,
    label,
    trailing,
    onPress,
    disabled = false,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    trailing?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.row, disabled && styles.rowDisabled]}
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={onPress ? 0.6 : 1}
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <View style={styles.rowLeft}>
          <Feather name={icon} size={20} color={disabled ? colors.border : colors.foreground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }, disabled && { color: colors.mutedForeground }]}>
            {label}
          </Text>
        </View>
        {trailing ?? (
          <Feather
            name="chevron-right"
            size={18}
            color={disabled ? colors.border : colors.mutedForeground}
          />
        )}
      </TouchableOpacity>
    );
  }

  function SectionHeader({ title }: { title: string }) {
    return <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{title}</Text>;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <Stack.Screen options={{ title: "Settings" }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSection />

        <SectionHeader title="Appearance" />
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="moon"
            label="Dark Mode"
            trailing={
              <Switch
                value={isDark}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.primaryForeground}
                accessibilityLabel="Toggle dark mode"
              />
            }
          />
        </View>

        <SectionHeader title="Account" />
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="lock"
            label="Change Password"
            disabled
            onPress={() =>
              Alert.alert("Coming Soon", "Password change will be available in a future update.")
            }
          />
        </View>

        <SectionHeader title="About" />
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingsRow
            icon="info"
            label="Version"
            trailing={
              <Text style={[styles.versionText, { color: colors.mutedForeground }]}>{appVersion}</Text>
            }
          />
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 52,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  versionText: {
    fontSize: 14,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

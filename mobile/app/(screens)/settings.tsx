import React, { useState } from "react";
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

import { useAuth } from "../../src/auth/useAuth";

const TEAL = "#0d9488";
const RED = "#DC2626";
const BACKGROUND = "#FDFAF5";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function ProfileSection() {
  const { user } = useAuth();

  const displayName =
    user?.display_name || user?.username || "User";
  const email = user?.email || "No email set";
  const role = user?.role ?? "parent";

  return (
    <View style={styles.profileSection}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
      </View>
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.profileEmail}>{email}</Text>
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>{role}</Text>
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
        <Feather name={icon} size={20} color={disabled ? "#D1D5DB" : "#374151"} />
        <Text style={[styles.rowLabel, disabled && styles.rowLabelDisabled]}>
          {label}
        </Text>
      </View>
      {trailing ?? (
        <Feather
          name="chevron-right"
          size={18}
          color={disabled ? "#E5E7EB" : "#9CA3AF"}
        />
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? "1.0.0";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ title: "Settings" }} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <ProfileSection />

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="moon"
            label="Dark Mode"
            trailing={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#D1D5DB", true: TEAL }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Toggle dark mode"
              />
            }
          />
        </View>

        {/* Notifications */}
        <SectionHeader title="Notifications" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="bell"
            label="Push Notifications"
            trailing={
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#D1D5DB", true: TEAL }}
                thumbColor="#FFFFFF"
                accessibilityLabel="Toggle push notifications"
              />
            }
          />
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="lock"
            label="Change Password"
            disabled
            onPress={() =>
              Alert.alert("Coming Soon", "Password change will be available in a future update.")
            }
          />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="info"
            label="Version"
            trailing={
              <Text style={styles.versionText}>{appVersion}</Text>
            }
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Feather name="log-out" size={20} color={RED} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
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
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  profileEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: "#F0FDFA",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: TEAL,
    textTransform: "capitalize",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
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
    color: "#374151",
  },
  rowLabelDisabled: {
    color: "#9CA3AF",
  },
  versionText: {
    fontSize: 14,
    color: "#9CA3AF",
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
    color: RED,
  },
});

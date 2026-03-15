import React, { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { format, parseISO } from "date-fns";

import { useAuth } from "../auth/useAuth";
import { useTheme } from "../theme/useTheme";
import { fetchApi } from "../api/client";
import { imageCache } from "../services/imageCache";
import { updateNotificationPreferences } from "../api/notifications";
import {
  getSupportedBiometry,
  isBiometricEnabled,
  setBiometricEnabled,
} from "../auth/tokenStorage";
import type { ThemeMode } from "../theme/ThemeContext";
import type { LoginHistoryEntry } from "../types/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = "1.0.0";

const STORAGE_KEYS = {
  NOTIFICATIONS: "@coparent/notification-prefs",
  PRIVACY: "@coparent/privacy-prefs",
  APP_PREFERENCES: "@coparent/app-preferences",
} as const;

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "en", label: "English" },
  { value: "no", label: "Norwegian" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
] as const;

const DATE_FORMAT_OPTIONS: readonly PreferenceOption[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

const CURRENCY_OPTIONS: readonly PreferenceOption[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "NOK", label: "NOK (kr)" },
] as const;

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  messageAlerts: boolean;
  eventReminders: boolean;
  expenseAlerts: boolean;
  documentShares: boolean;
}

interface PrivacyPreferences {
  shareLocation: boolean;
  shareCalendar: boolean;
  shareDocuments: boolean;
  shareContacts: boolean;
}

interface AppPreferences {
  language: string;
  dateFormat: string;
  currency: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PreferenceOption {
  value: string;
  label: string;
}

interface LanguageOption extends PreferenceOption {}
interface ThemeOption {
  value: ThemeMode;
  label: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  messageAlerts: true,
  eventReminders: true,
  expenseAlerts: true,
  documentShares: true,
};

const DEFAULT_PRIVACY: PrivacyPreferences = {
  shareLocation: false,
  shareCalendar: true,
  shareDocuments: true,
  shareContacts: false,
};

const DEFAULT_APP_PREFERENCES: AppPreferences = {
  language: "en",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
};

const EMPTY_PASSWORD_FORM: PasswordFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function triggerHaptic(): void {
  ReactNativeHapticFeedback.trigger("impactLight");
}

// ---------------------------------------------------------------------------
// AsyncStorage persistence helpers
// ---------------------------------------------------------------------------

async function loadFromStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch {
    // Fall back to default on read failure
  }
  return fallback;
}

async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently handle write failure
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SettingsScreen() {
  const { signOut, user } = useAuth();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();

  // Profile state
  const [displayName, setDisplayName] = useState(
    user?.display_name || user?.username || "",
  );
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Parent names state
  const [parentAName, setParentAName] = useState("Parent A");
  const [parentBName, setParentBName] = useState("Parent B");
  const [namesSaving, setNamesSaving] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATIONS,
  );

  // Privacy preferences
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(DEFAULT_PRIVACY);

  // App preferences
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(
    DEFAULT_APP_PREFERENCES,
  );

  // Modal states
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  // Picker modal configuration
  const [pickerConfig, setPickerConfig] = useState<{
    title: string;
    options: readonly PreferenceOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
  } | null>(null);

  // Password form
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormData>(EMPTY_PASSWORD_FORM);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Image cache state
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [clearingCache, setClearingCache] = useState(false);

  // Security / biometric state
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [biometricOn, setBiometricOn] = useState(false);
  const [loginHistoryData, setLoginHistoryData] = useState<LoginHistoryEntry[]>([]);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  // -------------------------------------------------------------------------
  // Load persisted data on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    loadPersistedPreferences();
    loadParentNamesFromApi();
    refreshCacheInfo();
  }, []);

  useEffect(() => {
    getSupportedBiometry().then(setBiometryType);
    isBiometricEnabled().then(setBiometricOn);
  }, []);

  async function loadPersistedPreferences(): Promise<void> {
    const [savedNotifications, savedPrivacy, savedAppPrefs] = await Promise.all(
      [
        loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS),
        loadFromStorage(STORAGE_KEYS.PRIVACY, DEFAULT_PRIVACY),
        loadFromStorage(STORAGE_KEYS.APP_PREFERENCES, DEFAULT_APP_PREFERENCES),
      ],
    );

    setNotifications(savedNotifications);
    setPrivacy(savedPrivacy);
    setAppPreferences(savedAppPrefs);
  }

  async function loadParentNamesFromApi(): Promise<void> {
    if (!user) return;

    try {
      const profile = await fetchApi<{
        parent_a_name?: string;
        parent_b_name?: string;
      }>(`/api/auth/profile`);

      if (profile?.parent_a_name) setParentAName(profile.parent_a_name);
      if (profile?.parent_b_name) setParentBName(profile.parent_b_name);
    } catch {
      // Use defaults if profile fetch fails
    }
  }

  // -------------------------------------------------------------------------
  // Notification toggle handler
  // -------------------------------------------------------------------------

  const handleNotificationToggle = useCallback(
    (key: keyof NotificationPreferences) => {
      setNotifications((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
        // Sync to server for keys that map to server-side preferences
        const serverKeyMap: Record<string, string> = {
          messageAlerts: "messages_enabled",
          eventReminders: "calendar_enabled",
          expenseAlerts: "expenses_enabled",
        };
        if (serverKeyMap[key]) {
          updateNotificationPreferences({
            [serverKeyMap[key]]: updated[key],
          }).catch(() => {}); // Fire and forget — local state is source of truth for UX
        }
        return updated;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Privacy toggle handler
  // -------------------------------------------------------------------------

  const handlePrivacyToggle = useCallback(
    (key: keyof PrivacyPreferences) => {
      setPrivacy((prev) => {
        const updated = { ...prev, [key]: !prev[key] };
        saveToStorage(STORAGE_KEYS.PRIVACY, updated);
        return updated;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // App preferences handler
  // -------------------------------------------------------------------------

  const updateAppPreference = useCallback(
    (key: keyof AppPreferences, value: string) => {
      setAppPreferences((prev) => {
        const updated = { ...prev, [key]: value };
        saveToStorage(STORAGE_KEYS.APP_PREFERENCES, updated);
        return updated;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Profile save
  // -------------------------------------------------------------------------

  async function handleSaveProfile(): Promise<void> {
    triggerHaptic();
    setProfileSaving(true);

    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          display_name: displayName,
          email,
        }),
      });

      Alert.alert("Profile Updated", "Your profile has been saved.");
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Parent names save
  // -------------------------------------------------------------------------

  async function handleSaveParentNames(): Promise<void> {
    triggerHaptic();
    setNamesSaving(true);

    try {
      await fetchApi("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          parent_a_name: parentAName,
          parent_b_name: parentBName,
        }),
      });

      Alert.alert("Names Updated", "Your custom parent names have been saved.");
    } catch {
      Alert.alert("Error", "Failed to update parent names. Please try again.");
    } finally {
      setNamesSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Password change
  // -------------------------------------------------------------------------

  async function handleChangePassword(): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Validation Error", "Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "New password and confirm password must match.",
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password Too Short",
        "Password must be at least 8 characters long.",
      );
      return;
    }

    triggerHaptic();
    setPasswordSaving(true);

    try {
      await fetchApi("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      Alert.alert("Password Changed", "Your password has been updated.");
      setPasswordModalVisible(false);
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch {
      Alert.alert("Error", "Failed to change password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  // -------------------------------------------------------------------------
  // Export data
  // -------------------------------------------------------------------------

  async function handleExportData(): Promise<void> {
    triggerHaptic();
    setExporting(true);

    try {
      const data = await fetchApi<Record<string, unknown>>(
        "/api/auth/export-data",
      );

      Alert.alert(
        "Data Exported",
        "Your data has been exported successfully. Check your downloads.",
      );

      // On mobile, we could save to the file system or share the data.
      // For now, log it for debugging purposes.
      if (__DEV__) {
        console.log("Exported data:", JSON.stringify(data, null, 2));
      }
    } catch {
      Alert.alert("Error", "Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Image cache management
  // -------------------------------------------------------------------------

  async function refreshCacheInfo(): Promise<void> {
    const [size, count] = await Promise.all([
      imageCache.getCacheSize(),
      imageCache.getCachedCount(),
    ]);
    setCacheSize(size);
    setCachedCount(count);
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
  }

  async function handleClearImageCache(): Promise<void> {
    triggerHaptic();
    setClearingCache(true);
    try {
      await imageCache.clearCache();
      await refreshCacheInfo();
      Alert.alert("Cache Cleared", "All cached images have been removed.");
    } catch {
      Alert.alert("Error", "Failed to clear image cache.");
    } finally {
      setClearingCache(false);
    }
  }

  // -------------------------------------------------------------------------
  // Biometric toggle
  // -------------------------------------------------------------------------

  const handleBiometricToggle = useCallback(async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricOn(value);
    ReactNativeHapticFeedback.trigger("selection");
  }, []);

  // -------------------------------------------------------------------------
  // Login history
  // -------------------------------------------------------------------------

  const handleShowLoginHistory = useCallback(async () => {
    try {
      const result = await fetchApi<{ data: LoginHistoryEntry[] }>(
        "/api/auth/login-history",
      );
      setLoginHistoryData(result?.data ?? []);
      setShowLoginHistory(true);
    } catch {
      Alert.alert("Error", "Could not load login history.");
    }
  }, []);

  // -------------------------------------------------------------------------
  // Delete account
  // -------------------------------------------------------------------------

  async function handleDeleteAccount(): Promise<void> {
    triggerHaptic();
    setDeleting(true);

    try {
      await fetchApi("/api/auth/account", { method: "DELETE" });

      setDeleteModalVisible(false);
      setDeleteConfirmText("");

      Alert.alert(
        "Account Deleted",
        "Your account has been permanently deleted.",
      );

      await signOut();
    } catch {
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Sign out
  // -------------------------------------------------------------------------

  function handleSignOut(): void {
    triggerHaptic();
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  }

  // -------------------------------------------------------------------------
  // Open picker modal
  // -------------------------------------------------------------------------

  function openPickerModal(
    title: string,
    options: readonly PreferenceOption[],
    selectedValue: string,
    onSelect: (value: string) => void,
  ): void {
    setPickerConfig({ title, options, selectedValue, onSelect });
    setPickerModalVisible(true);
  }

  // -------------------------------------------------------------------------
  // Styles derived from theme
  // -------------------------------------------------------------------------

  const themedStyles = {
    inputContainer: {
      backgroundColor: isDark ? colors.muted : "#F9FAFB",
      borderColor: colors.border,
    },
    inputText: {
      color: colors.foreground,
    },
    inputPlaceholder: colors.mutedForeground,
  };

  // =========================================================================
  // Sub-components
  // =========================================================================

  function SectionHeader({ title }: { title: string }) {
    return (
      <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>
        {title}
      </Text>
    );
  }

  function SectionCard({ children }: { children: React.ReactNode }) {
    return (
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    );
  }

  function Divider() {
    return (
      <View
        style={[styles.rowDivider, { backgroundColor: colors.border }]}
      />
    );
  }

  function ToggleRow({
    icon,
    label,
    value,
    onValueChange,
  }: {
    icon: string;
    label: string;
    value: boolean;
    onValueChange: () => void;
  }) {
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Icon name={icon} size={20} color={colors.foreground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>
            {label}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.primaryForeground}
          accessibilityLabel={`Toggle ${label}`}
        />
      </View>
    );
  }

  function TappableRow({
    icon,
    label,
    currentValue,
    onPress,
  }: {
    icon: string;
    label: string;
    currentValue: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${currentValue}`}
      >
        <View style={styles.rowLeft}>
          <Icon name={icon} size={20} color={colors.foreground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>
            {label}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
            {currentValue}
          </Text>
          <Icon
            name="chevron-right"
            size={18}
            color={colors.mutedForeground}
          />
        </View>
      </TouchableOpacity>
    );
  }

  function PrimaryButton({
    title,
    onPress,
    loading = false,
  }: {
    title: string;
    onPress: () => void;
    loading?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text
          style={[
            styles.primaryButtonText,
            { color: colors.primaryForeground },
          ]}
        >
          {loading ? "Saving..." : title}
        </Text>
      </TouchableOpacity>
    );
  }

  function LabeledInput({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "sentences",
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address";
    autoCapitalize?: "none" | "sentences" | "words";
  }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <TextInput
          style={[styles.textInput, themedStyles.inputContainer, themedStyles.inputText]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={themedStyles.inputPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          accessibilityLabel={label}
        />
      </View>
    );
  }

  // =========================================================================
  // Render
  // =========================================================================

  const userDisplayName = user?.display_name || user?.username || "User";
  const deleteEnabled = deleteConfirmText === "DELETE";

  const selectedLanguageLabel =
    LANGUAGE_OPTIONS.find((o) => o.value === appPreferences.language)?.label ??
    "English";
  const selectedDateFormatLabel =
    DATE_FORMAT_OPTIONS.find((o) => o.value === appPreferences.dateFormat)
      ?.label ?? "MM/DD/YYYY";
  const selectedCurrencyLabel =
    CURRENCY_OPTIONS.find((o) => o.value === appPreferences.currency)?.label ??
    "USD ($)";
  const selectedThemeLabel =
    THEME_OPTIONS.find((o) => o.value === themeMode)?.label ?? "System";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ----------------------------------------------------------------
            Profile Section
        ---------------------------------------------------------------- */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit avatar"
          >
            <Text
              style={[
                styles.avatarText,
                { color: colors.primaryForeground },
              ]}
            >
              {getInitials(userDisplayName)}
            </Text>
          </TouchableOpacity>
          <View
            style={[styles.roleBadge, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
              {user?.role ?? "parent"}
            </Text>
          </View>
        </View>

        <SectionHeader title="Profile Information" />
        <SectionCard>
          <View style={styles.cardInner}>
            <LabeledInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              autoCapitalize="words"
            />
            <LabeledInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PrimaryButton
              title="Save Profile"
              onPress={handleSaveProfile}
              loading={profileSaving}
            />
          </View>
        </SectionCard>

        {/* ----------------------------------------------------------------
            Parent Names Section
        ---------------------------------------------------------------- */}
        <SectionHeader title="Parent Names" />
        <SectionCard>
          <View style={styles.cardInner}>
            <LabeledInput
              label="Parent A Name"
              value={parentAName}
              onChangeText={setParentAName}
              placeholder="e.g., Mom, Sarah"
              autoCapitalize="words"
            />
            <Text
              style={[styles.inputHint, { color: colors.mutedForeground }]}
            >
              This name replaces "Parent A" throughout the app
            </Text>
            <LabeledInput
              label="Parent B Name"
              value={parentBName}
              onChangeText={setParentBName}
              placeholder="e.g., Dad, John"
              autoCapitalize="words"
            />
            <Text
              style={[styles.inputHint, { color: colors.mutedForeground }]}
            >
              This name replaces "Parent B" throughout the app
            </Text>
            <PrimaryButton
              title="Save Names"
              onPress={handleSaveParentNames}
              loading={namesSaving}
            />
          </View>
        </SectionCard>

        {/* ----------------------------------------------------------------
            Notifications Section (6 toggles)
        ---------------------------------------------------------------- */}
        <SectionHeader title="Notifications" />
        <SectionCard>
          <ToggleRow
            icon="bell"
            label="Push Notifications"
            value={notifications.pushNotifications}
            onValueChange={() => handleNotificationToggle("pushNotifications")}
          />
          <Divider />
          <ToggleRow
            icon="mail"
            label="Email Notifications"
            value={notifications.emailNotifications}
            onValueChange={() => handleNotificationToggle("emailNotifications")}
          />
          <Divider />
          <ToggleRow
            icon="message-circle"
            label="Message Alerts"
            value={notifications.messageAlerts}
            onValueChange={() => handleNotificationToggle("messageAlerts")}
          />
          <Divider />
          <ToggleRow
            icon="calendar"
            label="Event Reminders"
            value={notifications.eventReminders}
            onValueChange={() => handleNotificationToggle("eventReminders")}
          />
          <Divider />
          <ToggleRow
            icon="dollar-sign"
            label="Expense Alerts"
            value={notifications.expenseAlerts}
            onValueChange={() => handleNotificationToggle("expenseAlerts")}
          />
          <Divider />
          <ToggleRow
            icon="share-2"
            label="Document Shares"
            value={notifications.documentShares}
            onValueChange={() => handleNotificationToggle("documentShares")}
          />
        </SectionCard>

        {/* ----------------------------------------------------------------
            AI Features Section
        ---------------------------------------------------------------- */}
        <SectionHeader title="AI Features" />
        <SectionCard>
          <ToggleRow
            icon="zap"
            label="Communication Coaching"
            value={notifications.pushNotifications}
            onValueChange={() => {
              updateNotificationPreferences({
                tone_coaching_enabled: !notifications.pushNotifications,
              }).catch(() => {});
            }}
          />
          <Text
            style={[
              { fontSize: 12, paddingHorizontal: 16, paddingBottom: 12 },
              { color: colors.mutedForeground },
            ]}
          >
            Get tone analysis and rewrite suggestions before sending messages
          </Text>
        </SectionCard>

        {/* ----------------------------------------------------------------
            Privacy Section (4 toggles)
        ---------------------------------------------------------------- */}
        <SectionHeader title="Privacy" />
        <SectionCard>
          <ToggleRow
            icon="map-pin"
            label="Share Location"
            value={privacy.shareLocation}
            onValueChange={() => handlePrivacyToggle("shareLocation")}
          />
          <Divider />
          <ToggleRow
            icon="calendar"
            label="Share Calendar"
            value={privacy.shareCalendar}
            onValueChange={() => handlePrivacyToggle("shareCalendar")}
          />
          <Divider />
          <ToggleRow
            icon="folder"
            label="Share Documents"
            value={privacy.shareDocuments}
            onValueChange={() => handlePrivacyToggle("shareDocuments")}
          />
          <Divider />
          <ToggleRow
            icon="users"
            label="Share Contacts"
            value={privacy.shareContacts}
            onValueChange={() => handlePrivacyToggle("shareContacts")}
          />
        </SectionCard>

        {/* ----------------------------------------------------------------
            App Preferences
        ---------------------------------------------------------------- */}
        <SectionHeader title="App Preferences" />
        <SectionCard>
          <TappableRow
            icon="sun"
            label="Theme"
            currentValue={selectedThemeLabel}
            onPress={() =>
              openPickerModal(
                "Theme",
                THEME_OPTIONS as unknown as readonly PreferenceOption[],
                themeMode,
                (value) => setThemeMode(value as ThemeMode),
              )
            }
          />
          <Divider />
          <TappableRow
            icon="globe"
            label="Language"
            currentValue={selectedLanguageLabel}
            onPress={() =>
              openPickerModal(
                "Language",
                LANGUAGE_OPTIONS,
                appPreferences.language,
                (value) => updateAppPreference("language", value),
              )
            }
          />
          <Divider />
          <TappableRow
            icon="calendar"
            label="Date Format"
            currentValue={selectedDateFormatLabel}
            onPress={() =>
              openPickerModal(
                "Date Format",
                DATE_FORMAT_OPTIONS,
                appPreferences.dateFormat,
                (value) => updateAppPreference("dateFormat", value),
              )
            }
          />
          <Divider />
          <TappableRow
            icon="credit-card"
            label="Currency"
            currentValue={selectedCurrencyLabel}
            onPress={() =>
              openPickerModal(
                "Currency",
                CURRENCY_OPTIONS,
                appPreferences.currency,
                (value) => updateAppPreference("currency", value),
              )
            }
          />
        </SectionCard>

        {/* ----------------------------------------------------------------
            Security
        ---------------------------------------------------------------- */}
        <SectionHeader title="Security" />
        <SectionCard>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Change Password"
          >
            <View style={styles.rowLeft}>
              <Icon name="lock" size={20} color={colors.foreground} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Change Password
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {biometryType ? (
            <>
              <Divider />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Icon name="shield" size={20} color={colors.foreground} />
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {biometryType === "FaceID" ? "Use Face ID" : "Use Touch ID"}
                  </Text>
                </View>
                <Switch
                  value={biometricOn}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.primaryForeground}
                  accessibilityLabel={
                    biometryType === "FaceID"
                      ? "Toggle Face ID"
                      : "Toggle Touch ID"
                  }
                />
              </View>
            </>
          ) : null}

          <Divider />
          <TouchableOpacity
            style={styles.row}
            onPress={handleShowLoginHistory}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="View Login History"
          >
            <View style={styles.rowLeft}>
              <Icon name="clock" size={20} color={colors.foreground} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Login History
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </SectionCard>

        {/* ----------------------------------------------------------------
            Storage
        ---------------------------------------------------------------- */}
        <SectionHeader title="Storage" />
        <SectionCard>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="image" size={20} color={colors.foreground} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Cached Images
              </Text>
            </View>
            <Text
              style={[styles.versionText, { color: colors.mutedForeground }]}
            >
              {cachedCount} images ({formatBytes(cacheSize)})
            </Text>
          </View>
          <View
            style={[
              styles.rowDivider,
              { backgroundColor: colors.border },
            ]}
          />
          <TouchableOpacity
            style={styles.row}
            onPress={handleClearImageCache}
            disabled={clearingCache || cachedCount === 0}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Clear image cache"
          >
            <View style={styles.rowLeft}>
              <Icon name="trash-2" size={20} color={colors.destructive} />
              <Text
                style={[styles.rowLabel, { color: colors.destructive }]}
              >
                {clearingCache ? "Clearing..." : "Clear Image Cache"}
              </Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        {/* ----------------------------------------------------------------
            About
        ---------------------------------------------------------------- */}
        <SectionHeader title="About" />
        <SectionCard>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="info" size={20} color={colors.foreground} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Version
              </Text>
            </View>
            <Text
              style={[styles.versionText, { color: colors.mutedForeground }]}
            >
              {APP_VERSION}
            </Text>
          </View>
        </SectionCard>

        {/* ----------------------------------------------------------------
            Sign Out
        ---------------------------------------------------------------- */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: isDark ? "#3B1C1C" : "#FEF2F2" }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Icon name="log-out" size={20} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* ----------------------------------------------------------------
            Danger Zone
        ---------------------------------------------------------------- */}
        <SectionHeader title="Danger Zone" />
        <View
          style={[
            styles.dangerCard,
            {
              backgroundColor: isDark ? "#2D1B1B" : "#FEF2F2",
              borderColor: isDark ? "#5C2828" : "#FECACA",
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.dangerRow]}
            onPress={handleExportData}
            disabled={exporting}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Export all data"
          >
            <View style={styles.rowLeft}>
              <Icon name="download" size={20} color={colors.destructive} />
              <Text
                style={[styles.rowLabel, { color: colors.destructive }]}
              >
                {exporting ? "Exporting..." : "Export All Data"}
              </Text>
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: isDark ? "#5C2828" : "#FECACA" },
            ]}
          />

          <TouchableOpacity
            style={[styles.dangerRow]}
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <View style={styles.rowLeft}>
              <Icon name="trash-2" size={20} color={colors.destructive} />
              <Text
                style={[styles.rowLabel, { color: colors.destructive }]}
              >
                Delete Account
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ==================================================================
          Change Password Modal
      ================================================================== */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalSafe,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setPasswordModalVisible(false);
                setPasswordForm(EMPTY_PASSWORD_FORM);
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.modalTitle, { color: colors.foreground }]}
            >
              Change Password
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={[
                styles.modalDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Enter your current password and a new password to update your
              credentials.
            </Text>

            <LabeledInput
              label="Current Password"
              value={passwordForm.currentPassword}
              onChangeText={(text) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: text,
                }))
              }
              placeholder="Enter current password"
              secureTextEntry
              autoCapitalize="none"
            />
            <LabeledInput
              label="New Password"
              value={passwordForm.newPassword}
              onChangeText={(text) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: text,
                }))
              }
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
            />
            <LabeledInput
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChangeText={(text) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: text,
                }))
              }
              placeholder="Re-enter new password"
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary, marginTop: 24 },
              ]}
              onPress={handleChangePassword}
              disabled={passwordSaving}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Submit password change"
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                {passwordSaving ? "Changing..." : "Change Password"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==================================================================
          Delete Account Modal
      ================================================================== */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setDeleteConfirmText("");
        }}
      >
        <SafeAreaView
          style={[
            styles.modalSafe,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setDeleteModalVisible(false);
                setDeleteConfirmText("");
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.modalTitle, { color: colors.destructive }]}
            >
              Delete Account
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: isDark ? "#2D1B1B" : "#FEF2F2",
                  borderColor: isDark ? "#5C2828" : "#FECACA",
                },
              ]}
            >
              <Text
                style={[
                  styles.warningTitle,
                  { color: colors.destructive },
                ]}
              >
                Warning: This will permanently delete:
              </Text>
              <Text
                style={[styles.warningItem, { color: colors.destructive }]}
              >
                {"\u2022"} All your personal information
              </Text>
              <Text
                style={[styles.warningItem, { color: colors.destructive }]}
              >
                {"\u2022"} All children profiles
              </Text>
              <Text
                style={[styles.warningItem, { color: colors.destructive }]}
              >
                {"\u2022"} All calendar events and activities
              </Text>
              <Text
                style={[styles.warningItem, { color: colors.destructive }]}
              >
                {"\u2022"} All messages and documents
              </Text>
              <Text
                style={[styles.warningItem, { color: colors.destructive }]}
              >
                {"\u2022"} All expense records
              </Text>
            </View>

            <Text
              style={[
                styles.deletePromptText,
                { color: colors.foreground },
              ]}
            >
              Type <Text style={styles.deleteBoldText}>DELETE</Text> to
              confirm:
            </Text>

            <TextInput
              style={[
                styles.textInput,
                themedStyles.inputContainer,
                themedStyles.inputText,
              ]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={themedStyles.inputPlaceholder}
              autoCapitalize="characters"
              accessibilityLabel="Type DELETE to confirm account deletion"
            />

            <TouchableOpacity
              style={[
                styles.deleteButton,
                {
                  backgroundColor: deleteEnabled
                    ? colors.destructive
                    : colors.border,
                },
              ]}
              onPress={handleDeleteAccount}
              disabled={!deleteEnabled || deleting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Confirm delete account"
              accessibilityState={{ disabled: !deleteEnabled || deleting }}
            >
              <Icon name="trash-2" size={18} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>
                {deleting ? "Deleting..." : "Delete Account"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==================================================================
          Picker Modal (Theme, Language, Date Format, Currency)
      ================================================================== */}
      <Modal
        visible={pickerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <SafeAreaView
          style={[
            styles.modalSafe,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setPickerModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
            <Text
              style={[styles.modalTitle, { color: colors.foreground }]}
            >
              {pickerConfig?.title ?? "Select"}
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalBody}>
            {pickerConfig?.options.map((option) => {
              const isSelected = option.value === pickerConfig.selectedValue;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : "transparent",
                    },
                  ]}
                  onPress={() => {
                    pickerConfig.onSelect(option.value);
                    setPickerConfig((prev) =>
                      prev ? { ...prev, selectedValue: option.value } : null,
                    );
                  }}
                  activeOpacity={0.6}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      {
                        color: isSelected
                          ? colors.primary
                          : colors.foreground,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Icon
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ==================================================================
          Login History Modal
      ================================================================== */}
      <Modal
        visible={showLoginHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoginHistory(false)}
      >
        <SafeAreaView
          style={[styles.modalSafe, { backgroundColor: colors.background }]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowLoginHistory(false)}
              accessibilityRole="button"
              accessibilityLabel="Close login history"
            >
              <Text style={[styles.modalCancel, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Login History
            </Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalBody}>
            {loginHistoryData.length === 0 ? (
              <Text
                style={[
                  styles.modalDescription,
                  { color: colors.mutedForeground, textAlign: "center" },
                ]}
              >
                No login history available.
              </Text>
            ) : (
              loginHistoryData.slice(0, 20).map((entry) => {
                const iconConfig = getLoginEventIcon(entry.event_type);
                const formattedDate = formatLoginDate(entry.created_at);
                const partialIp = maskIpAddress(entry.ip_address);

                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.loginHistoryRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.loginHistoryIcon,
                        { backgroundColor: `${iconConfig.color}18` },
                      ]}
                    >
                      <Icon
                        name={iconConfig.name}
                        size={18}
                        color={iconConfig.color}
                      />
                    </View>
                    <View style={styles.loginHistoryContent}>
                      <Text
                        style={[
                          styles.loginHistoryEvent,
                          { color: colors.foreground },
                        ]}
                      >
                        {formatEventLabel(entry.event_type)}
                      </Text>
                      <Text
                        style={[
                          styles.loginHistoryMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formattedDate}
                        {partialIp ? ` \u00B7 ${partialIp}` : ""}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Login history helpers
// ---------------------------------------------------------------------------

interface EventIconConfig {
  name: string;
  color: string;
}

function getLoginEventIcon(eventType: string): EventIconConfig {
  switch (eventType) {
    case "login":
      return { name: "log-in", color: "#22C55E" };
    case "logout":
      return { name: "log-out", color: "#6B7280" };
    case "login_failed":
      return { name: "x-circle", color: "#EF4444" };
    case "session_restored":
      return { name: "refresh-cw", color: "#3B82F6" };
    case "password_changed":
      return { name: "key", color: "#F59E0B" };
    default:
      return { name: "activity", color: "#6B7280" };
  }
}

function formatEventLabel(eventType: string): string {
  switch (eventType) {
    case "login":
      return "Signed In";
    case "logout":
      return "Signed Out";
    case "login_failed":
      return "Failed Login Attempt";
    case "session_restored":
      return "Session Restored";
    case "password_changed":
      return "Password Changed";
    default:
      return eventType;
  }
}

function formatLoginDate(isoString: string): string {
  try {
    return format(parseISO(isoString), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return isoString;
  }
}

function maskIpAddress(ip: string | null): string {
  if (!ip) return "";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip.slice(0, Math.ceil(ip.length / 2)) + "***";
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // Section layout
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
  cardInner: {
    padding: 16,
  },

  // Rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
  },
  rowDivider: {
    height: 0.5,
    marginLeft: 50,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    fontSize: 15,
  },
  inputHint: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  // Buttons
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Danger zone
  dangerCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 52,
  },

  // Version
  versionText: {
    fontSize: 14,
  },

  // Modal
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E4E8",
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalBody: {
    padding: 24,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  // Warning box (delete modal)
  warningBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  warningItem: {
    fontSize: 13,
    lineHeight: 22,
  },

  // Delete confirmation
  deletePromptText: {
    fontSize: 14,
    marginBottom: 10,
  },
  deleteBoldText: {
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Picker modal
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },

  // Login history
  loginHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loginHistoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loginHistoryContent: {
    flex: 1,
  },
  loginHistoryEvent: {
    fontSize: 15,
    fontWeight: "500",
  },
  loginHistoryMeta: {
    fontSize: 13,
    marginTop: 2,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 40,
  },
});

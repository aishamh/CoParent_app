import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../../src/auth/useAuth";
import { useTheme } from "../../src/theme/useTheme";
import Button from "../../src/components/ui/Button";
import TextInput from "../../src/components/ui/TextInput";
import ProgressDots from "../../src/components/ui/ProgressDots";

function buildInitials(displayName: string | null | undefined): string {
  if (!displayName) return "";
  return displayName
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");

  const initials = buildInitials(displayName || user?.username);
  const hasInitials = initials.length > 0;

  const navigateToChildren = () => {
    router.push("/onboarding/children");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressDots total={4} current={1} />

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Set Up Your Profile</Text>

            <View style={styles.avatarContainer}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                {hasInitials ? (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                ) : (
                  <Feather name="camera" size={32} color={colors.mutedForeground} />
                )}
              </View>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Display Name"
                placeholder="How should we call you?"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Button title="Continue" onPress={navigateToChildren} />

            <Pressable
              onPress={navigateToChildren}
              style={styles.skipWrapper}
              accessibilityRole="link"
              accessibilityLabel="Skip profile setup"
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  form: {
    width: "100%",
  },
  footer: {
    paddingBottom: 16,
  },
  skipWrapper: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

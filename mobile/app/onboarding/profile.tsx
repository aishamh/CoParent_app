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
import Button from "../../src/components/ui/Button";
import TextInput from "../../src/components/ui/TextInput";
import ProgressDots from "../../src/components/ui/ProgressDots";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

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

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");

  const initials = buildInitials(displayName || user?.username);
  const hasInitials = initials.length > 0;

  const navigateToChildren = () => {
    router.push("/onboarding/children");
  };

  return (
    <SafeAreaView style={styles.safe}>
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
            <Text style={styles.title}>Set Up Your Profile</Text>

            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {hasInitials ? (
                  <Text style={styles.avatarText}>{initials}</Text>
                ) : (
                  <Feather name="camera" size={32} color="#9CA3AF" />
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
              <Text style={styles.skipText}>Skip</Text>
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
    backgroundColor: BACKGROUND,
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
    color: "#111827",
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
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: TEAL,
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
    color: "#6B7280",
  },
});

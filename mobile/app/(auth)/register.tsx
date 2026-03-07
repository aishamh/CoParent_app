import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useAuth } from "../../src/auth/useAuth";
import Button from "../../src/components/ui/Button";
import TextInput from "../../src/components/ui/TextInput";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";
const ROLES = ["parent_a", "parent_b"] as const;
const ROLE_LABELS: Record<string, string> = {
  parent_a: "Parent A",
  parent_b: "Parent B",
};

export default function RegisterScreen() {
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("parent_a");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Username, email, and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password,
        display_name: displayName.trim() || undefined,
        role,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Registration failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push("/(auth)/login");
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
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join CoParent Connect to get started
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextInput
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
            />

            <TextInput
              label="Display Name (optional)"
              placeholder="How others will see you"
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="done"
            />

            <Text style={styles.roleLabel}>Your Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const isSelected = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleOption,
                      isSelected && styles.roleOptionSelected,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        isSelected && styles.roleTextSelected,
                      ]}
                    >
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error !== "" && <Text style={styles.error}>{error}</Text>}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={navigateToLogin}
              style={styles.linkWrapper}
              accessibilityRole="link"
            >
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkBold}>Sign in</Text>
              </Text>
            </TouchableOpacity>
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
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: TEAL,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  form: {
    width: "100%",
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 6,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleOptionSelected: {
    borderColor: TEAL,
    backgroundColor: "#F0FDFA",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
  roleTextSelected: {
    color: TEAL,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  linkWrapper: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  linkBold: {
    color: TEAL,
    fontWeight: "600",
  },
});

import { useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Icon from "react-native-vector-icons/Feather";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";

const ROLES = ["parent_a", "parent_b"] as const;
const ROLE_LABELS: Record<string, string> = {
  parent_a: "Parent A",
  parent_b: "Parent B",
};

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw) => /[0-9]/.test(pw) },
  { label: "Special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

type StrengthLevel = "Weak" | "Fair" | "Good" | "Strong";

interface StrengthInfo {
  level: StrengthLevel;
  color: string;
  ratio: number;
}

function evaluatePasswordStrength(password: string): StrengthInfo {
  if (password.length === 0) {
    return { level: "Weak", color: "#DC2626", ratio: 0 };
  }

  const passedCount = PASSWORD_RULES.filter((rule) =>
    rule.test(password),
  ).length;

  if (passedCount <= 1) {
    return { level: "Weak", color: "#DC2626", ratio: 0.25 };
  }
  if (passedCount <= 2) {
    return { level: "Fair", color: "#F59E0B", ratio: 0.5 };
  }
  if (passedCount <= 3) {
    return { level: "Good", color: "#F97316", ratio: 0.75 };
  }
  return { level: "Strong", color: "#22C55E", ratio: 1 };
}

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { signUp } = useAuth();
  const { colors } = useTheme();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("parent_a");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(
    () => evaluatePasswordStrength(password),
    [password],
  );

  const passwordsMatch = password === confirmPassword;
  const showMismatchError = confirmTouched && !passwordsMatch;
  const isRegisterDisabled = confirmTouched && !passwordsMatch;

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

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");
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
      const message =
        e instanceof Error ? e.message : "Registration failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate("Login" as never);
  };

  const handleConfirmPasswordChange = (text: string) => {
    if (!confirmTouched) {
      setConfirmTouched(true);
    }
    setConfirmPassword(text);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.primary }]}>
              Create Account
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
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

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View
                  style={[
                    styles.strengthBarTrack,
                    { backgroundColor: colors.muted },
                  ]}
                >
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        backgroundColor: strength.color,
                        width: `${strength.ratio * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: strength.color },
                  ]}
                >
                  {strength.level}
                </Text>
                <View style={styles.rulesList}>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <View key={rule.label} style={styles.ruleRow}>
                        <Icon
                          name={passed ? "check-circle" : "circle"}
                          size={14}
                          color={
                            passed
                              ? "#22C55E"
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={[
                            styles.ruleText,
                            {
                              color: passed
                                ? "#22C55E"
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          {rule.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <TextInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="next"
            />

            {showMismatchError && (
              <Text
                style={[
                  styles.mismatchError,
                  { color: colors.destructive },
                ]}
              >
                Passwords do not match
              </Text>
            )}

            <TextInput
              label="Display Name (optional)"
              placeholder="How others will see you"
              value={displayName}
              onChangeText={setDisplayName}
              returnKeyType="done"
            />

            <Text
              style={[styles.roleLabel, { color: colors.mutedForeground }]}
            >
              Your Role
            </Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const isSelected = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleOption,
                      { borderColor: colors.border },
                      isSelected && {
                        borderColor: colors.primary,
                        backgroundColor: colors.accent,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        { color: colors.mutedForeground },
                        isSelected && {
                          color: colors.primary,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {error !== "" && (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {error}
              </Text>
            )}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              disabled={isRegisterDisabled}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={navigateToLogin}
              style={styles.linkWrapper}
              accessibilityRole="link"
            >
              <Text
                style={[styles.linkText, { color: colors.mutedForeground }]}
              >
                Already have an account?{" "}
                <Text style={[styles.linkBold, { color: colors.primary }]}>
                  Sign in
                </Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: "100%",
  },
  strengthContainer: {
    marginBottom: 12,
    marginTop: -4,
  },
  strengthBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: 6,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  rulesList: {
    marginTop: 8,
    gap: 4,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
  },
  mismatchError: {
    fontSize: 13,
    marginTop: -4,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "500",
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
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: {
    fontSize: 15,
    fontWeight: "500",
  },
  error: {
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
  },
  linkBold: {
    fontWeight: "600",
  },
});

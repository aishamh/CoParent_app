import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import Icon from "react-native-vector-icons/Feather";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import { fetchApi } from "../../api/client";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";

export default function LoginScreen() {
  const navigation = useNavigation();
  const { signIn } = useAuth();
  const { colors } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState("");
  const [resetIsError, setResetIsError] = useState(false);

  const handleSignIn = async () => {
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");
    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate("Register" as never);
  };

  const openForgotModal = () => {
    setResetEmail(username.includes("@") ? username : "");
    setResetFeedback("");
    setResetIsError(false);
    setForgotModalVisible(true);
  };

  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setResetFeedback("");
    setResetIsError(false);
  };

  const handleSendResetLink = async () => {
    const trimmedEmail = resetEmail.trim();

    if (!trimmedEmail) {
      setResetFeedback("Please enter your email address.");
      setResetIsError(true);
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");
    setResetLoading(true);
    setResetFeedback("");
    setResetIsError(false);

    try {
      await fetchApi("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: trimmedEmail }),
      });
      setResetFeedback("Reset link sent! Check your email.");
      setResetIsError(false);
      ReactNativeHapticFeedback.trigger("notificationSuccess");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to send reset link.";
      setResetFeedback(message);
      setResetIsError(true);
      ReactNativeHapticFeedback.trigger("notificationError");
    } finally {
      setResetLoading(false);
    }
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
              CoParent Connect
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              Sign in to your account
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            <TextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />

            {error !== "" && (
              <Text style={[styles.error, { color: colors.destructive }]}>
                {error}
              </Text>
            )}

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              onPress={openForgotModal}
              style={styles.forgotWrapper}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text
                style={[styles.forgotText, { color: colors.primary }]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={navigateToRegister}
              style={styles.linkWrapper}
              accessibilityRole="link"
            >
              <Text
                style={[styles.linkText, { color: colors.mutedForeground }]}
              >
                Don't have an account?{" "}
                <Text style={[styles.linkBold, { color: colors.primary }]}>
                  Sign up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={forgotModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeForgotModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, { color: colors.foreground }]}
              >
                Reset Password
              </Text>
              <TouchableOpacity
                onPress={closeForgotModal}
                style={styles.closeButton}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Icon name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.modalDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Enter your email address and we'll send you a link to reset
              your password.
            </Text>

            <RNTextInput
              style={[
                styles.modalInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleSendResetLink}
            />

            {resetFeedback !== "" && (
              <Text
                style={[
                  styles.resetFeedback,
                  {
                    color: resetIsError
                      ? colors.destructive
                      : colors.primary,
                  },
                ]}
              >
                {resetFeedback}
              </Text>
            )}

            <Button
              title="Send Reset Link"
              onPress={handleSendResetLink}
              loading={resetLoading}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
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
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    width: "100%",
  },
  error: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  forgotWrapper: {
    alignItems: "center",
    marginTop: 14,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "500",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  resetFeedback: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  modalButton: {
    marginTop: 4,
  },
});

import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../../src/auth/useAuth";
import Button from "../../src/components/ui/Button";
import ProgressDots from "../../src/components/ui/ProgressDots";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";
const PLACEHOLDER_CODE = "COPARENT-XXXX";

export default function InviteScreen() {
  const { user } = useAuth();
  const inviteCode = user?.family_id ?? PLACEHOLDER_CODE;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join our family on CoParent Connect! Use invite code: ${inviteCode}`,
      });
    } catch {
      Alert.alert("Share failed", "Unable to open the share dialog.");
    }
  };

  const navigateToHome = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ProgressDots total={4} current={3} />

        <View style={styles.content}>
          <Text style={styles.title}>Invite Your Co-Parent</Text>

          <Text style={styles.description}>
            Share an invite code with your co-parent so they can join your
            family.
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Invite Code</Text>
            <Text
              style={styles.codeValue}
              selectable
              accessibilityLabel={`Invite code: ${inviteCode}`}
            >
              {inviteCode}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            style={styles.shareButton}
            accessibilityRole="button"
            accessibilityLabel="Share invite code"
          >
            <Feather name="share-2" size={20} color={TEAL} />
            <Text style={styles.shareText}>Share Code</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Button title="Done" onPress={navigateToHome} />

          <Pressable
            onPress={navigateToHome}
            style={styles.skipWrapper}
            accessibilityRole="link"
            accessibilityLabel="Skip inviting co-parent"
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  codeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 24,
    width: "100%",
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "700",
    color: TEAL,
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: TEAL,
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
    color: TEAL,
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

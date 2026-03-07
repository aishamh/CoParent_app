import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../src/auth/useAuth";
import { useTheme } from "../../src/theme/useTheme";
import Button from "../../src/components/ui/Button";
import ProgressDots from "../../src/components/ui/ProgressDots";

const PLACEHOLDER_CODE = "COPARENT-XXXX";

export default function InviteScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const inviteCode = user?.family_id ?? PLACEHOLDER_CODE;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Join our family on CoParent Connect! Use invite code: ${inviteCode}`,
      });
    } catch {
      Alert.alert("Share failed", "Unable to open the share dialog.");
    }
  };

  const navigateToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <ProgressDots total={4} current={3} />

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>Invite Your Co-Parent</Text>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Share an invite code with your co-parent so they can join your
            family.
          </Text>

          <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Your Invite Code</Text>
            <Text
              style={[styles.codeValue, { color: colors.primary }]}
              selectable
              accessibilityLabel={`Invite code: ${inviteCode}`}
            >
              {inviteCode}
            </Text>
          </View>

          <Pressable
            onPress={handleShare}
            style={[styles.shareButton, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Share invite code"
          >
            <Feather name="share-2" size={20} color={colors.primary} />
            <Text style={[styles.shareText, { color: colors.primary }]}>Share Code</Text>
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
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  codeCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 24,
    width: "100%",
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: "700",
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
  },
  shareText: {
    fontSize: 16,
    fontWeight: "600",
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

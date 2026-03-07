import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../src/theme/useTheme";
import { useFamily, useJoinFamily } from "../../src/hooks/useFamily";
import Button from "../../src/components/ui/Button";
import TextInput from "../../src/components/ui/TextInput";
import ProgressDots from "../../src/components/ui/ProgressDots";

type Mode = "share" | "join";

export default function InviteScreen() {
  const { colors } = useTheme();
  const { data: family, isLoading: isFamilyLoading } = useFamily();
  const joinFamilyMutation = useJoinFamily();

  const [mode, setMode] = useState<Mode>("share");
  const [joinCode, setJoinCode] = useState("");

  const inviteCode = family?.invite_code ?? "";

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

  const handleJoinFamily = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) {
      Alert.alert("Missing code", "Please enter an invite code.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    joinFamilyMutation.mutate(trimmed, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Joined!", "You have joined the family successfully.", [
          { text: "Continue", onPress: navigateToHome },
        ]);
      },
      onError: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Invalid code",
          "That invite code was not recognized. Please check and try again.",
        );
      },
    });
  };

  const navigateToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(tabs)");
  };

  const toggleMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode((prev) => (prev === "share" ? "join" : "share"));
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <ProgressDots total={4} current={3} />

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {mode === "share"
              ? "Invite Your Co-Parent"
              : "Join an Existing Family"}
          </Text>

          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
          >
            {mode === "share"
              ? "Share your invite code so your co-parent can join your family."
              : "Enter the invite code you received from your co-parent."}
          </Text>

          {mode === "share" ? (
            <ShareCodeSection
              inviteCode={inviteCode}
              isLoading={isFamilyLoading}
              colors={colors}
              onShare={handleShare}
            />
          ) : (
            <JoinCodeSection
              joinCode={joinCode}
              onChangeCode={setJoinCode}
              isSubmitting={joinFamilyMutation.isPending}
              colors={colors}
              onSubmit={handleJoinFamily}
            />
          )}

          <Pressable
            onPress={toggleMode}
            style={styles.toggleWrapper}
            accessibilityRole="button"
            accessibilityLabel={
              mode === "share"
                ? "Switch to join family mode"
                : "Switch to share code mode"
            }
          >
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {mode === "share"
                ? "Have a code? Join an existing family"
                : "Share your own invite code instead"}
            </Text>
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
            <Text
              style={[styles.skipText, { color: colors.mutedForeground }]}
            >
              Skip for now
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Sub-components ---------- */

interface ShareCodeProps {
  inviteCode: string;
  isLoading: boolean;
  colors: Record<string, string>;
  onShare: () => void;
}

function ShareCodeSection({
  inviteCode,
  isLoading,
  colors,
  onShare,
}: ShareCodeProps) {
  return (
    <>
      <View
        style={[
          styles.codeCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>
          Your Invite Code
        </Text>
        {isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.codeLoader}
          />
        ) : (
          <Text
            style={[styles.codeValue, { color: colors.primary }]}
            selectable
            accessibilityLabel={`Invite code: ${inviteCode}`}
          >
            {inviteCode || "---"}
          </Text>
        )}
      </View>

      <Pressable
        onPress={onShare}
        disabled={isLoading || !inviteCode}
        style={[
          styles.shareButton,
          {
            borderColor: colors.primary,
            opacity: isLoading || !inviteCode ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Share invite code"
      >
        <Feather name="share-2" size={20} color={colors.primary} />
        <Text style={[styles.shareText, { color: colors.primary }]}>
          Share Code
        </Text>
      </Pressable>
    </>
  );
}

interface JoinCodeProps {
  joinCode: string;
  onChangeCode: (text: string) => void;
  isSubmitting: boolean;
  colors: Record<string, string>;
  onSubmit: () => void;
}

function JoinCodeSection({
  joinCode,
  onChangeCode,
  isSubmitting,
  colors,
  onSubmit,
}: JoinCodeProps) {
  return (
    <View style={styles.joinSection}>
      <TextInput
        label="Invite Code"
        placeholder="e.g. ABC123"
        value={joinCode}
        onChangeText={onChangeCode}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button
        title="Join Family"
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={!joinCode.trim()}
      />
    </View>
  );
}

/* ---------- Styles ---------- */

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
  codeLoader: {
    marginVertical: 6,
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
  joinSection: {
    width: "100%",
  },
  toggleWrapper: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  toggleText: {
    fontSize: 14,
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

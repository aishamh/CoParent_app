import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../src/theme/useTheme";
import Button from "../../src/components/ui/Button";
import ProgressDots from "../../src/components/ui/ProgressDots";

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const navigateToProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/onboarding/profile");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <ProgressDots total={4} current={0} />

        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Feather name="heart" size={48} color={colors.primaryForeground} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>Welcome to CoParent Connect</Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            The trusted platform for co-parenting coordination. Let's set up
            your family profile.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button title="Get Started" onPress={navigateToProfile} />
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingBottom: 16,
  },
});

import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import Button from "../../src/components/ui/Button";
import ProgressDots from "../../src/components/ui/ProgressDots";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

export default function WelcomeScreen() {
  const navigateToProfile = () => {
    router.push("/onboarding/profile");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ProgressDots total={4} current={0} />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="heart" size={48} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Welcome to CoParent Connect</Text>

          <Text style={styles.subtitle}>
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  footer: {
    paddingBottom: 16,
  },
});

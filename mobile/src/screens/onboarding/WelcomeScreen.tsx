import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useTheme } from "../../theme/useTheme";
import Button from "../../components/ui/Button";
import ProgressDots from "../../components/ui/ProgressDots";

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const navigateToProfile = () => {
    ReactNativeHapticFeedback.trigger("impactLight");
    navigation.navigate("Profile" as never);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        <ProgressDots total={4} current={0} />

        <View style={styles.content}>
          <Image
            source={require("../../assets/app-icon.png")}
            style={styles.appLogo}
            accessibilityLabel="CoParent Connect logo"
          />

          <Text style={[styles.title, { color: colors.foreground }]}>
            Welcome to CoParent Connect
          </Text>

          <Text
            style={[styles.subtitle, { color: colors.mutedForeground }]}
          >
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
  appLogo: {
    width: 120,
    height: 120,
    borderRadius: 28,
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

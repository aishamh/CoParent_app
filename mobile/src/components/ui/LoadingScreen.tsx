import { ActivityIndicator, StyleSheet, View } from "react-native";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={TEAL} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BACKGROUND,
  },
});

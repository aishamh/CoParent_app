import { Stack } from "expo-router";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: TEAL,
        headerStyle: { backgroundColor: BACKGROUND },
        headerShadowVisible: false,
      }}
    />
  );
}

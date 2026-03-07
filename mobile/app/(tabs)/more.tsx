import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "../../src/theme/useTheme";

interface MenuItem {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Expenses", icon: "dollar-sign", route: "/(screens)/expenses" },
  { label: "Documents", icon: "folder", route: "/(screens)/documents" },
  { label: "Activities", icon: "heart", route: "/(screens)/activities" },
  { label: "Education", icon: "book-open", route: "/(screens)/education" },
  { label: "Social", icon: "users", route: "/(screens)/social" },
  { label: "Settings", icon: "settings", route: "/(screens)/settings" },
];

export default function MoreScreen() {
  const { colors } = useTheme();

  function MenuRow({ item }: { item: MenuItem }) {
    const handlePress = () => {
      router.push(item.route as never);
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.row, { borderBottomColor: colors.border }]}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <View style={styles.rowLeft}>
          <Feather name={item.icon} size={20} color={colors.foreground} />
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <Text style={[styles.header, { color: colors.foreground }]}>More</Text>
      <View style={styles.list}>
        {MENU_ITEMS.map((item) => (
          <MenuRow key={item.route} item={item} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    borderBottomWidth: 0.5,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
});

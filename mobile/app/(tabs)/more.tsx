import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

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

function MenuRow({ item }: { item: MenuItem }) {
  const handlePress = () => {
    router.push(item.route as never);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.row}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.rowLeft}>
        <Feather name={item.icon} size={20} color="#374151" />
        <Text style={styles.rowLabel}>{item.label}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.header}>More</Text>
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
    backgroundColor: BACKGROUND,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
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
    borderBottomColor: "#E5E7EB",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
});

import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import Card from "../../components/ui/Card";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Custody Schedule", icon: "repeat", route: "CustodySchedule" },
  { label: "Parenting Plan", icon: "file-text", route: "ParentingPlan" },
  { label: "Exchange Tracking", icon: "map-pin", route: "ExchangeTracking" },
  { label: "Expenses", icon: "dollar-sign", route: "Expenses" },
  { label: "Documents", icon: "folder", route: "Documents" },
  { label: "Export Records", icon: "download", route: "ExportHistory" },
  { label: "Professional Access", icon: "briefcase", route: "ProfessionalAccess" },
  { label: "Education", icon: "book-open", route: "Education" },
  { label: "Social", icon: "users", route: "Social" },
  { label: "Settings", icon: "settings", route: "Settings" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MenuRow({
  item,
  colors,
  onPress,
}: {
  item: MenuItem;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={styles.rowLeft}>
        <Icon name={item.icon} size={20} color={colors.foreground} />
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {item.label}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function HandoverCard({
  colors,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Card style={styles.handoverCard}>
      <View style={styles.handoverHeader}>
        <Icon name="repeat" size={16} color={colors.primary} />
        <Text style={[styles.handoverLabel, { color: colors.primary }]}>
          Next Handover
        </Text>
      </View>
      <Text style={[styles.handoverTime, { color: colors.foreground }]}>
        Friday, 5:00 PM
      </Text>
      <View style={styles.handoverDetailRow}>
        <Icon name="map-pin" size={12} color={colors.mutedForeground} />
        <Text style={[styles.handoverDetailText, { color: colors.mutedForeground }]}>
          School Pickup
        </Text>
        <Icon name="arrow-right" size={12} color={colors.mutedForeground} />
        <Text style={[styles.handoverDetailText, { color: colors.foreground }]}>
          Parent A
        </Text>
      </View>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function MoreScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { colors } = useTheme();

  const handleNavigate = (route: string) => {
    navigation.navigate(route as never);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Text style={[styles.header, { color: colors.foreground }]}>More</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.list}>
          {MENU_ITEMS.map((item) => (
            <MenuRow
              key={item.route}
              item={item}
              colors={colors}
              onPress={() => handleNavigate(item.route)}
            />
          ))}
        </View>

        {/* Handover info card */}
        <View style={styles.handoverSection}>
          <HandoverCard colors={colors} />
        </View>

        {/* Logout button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { borderColor: colors.destructive }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Icon name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
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

  // Handover card
  handoverSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  handoverCard: {
    paddingVertical: 14,
  },
  handoverHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  handoverLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  handoverTime: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  handoverDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  handoverDetailText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Logout
  logoutSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

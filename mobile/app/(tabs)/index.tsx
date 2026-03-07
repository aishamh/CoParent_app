import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../../src/auth/useAuth";
import { useTheme } from "../../src/theme/useTheme";
import Card from "../../src/components/ui/Card";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface QuickAction {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Event", icon: "calendar", route: "/(screens)/add-event" },
  { label: "Send Message", icon: "message-circle", route: "/(tabs)/messages" },
  { label: "Add Expense", icon: "dollar-sign", route: "/(screens)/expenses" },
  { label: "View Documents", icon: "folder", route: "/(screens)/documents" },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const displayName = user?.display_name || user?.username || "there";

  function StatCard({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) {
    return (
      <Card style={styles.statCard}>
        <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </Card>
    );
  }

  function QuickActionButton({ action }: { action: QuickAction }) {
    const handlePress = () => {
      router.push(action.route as never);
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.muted }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <View style={[styles.actionIconWrapper, { backgroundColor: colors.accent }]}>
          <Feather name={action.icon} size={22} color={colors.primary} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            {getGreeting()}, {displayName}!
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatTodayDate()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Schedule</Text>
          <Card>
            <View style={styles.emptyState}>
              <Feather name="calendar" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No events today</Text>
              <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                Tap "Add Event" below to schedule something
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Children" value={0} />
            <StatCard label="This Week" value={0} />
            <StatCard label="Pending" value={0} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton key={action.label} action={action} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  greetingSection: {
    paddingTop: 16,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "47%",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});

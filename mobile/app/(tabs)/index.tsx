import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "../../src/auth/useAuth";
import Card from "../../src/components/ui/Card";

const TEAL = "#0d9488";
const AMBER = "#f59e0b";
const BACKGROUND = "#FDFAF5";

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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
      style={styles.actionButton}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View style={styles.actionIconWrapper}>
        <Feather name={action.icon} size={22} color={TEAL} />
      </View>
      <Text style={styles.actionLabel}>{action.label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const displayName = user?.display_name || user?.username || "there";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {displayName}!
          </Text>
          <Text style={styles.date}>{formatTodayDate()}</Text>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <Card>
            <View style={styles.emptyState}>
              <Feather name="calendar" size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No events today</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add Event" below to schedule something
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <StatCard label="Children" value={0} />
            <StatCard label="This Week" value={0} />
            <StatCard label="Pending" value={0} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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
    backgroundColor: BACKGROUND,
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
    color: "#111827",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
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
    color: TEAL,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
});

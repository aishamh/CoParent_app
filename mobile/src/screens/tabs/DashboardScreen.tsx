import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import { isSameDay, isSameWeek, isAfter, format } from "date-fns";

import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useAuth } from "../../auth/useAuth";
import { useTheme } from "../../theme/useTheme";
import { useChildren } from "../../hooks/useChildren";
import { useEvents, useCreateEvent } from "../../hooks/useEvents";
import { useExpenses } from "../../hooks/useExpenses";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import Card from "../../components/ui/Card";
import type { Event } from "../../types/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getTimeOfDayIcon(): { name: string; color: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { name: "moon", color: "#6366F1" };
  if (hour < 12) return { name: "sunrise", color: "#F59E0B" };
  if (hour < 18) return { name: "sun", color: "#F97316" };
  return { name: "moon", color: "#6366F1" };
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Event", icon: "calendar", route: "AddEvent" },
  { label: "Send Message", icon: "message-circle", route: "Messages" },
  { label: "Add Expense", icon: "dollar-sign", route: "Expenses" },
  { label: "View Documents", icon: "folder", route: "Documents" },
  { label: "Discover Activities", icon: "compass", route: "Discover" },
  { label: "Complete Setup", icon: "check-circle", route: "Onboarding" },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  custody: "#3B82F6",
  activity: "#22C55E",
  medical: "#EF4444",
  school: "#A855F7",
  holiday: "#F59E0B",
  travel: "#06B6D4",
  other: "#6B7280",
};

interface ActivitySuggestion {
  title: string;
  category: string;
  ageRange: string;
  duration: string;
  categoryColor: string;
}

const ACTIVITY_SUGGESTIONS: ActivitySuggestion[] = [
  {
    title: "Nature Scavenger Hunt",
    category: "Outdoor",
    ageRange: "5-10 yrs",
    duration: "2 hours",
    categoryColor: "#22C55E",
  },
  {
    title: "Science Museum Visit",
    category: "Educational",
    ageRange: "6-12 yrs",
    duration: "Half Day",
    categoryColor: "#3B82F6",
  },
  {
    title: "Home Baking Day",
    category: "Indoor",
    ageRange: "4-14 yrs",
    duration: "3 hours",
    categoryColor: "#F59E0B",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OnboardingBanner({
  colors,
  onPress,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <Card style={styles.onboardingBanner}>
      <View style={styles.onboardingRow}>
        <View style={styles.onboardingContent}>
          <Text style={[styles.onboardingTitle, { color: colors.foreground }]}>
            Welcome! Complete your setup
          </Text>
          <Text style={[styles.onboardingSubtitle, { color: colors.mutedForeground }]}>
            Finish onboarding to unlock all features
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPress}
          style={[styles.onboardingButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={[styles.onboardingButtonText, { color: colors.primaryForeground }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function CustodyStatusSection({
  colors,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={styles.custodyRow}>
      <Card style={styles.custodyCard}>
        <View style={[styles.custodyDot, { backgroundColor: colors.parentA }]} />
        <Text style={[styles.custodyLabel, { color: colors.mutedForeground }]}>
          Current Custody
        </Text>
        <Text style={[styles.custodyValue, { color: colors.foreground }]}>
          With Parent A
        </Text>
      </Card>
      <Card style={styles.custodyCard}>
        <View style={[styles.custodyDot, { backgroundColor: colors.parentB }]} />
        <Text style={[styles.custodyLabel, { color: colors.mutedForeground }]}>
          Next Handover
        </Text>
        <Text style={[styles.custodyValue, { color: colors.foreground }]}>
          No upcoming events
        </Text>
      </Card>
    </View>
  );
}

function StatCard({
  label,
  value,
  colors,
}: {
  label: string;
  value: string | number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Card>
  );
}

function TodayEventCard({
  event,
  colors,
}: {
  event: Event;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const borderColor = EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.other;
  const timeDisplay =
    event.start_time !== "00:00"
      ? `${event.start_time} - ${event.end_time}`
      : "All day";

  return (
    <View
      style={[
        styles.todayEvent,
        { backgroundColor: colors.card, borderLeftColor: borderColor },
      ]}
    >
      <Text
        style={[styles.todayEventTitle, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {event.title}
      </Text>
      <Text style={[styles.todayEventTime, { color: colors.mutedForeground }]}>
        {timeDisplay}
      </Text>
    </View>
  );
}

function UpcomingEventsSection({
  events,
  colors,
  onSeeAll,
}: {
  events: Event[];
  colors: ReturnType<typeof useTheme>["colors"];
  onSeeAll: () => void;
}) {
  const now = new Date();
  const futureEvents = events
    .filter((e) => isAfter(new Date(e.start_date), now))
    .slice(0, 5);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Upcoming Events
        </Text>
        <TouchableOpacity onPress={onSeeAll} accessibilityRole="link">
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>
      {futureEvents.length === 0 ? (
        <Card>
          <View style={styles.emptyState}>
            <Icon name="calendar" size={28} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No upcoming events
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.todayEventsList}>
          {futureEvents.map((event) => (
            <TodayEventCard key={event.id} event={event} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

function ActivitySuggestionCard({
  activity,
  colors,
  onAddToPlan,
}: {
  activity: ActivitySuggestion;
  colors: ReturnType<typeof useTheme>["colors"];
  onAddToPlan: (activity: ActivitySuggestion) => void;
}) {
  return (
    <Card style={styles.activityCard}>
      <View style={[styles.categoryBadge, { backgroundColor: activity.categoryColor }]}>
        <Text style={styles.categoryBadgeText}>{activity.category}</Text>
      </View>
      <Text
        style={[styles.activityTitle, { color: colors.foreground }]}
        numberOfLines={1}
      >
        {activity.title}
      </Text>
      <Text style={[styles.activityMeta, { color: colors.mutedForeground }]}>
        {activity.ageRange} &middot; {activity.duration}
      </Text>
      <TouchableOpacity
        onPress={() => onAddToPlan(activity)}
        style={[styles.addToPlanButton, { borderColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={`Add ${activity.title} to plan`}
      >
        <Text style={[styles.addToPlanText, { color: colors.primary }]}>Add to Plan</Text>
      </TouchableOpacity>
    </Card>
  );
}

function AutoPlanWidget({
  colors,
  onPress,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <Card style={styles.autoPlanCard}>
      <View style={[styles.smartBadge, { backgroundColor: colors.accent }]}>
        <Icon name="zap" size={12} color={colors.primary} />
        <Text style={[styles.smartBadgeText, { color: colors.primary }]}>
          Smart Planning
        </Text>
      </View>
      <Text style={[styles.autoPlanHeading, { color: colors.foreground }]}>
        Auto-Plan 2027
      </Text>
      <Text style={[styles.autoPlanDescription, { color: colors.mutedForeground }]}>
        Let AI generate a balanced custody and activity schedule for the entire year.
      </Text>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.startPlanningButton, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Start Planning"
      >
        <Text style={[styles.startPlanningText, { color: colors.primaryForeground }]}>
          Start Planning
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

function QuickActionButton({
  action,
  colors,
  onPress,
}: {
  action: QuickAction;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionButton,
        { backgroundColor: colors.card, borderColor: colors.muted },
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View style={[styles.actionIconWrapper, { backgroundColor: colors.accent }]}>
        <Icon name={action.icon} size={22} color={colors.primary} />
      </View>
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

function QuickAddRow({
  colors,
  onAddEvent,
  onSendMessage,
  onNewExpense,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  onAddEvent: () => void;
  onSendMessage: () => void;
  onNewExpense: () => void;
}) {
  const buttons = [
    { label: "Add Event", icon: "plus-circle", onPress: onAddEvent },
    { label: "Send Message", icon: "send", onPress: onSendMessage },
    { label: "New Expense", icon: "dollar-sign", onPress: onNewExpense },
  ];

  return (
    <View style={styles.quickAddRow}>
      {buttons.map((btn) => (
        <TouchableOpacity
          key={btn.label}
          onPress={btn.onPress}
          style={[styles.quickAddButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={btn.label}
        >
          <Icon name={btn.icon} size={16} color={colors.primaryForeground} />
          <Text style={[styles.quickAddLabel, { color: colors.primaryForeground }]}>
            {btn.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const displayName = user?.display_name || user?.username || "there";

  const { data: children = [] } = useChildren();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: expenses = [] } = useExpenses();
  const createEvent = useCreateEvent();

  const handleAddToPlan = (activity: ActivitySuggestion) => {
    ReactNativeHapticFeedback.trigger("impactLight");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    createEvent.mutate(
      {
        title: activity.title,
        type: "activity",
        start_date: dateStr,
        end_date: dateStr,
        start_time: "10:00",
        end_time: "12:00",
        description: `${activity.category} activity for ${activity.ageRange}. Duration: ${activity.duration}`,
      } as any,
      {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
        },
      },
    );
  };

  useRefreshOnFocus(["children", "events", "expenses"]);

  const today = new Date();
  const todayEvents = events.filter((e) =>
    isSameDay(new Date(e.start_date), today),
  );
  const weekEvents = events.filter((e) =>
    isSameWeek(new Date(e.start_date), today, { weekStartsOn: 1 }),
  );
  const pendingExpenses = expenses.filter((e) => e.status === "pending");

  const navigateTo = (screen: string) => {
    navigation.navigate(screen as never);
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Onboarding banner */}
        <OnboardingBanner
          colors={colors}
          onPress={() => navigateTo("Onboarding")}
        />

        {/* Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Icon
              name={getTimeOfDayIcon().name}
              size={24}
              color={getTimeOfDayIcon().color}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text style={[styles.greeting, { color: colors.foreground }]}>
              {getGreeting()}, {displayName}!
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatTodayDate()}
          </Text>
        </View>

        {/* Custody status */}
        <CustodyStatusSection colors={colors} />

        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Today&apos;s Schedule
          </Text>
          {eventsLoading ? (
            <Card>
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 24 }}
              />
            </Card>
          ) : todayEvents.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <Icon name="calendar" size={32} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  No events today
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                  Tap &quot;Add Event&quot; below to schedule something
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.todayEventsList}>
              {todayEvents.slice(0, 5).map((event) => (
                <TodayEventCard key={event.id} event={event} colors={colors} />
              ))}
              {todayEvents.length > 5 && (
                <Text style={[styles.moreEventsText, { color: colors.primary }]}>
                  +{todayEvents.length - 5} more events
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Stats
          </Text>
          <View style={styles.statsRow}>
            <StatCard label="Children" value={children.length} colors={colors} />
            <StatCard label="This Week" value={weekEvents.length} colors={colors} />
            <StatCard label="Pending" value={pendingExpenses.length} colors={colors} />
          </View>
        </View>

        {/* Upcoming Events */}
        <UpcomingEventsSection
          events={events}
          colors={colors}
          onSeeAll={() => navigateTo("Calendar")}
        />

        {/* Activity Suggestions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Activity Suggestions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activityScroll}
          >
            {ACTIVITY_SUGGESTIONS.map((activity) => (
              <ActivitySuggestionCard
                key={activity.title}
                activity={activity}
                colors={colors}
                onAddToPlan={handleAddToPlan}
              />
            ))}
          </ScrollView>
        </View>

        {/* Auto-Plan widget */}
        <View style={styles.section}>
          <AutoPlanWidget
            colors={colors}
            onPress={() => navigateTo("Calendar")}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton
                key={action.label}
                action={action}
                colors={colors}
                onPress={() => navigateTo(action.route)}
              />
            ))}
          </View>
        </View>

        {/* Quick Add row */}
        <QuickAddRow
          colors={colors}
          onAddEvent={() => navigateTo("AddEvent")}
          onSendMessage={() => navigateTo("Messages")}
          onNewExpense={() => navigateTo("Expenses")}
        />
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
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // Onboarding banner
  onboardingBanner: {
    marginTop: 12,
    marginBottom: 8,
  },
  onboardingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  onboardingContent: {
    flex: 1,
    marginRight: 12,
  },
  onboardingTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  onboardingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  onboardingButton: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  onboardingButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Greeting
  greetingSection: {
    paddingTop: 16,
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
  },
  date: {
    fontSize: 14,
  },

  // Custody status
  custodyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  custodyCard: {
    flex: 1,
    paddingVertical: 14,
  },
  custodyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  custodyLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  custodyValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Empty state
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

  // Stats
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

  // Today events
  todayEventsList: {
    gap: 8,
  },
  todayEvent: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
  },
  todayEventTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  todayEventTime: {
    fontSize: 13,
  },
  moreEventsText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
  },

  // Activity suggestions
  activityScroll: {
    paddingRight: 24,
    gap: 12,
  },
  activityCard: {
    width: 200,
    paddingVertical: 14,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityMeta: {
    fontSize: 12,
    marginBottom: 10,
  },
  addToPlanButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  addToPlanText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Auto-Plan
  autoPlanCard: {
    paddingVertical: 20,
  },
  smartBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginBottom: 10,
  },
  smartBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  autoPlanHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  autoPlanDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  startPlanningButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  startPlanningText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Quick Actions
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

  // Quick Add row
  quickAddRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  quickAddButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
  },
  quickAddLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});

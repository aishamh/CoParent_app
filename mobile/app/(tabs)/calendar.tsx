import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";

import { useEvents } from "../../src/hooks/useEvents";
import { useTheme } from "../../src/theme/useTheme";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import EventForm from "../../src/components/forms/EventForm";
import type { Event } from "../../src/types/schema";
import type { ColorPalette } from "../../src/constants/colors";

type ViewMode = "month" | "week" | "day";

const EVENT_TYPE_COLORS: Record<string, string> = {
  custody: "#3B82F6",
  activity: "#22C55E",
  medical: "#EF4444",
  school: "#A855F7",
  holiday: "#F59E0B",
  travel: "#06B6D4",
  other: "#6B7280",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getEventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.other;
}

function EventCard({ event, colors }: { event: Event; colors: ColorPalette }) {
  const borderColor = getEventTypeColor(event.type);
  const timeDisplay = event.start_time !== "00:00"
    ? `${event.start_time} - ${event.end_time}`
    : "All day";

  const handlePress = () => {
    Alert.alert(
      event.title,
      [
        `Type: ${event.type}`,
        `Date: ${format(new Date(event.start_date), "MMM d, yyyy")}`,
        `Time: ${timeDisplay}`,
        event.location ? `Location: ${event.location}` : null,
        event.description ? `\n${event.description}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.eventCard, { backgroundColor: colors.card, borderLeftColor: borderColor }]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}`}
    >
      <View style={styles.eventHeader}>
        <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: borderColor }]}>
          <Text style={styles.typeBadgeText}>{event.type}</Text>
        </View>
      </View>
      <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>{timeDisplay}</Text>
    </TouchableOpacity>
  );
}

function ViewToggle({
  viewMode,
  onChangeViewMode,
  colors,
}: {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  colors: ColorPalette;
}) {
  const modes: ViewMode[] = ["month", "week", "day"];

  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.muted }]}>
      {modes.map((mode) => {
        const isActive = mode === viewMode;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => onChangeViewMode(mode)}
            style={[styles.toggleButton, isActive && { backgroundColor: colors.card }]}
            accessibilityRole="button"
            accessibilityLabel={`${mode} view`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.toggleText,
                { color: colors.mutedForeground },
                isActive && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MonthView({
  selectedDate,
  onSelectDate,
  events,
  colors,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
  colors: ColorPalette;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const eventDateSet = useMemo(() => {
    const dateStrings = new Set<string>();
    events.forEach((event) => {
      dateStrings.add(format(new Date(event.start_date), "yyyy-MM-dd"));
    });
    return dateStrings;
  }, [events]);

  return (
    <View>
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map((name) => (
          <Text key={name} style={[styles.dayNameText, { color: colors.mutedForeground }]}>
            {name}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = format(day, "yyyy-MM-dd");
          const hasEvents = eventDateSet.has(dateKey);

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => onSelectDate(day)}
              style={[
                styles.dayCell,
                isSelected && { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel={format(day, "MMMM d")}
            >
              <Text
                style={[
                  styles.dayNumber,
                  { color: colors.foreground },
                  !isCurrentMonth && { color: colors.border },
                  isSelected && { color: colors.primaryForeground, fontWeight: "700" },
                ]}
              >
                {format(day, "d")}
              </Text>
              {hasEvents && (
                <View
                  style={[
                    styles.eventDot,
                    { backgroundColor: colors.primary },
                    isSelected && { backgroundColor: colors.primaryForeground },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function WeekView({
  selectedDate,
  onSelectDate,
  events,
  colors,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
  colors: ColorPalette;
}) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventDateSet = useMemo(() => {
    const dateStrings = new Set<string>();
    events.forEach((event) => {
      dateStrings.add(format(new Date(event.start_date), "yyyy-MM-dd"));
    });
    return dateStrings;
  }, [events]);

  return (
    <View style={styles.weekRow}>
      {weekDays.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const dateKey = format(day, "yyyy-MM-dd");
        const hasEvents = eventDateSet.has(dateKey);

        return (
          <TouchableOpacity
            key={dateKey}
            onPress={() => onSelectDate(day)}
            style={[
              styles.weekDayCell,
              { backgroundColor: colors.card },
              isSelected && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={format(day, "EEEE, MMMM d")}
          >
            <Text
              style={[
                styles.weekDayName,
                { color: colors.mutedForeground },
                isSelected && { color: colors.primaryForeground },
              ]}
            >
              {format(day, "EEE")}
            </Text>
            <Text
              style={[
                styles.weekDayNumber,
                { color: colors.foreground },
                isSelected && { color: colors.primaryForeground },
              ]}
            >
              {format(day, "d")}
            </Text>
            {hasEvents && (
              <View
                style={[
                  styles.eventDot,
                  { backgroundColor: colors.primary },
                  isSelected && { backgroundColor: colors.primaryForeground },
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [showEventForm, setShowEventForm] = useState(false);
  const { colors } = useTheme();

  const { data: events = [], isLoading, isRefetching, refetch } = useEvents();
  useRefreshOnFocus(["events"]);

  const selectedDateEvents = useMemo(() => {
    return events.filter((event) =>
      isSameDay(new Date(event.start_date), selectedDate),
    );
  }, [events, selectedDate]);

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((current) => {
      if (viewMode === "month") {
        return direction === "next" ? addMonths(current, 1) : subMonths(current, 1);
      }
      if (viewMode === "week") {
        return direction === "next" ? addWeeks(current, 1) : subWeeks(current, 1);
      }
      return direction === "next" ? addDays(current, 1) : subDays(current, 1);
    });
  };

  const headerLabel = useMemo(() => {
    if (viewMode === "day") return format(selectedDate, "EEEE, MMM d, yyyy");
    if (viewMode === "week") return `Week of ${format(startOfWeek(selectedDate), "MMM d, yyyy")}`;
    return format(selectedDate, "MMMM yyyy");
  }, [selectedDate, viewMode]);

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEventForm(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.headerSection}>
        <Text style={[styles.header, { color: colors.foreground }]}>Calendar</Text>
        <ViewToggle viewMode={viewMode} onChangeViewMode={setViewMode} colors={colors} />
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => navigateDate("prev")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Previous"
        >
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navLabel, { color: colors.foreground }]}>{headerLabel}</Text>
        <TouchableOpacity
          onPress={() => navigateDate("next")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Feather name="chevron-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        {viewMode === "month" && (
          <MonthView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={events}
            colors={colors}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={events}
            colors={colors}
          />
        )}
        {viewMode === "day" && (
          <View style={styles.dayViewHeader}>
            <Text style={[styles.dayViewDate, { color: colors.foreground }]}>
              {format(selectedDate, "EEEE")}
            </Text>
            <Text style={[styles.dayViewFullDate, { color: colors.mutedForeground }]}>
              {format(selectedDate, "MMMM d, yyyy")}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.eventsSection}>
        <Text style={[styles.eventsSectionTitle, { color: colors.foreground }]}>
          Events for {format(selectedDate, "MMM d")}
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No events on this day</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDateEvents}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <EventCard event={item} colors={colors} />}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleFabPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add event"
      >
        <Feather name="plus" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <EventForm
        visible={showEventForm}
        onClose={() => setShowEventForm(false)}
        initialDate={format(selectedDate, "yyyy-MM-dd")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  navButton: {
    padding: 4,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  calendarContainer: {
    paddingHorizontal: 16,
  },
  dayNamesRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  dayNameText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 4,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  dayViewHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  dayViewDate: {
    fontSize: 28,
    fontWeight: "700",
  },
  dayViewFullDate: {
    fontSize: 14,
    marginTop: 4,
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventsList: {
    paddingBottom: 80,
  },
  eventCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  eventTime: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },
  loader: {
    marginTop: 24,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
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
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatTime } from "../../src/utils/formatDate";
import type { Event } from "../../src/types/schema";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

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

function EventCard({ event }: { event: Event }) {
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
      style={[styles.eventCard, { borderLeftColor: borderColor }]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}`}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: borderColor }]}>
          <Text style={styles.typeBadgeText}>{event.type}</Text>
        </View>
      </View>
      <Text style={styles.eventTime}>{timeDisplay}</Text>
    </TouchableOpacity>
  );
}

function ViewToggle({
  viewMode,
  onChangeViewMode,
}: {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}) {
  const modes: ViewMode[] = ["month", "week", "day"];

  return (
    <View style={styles.toggleRow}>
      {modes.map((mode) => {
        const isActive = mode === viewMode;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => onChangeViewMode(mode)}
            style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={`${mode} view`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.toggleText,
                isActive && styles.toggleTextActive,
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
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
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
          <Text key={name} style={styles.dayNameText}>
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
                isSelected && styles.dayCellSelected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={format(day, "MMMM d")}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !isCurrentMonth && styles.dayNumberOutside,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {format(day, "d")}
              </Text>
              {hasEvents && (
                <View
                  style={[
                    styles.eventDot,
                    isSelected && styles.eventDotSelected,
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
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  events: Event[];
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
            style={[styles.weekDayCell, isSelected && styles.weekDayCellSelected]}
            accessibilityRole="button"
            accessibilityLabel={format(day, "EEEE, MMMM d")}
          >
            <Text
              style={[
                styles.weekDayName,
                isSelected && styles.weekDayNameSelected,
              ]}
            >
              {format(day, "EEE")}
            </Text>
            <Text
              style={[
                styles.weekDayNumber,
                isSelected && styles.weekDayNumberSelected,
              ]}
            >
              {format(day, "d")}
            </Text>
            {hasEvents && (
              <View
                style={[
                  styles.eventDot,
                  isSelected && styles.eventDotSelected,
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

  const { data: events = [], isLoading } = useEvents();
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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.header}>Calendar</Text>
        <ViewToggle viewMode={viewMode} onChangeViewMode={setViewMode} />
      </View>

      {/* Date Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => navigateDate("prev")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Previous"
        >
          <Feather name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.navLabel}>{headerLabel}</Text>
        <TouchableOpacity
          onPress={() => navigateDate("next")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Feather name="chevron-right" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Calendar View */}
      <View style={styles.calendarContainer}>
        {viewMode === "month" && (
          <MonthView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={events}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            events={events}
          />
        )}
        {viewMode === "day" && null}
      </View>

      {/* Events for Selected Day */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>
          Events for {format(selectedDate, "MMM d")}
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={TEAL}
            style={styles.loader}
          />
        ) : selectedDateEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>No events on this day</Text>
          </View>
        ) : (
          <FlatList
            data={selectedDateEvents}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <EventCard event={item} />}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert("Add Event", "Event creation form coming soon.")}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add event"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: TEAL,
    fontWeight: "600",
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
    color: "#374151",
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
    color: "#9CA3AF",
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
  dayCellSelected: {
    backgroundColor: TEAL,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  dayNumberOutside: {
    color: "#D1D5DB",
  },
  dayNumberSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: TEAL,
    marginTop: 3,
  },
  eventDotSelected: {
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
  },
  weekDayCellSelected: {
    backgroundColor: TEAL,
  },
  weekDayName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  weekDayNameSelected: {
    color: "#FFFFFF",
  },
  weekDayNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  weekDayNumberSelected: {
    color: "#FFFFFF",
  },
  eventsSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  eventsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  eventsList: {
    paddingBottom: 80,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
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
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    color: "#9CA3AF",
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
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

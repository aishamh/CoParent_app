import React, { useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
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
  getDaysInMonth,
  getDay,
} from "date-fns";

import { useEvents, useDeleteEvent } from "../../hooks/useEvents";
import { useTheme } from "../../theme/useTheme";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import EventForm from "../../components/forms/EventForm";
import type { Event } from "../../types/schema";
import type { ColorPalette } from "../../constants/colors";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = "year" | "month" | "week" | "day";

const CUSTODY_COLORS = {
  parentA: "#0d9488",
  parentB: "#f97316",
  travel: "#8b5cf6",
  holiday: "#eab308",
} as const;

const EVENT_TYPE_COLORS: Record<string, string> = {
  custody: "#3B82F6",
  activity: "#22C55E",
  medical: "#EF4444",
  school: "#A855F7",
  holiday: "#eab308",
  travel: "#8b5cf6",
  other: "#6B7280",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface LegendItem {
  label: string;
  color: string;
}

const COLOR_LEGEND: LegendItem[] = [
  { label: "Parent A", color: CUSTODY_COLORS.parentA },
  { label: "Parent B", color: CUSTODY_COLORS.parentB },
  { label: "Holiday", color: CUSTODY_COLORS.holiday },
  { label: "Travel", color: CUSTODY_COLORS.travel },
];

const FILTER_EVENT_TYPES = [
  "custody",
  "activity",
  "travel",
  "holiday",
  "medical",
  "school",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.other;
}

/** Determine custody background color for a single day based on events. */
function getCustodyColorForDay(
  dateKey: string,
  eventsByDate: Map<string, Event[]>,
): string | null {
  const dayEvents = eventsByDate.get(dateKey);
  if (!dayEvents || dayEvents.length === 0) return null;

  for (const ev of dayEvents) {
    if (ev.type === "travel") return CUSTODY_COLORS.travel;
    if (ev.type === "holiday") return CUSTODY_COLORS.holiday;
  }

  for (const ev of dayEvents) {
    if (ev.type === "custody") {
      const parentLower = ev.parent.toLowerCase();
      if (parentLower.includes("b") || parentLower.includes("2")) {
        return CUSTODY_COLORS.parentB;
      }
      return CUSTODY_COLORS.parentA;
    }
  }

  return null;
}

/** Collect colored dots for a day (one per event type present). */
function getEventDotsForDay(
  dateKey: string,
  eventsByDate: Map<string, Event[]>,
): string[] {
  const dayEvents = eventsByDate.get(dateKey);
  if (!dayEvents || dayEvents.length === 0) return [];
  const uniqueColors = new Set<string>();
  for (const ev of dayEvents) {
    uniqueColors.add(getEventTypeColor(ev.type));
  }
  return Array.from(uniqueColors).slice(0, 3);
}

/** Build an event lookup map keyed by yyyy-MM-dd. */
function buildEventsByDateMap(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const key = ev.start_date.slice(0, 10);
    const existing = map.get(key);
    if (existing) {
      existing.push(ev);
    } else {
      map.set(key, [ev]);
    }
  }
  return map;
}

/** Generate an ICS format string from an array of events. */
function generateICS(events: Event[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoParent//Calendar//EN",
  ];

  for (const ev of events) {
    const startDateClean = ev.start_date.replace(/-/g, "");
    const endDateClean = ev.end_date.replace(/-/g, "");
    const startTimeClean = (ev.start_time || "0000").replace(":", "");
    const endTimeClean = (ev.end_time || "2359").replace(":", "");

    lines.push("BEGIN:VEVENT");
    lines.push(`DTSTART:${startDateClean}T${startTimeClean}00`);
    lines.push(`DTEND:${endDateClean}T${endTimeClean}00`);
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.description) lines.push(`DESCRIPTION:${ev.description}`);
    if (ev.location) lines.push(`LOCATION:${ev.location}`);
    lines.push(`UID:event-${ev.id}@coparent`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColorLegendRow({ colors }: { colors: ColorPalette }) {
  return (
    <View style={styles.legendRow}>
      {COLOR_LEGEND.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text
            style={[styles.legendLabel, { color: colors.mutedForeground }]}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ActionButtonsRow({
  colors,
  onAddEvent,
  onFilter,
  onExport,
  onShare,
}: {
  colors: ColorPalette;
  onAddEvent: () => void;
  onFilter: () => void;
  onExport: () => void;
  onShare: () => void;
}) {
  const actions = [
    { label: "Add Event", icon: "plus", handler: onAddEvent },
    { label: "Filter", icon: "filter", handler: onFilter },
    { label: "Export", icon: "download", handler: onExport },
    { label: "Share", icon: "share-2", handler: onShare },
  ];

  return (
    <View style={styles.actionButtonsRow}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          onPress={action.handler}
          style={[styles.actionSmallButton, { backgroundColor: colors.muted }]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Icon name={action.icon} size={14} color={colors.foreground} />
          <Text
            style={[styles.actionSmallLabel, { color: colors.foreground }]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
  const modes: ViewMode[] = ["year", "month", "week", "day"];

  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.muted }]}>
      {modes.map((mode) => {
        const isActive = mode === viewMode;
        return (
          <TouchableOpacity
            key={mode}
            onPress={() => {
              ReactNativeHapticFeedback.trigger("selection");
              onChangeViewMode(mode);
            }}
            style={[
              styles.toggleButton,
              isActive && { backgroundColor: colors.card },
            ]}
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

// ---------------------------------------------------------------------------
// Event card (tappable for edit)
// ---------------------------------------------------------------------------

function EventCard({
  event,
  colors,
  onPress,
}: {
  event: Event;
  colors: ColorPalette;
  onPress: (event: Event) => void;
}) {
  const borderColor = getEventTypeColor(event.type);
  const timeDisplay =
    event.start_time !== "00:00"
      ? `${event.start_time} - ${event.end_time}`
      : "All day";

  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      style={[
        styles.eventCard,
        { backgroundColor: colors.card, borderLeftColor: borderColor },
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}`}
    >
      <View style={styles.eventHeader}>
        <Text
          style={[styles.eventTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: borderColor }]}>
          <Text style={styles.typeBadgeText}>{event.type}</Text>
        </View>
      </View>
      <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>
        {timeDisplay}
      </Text>
      {event.location && (
        <View style={styles.eventLocationRow}>
          <Icon
            name="map-pin"
            size={12}
            color={colors.mutedForeground}
          />
          <Text
            style={[styles.eventLocation, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {event.location}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Year View with mini month grids
// ---------------------------------------------------------------------------

function MiniMonthGrid({
  year,
  monthIndex,
  colors,
  eventsByDate,
  onSelectDay,
}: {
  year: number;
  monthIndex: number;
  colors: ColorPalette;
  eventsByDate: Map<string, Event[]>;
  onSelectDay: (date: Date) => void;
}) {
  const monthDate = new Date(year, monthIndex, 1);
  const daysInMonth = getDaysInMonth(monthDate);
  const firstDayOfWeek = getDay(monthDate);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <View
      style={[styles.miniMonthContainer, { backgroundColor: colors.card }]}
    >
      <Text style={[styles.miniMonthName, { color: colors.foreground }]}>
        {MONTH_NAMES[monthIndex]}
      </Text>

      <View style={styles.miniDayNamesRow}>
        {SHORT_DAY_NAMES.map((name, idx) => (
          <Text
            key={`${name}-${idx}`}
            style={[styles.miniDayName, { color: colors.mutedForeground }]}
          >
            {name}
          </Text>
        ))}
      </View>

      <View style={styles.miniDaysGrid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.miniDayCell} />;
          }

          const date = new Date(year, monthIndex, day);
          const dateKey = format(date, "yyyy-MM-dd");
          const custodyColor = getCustodyColorForDay(dateKey, eventsByDate);
          const eventDots = getEventDotsForDay(dateKey, eventsByDate);

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.miniDayCell,
                custodyColor
                  ? {
                      backgroundColor: custodyColor + "30",
                      borderRadius: 4,
                    }
                  : undefined,
              ]}
              onPress={() => onSelectDay(date)}
              accessibilityRole="button"
              accessibilityLabel={format(date, "MMMM d")}
            >
              <Text
                style={[
                  styles.miniDayNumber,
                  { color: colors.foreground },
                  custodyColor
                    ? { color: custodyColor, fontWeight: "700" }
                    : undefined,
                ]}
              >
                {day}
              </Text>
              {eventDots.length > 0 && (
                <View style={styles.miniDotsRow}>
                  {eventDots.map((dotColor, di) => (
                    <View
                      key={di}
                      style={[
                        styles.miniEventDot,
                        { backgroundColor: dotColor },
                      ]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function YearPlannerView({
  selectedDate,
  colors,
  eventsByDate,
  onSelectDay,
}: {
  selectedDate: Date;
  colors: ColorPalette;
  eventsByDate: Map<string, Event[]>;
  onSelectDay: (date: Date) => void;
}) {
  const year = selectedDate.getFullYear();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.yearGrid}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <MiniMonthGrid
          key={i}
          year={year}
          monthIndex={i}
          colors={colors}
          eventsByDate={eventsByDate}
          onSelectDay={onSelectDay}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Month View
// ---------------------------------------------------------------------------

function MonthView({
  selectedDate,
  onSelectDate,
  colors,
  eventsByDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  colors: ColorPalette;
  eventsByDate: Map<string, Event[]>;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return (
    <View>
      <View style={styles.dayNamesRow}>
        {DAY_NAMES.map((name) => (
          <Text
            key={name}
            style={[styles.dayNameText, { color: colors.mutedForeground }]}
          >
            {name}
          </Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = format(day, "yyyy-MM-dd");
          const custodyColor = getCustodyColorForDay(dateKey, eventsByDate);
          const eventDots = getEventDotsForDay(dateKey, eventsByDate);

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => onSelectDate(day)}
              style={[
                styles.dayCell,
                custodyColor && !isSelected
                  ? {
                      backgroundColor: custodyColor + "25",
                    }
                  : undefined,
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
                  custodyColor && !isSelected
                    ? { color: custodyColor, fontWeight: "600" }
                    : undefined,
                  isSelected && {
                    color: colors.primaryForeground,
                    fontWeight: "700",
                  },
                ]}
              >
                {format(day, "d")}
              </Text>
              {eventDots.length > 0 && (
                <View style={styles.monthDotsRow}>
                  {eventDots.map((dotColor, di) => (
                    <View
                      key={di}
                      style={[
                        styles.eventDot,
                        { backgroundColor: dotColor },
                        isSelected && {
                          backgroundColor: colors.primaryForeground,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Week View
// ---------------------------------------------------------------------------

function WeekView({
  selectedDate,
  onSelectDate,
  colors,
  eventsByDate,
  onPressEvent,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  colors: ColorPalette;
  eventsByDate: Map<string, Event[]>;
  onPressEvent: (event: Event) => void;
}) {
  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.weekRow}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const custodyColor = getCustodyColorForDay(dateKey, eventsByDate);

          return (
            <TouchableOpacity
              key={dateKey}
              onPress={() => onSelectDate(day)}
              style={[
                styles.weekDayCell,
                { backgroundColor: colors.card },
                custodyColor && !isSelected
                  ? { backgroundColor: custodyColor + "20" }
                  : undefined,
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

              {/* Compact event blocks */}
              {dayEvents.slice(0, 3).map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => onPressEvent(ev)}
                  style={[
                    styles.weekEventBlock,
                    { backgroundColor: getEventTypeColor(ev.type) + "30" },
                  ]}
                >
                  <View
                    style={[
                      styles.weekEventDot,
                      { backgroundColor: getEventTypeColor(ev.type) },
                    ]}
                  />
                  <Text
                    style={[styles.weekEventLabel, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {ev.title}
                  </Text>
                </TouchableOpacity>
              ))}
              {dayEvents.length > 3 && (
                <Text
                  style={[
                    styles.weekMoreLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  +{dayEvents.length - 3}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Day View (timeline style)
// ---------------------------------------------------------------------------

function DayView({
  selectedDate,
  events,
  colors,
  onPressEvent,
}: {
  selectedDate: Date;
  events: Event[];
  colors: ColorPalette;
  onPressEvent: (event: Event) => void;
}) {
  // Generate hour slots from 6am to 10pm
  const hourSlots = Array.from({ length: 17 }, (_, i) => i + 6);

  const eventsWithHour = events.map((ev) => {
    const [h] = (ev.start_time || "00:00").split(":").map(Number);
    return { ...ev, hour: h };
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.dayTimelineContainer}
    >
      <View style={styles.dayViewHeader}>
        <Text style={[styles.dayViewDate, { color: colors.foreground }]}>
          {format(selectedDate, "EEEE")}
        </Text>
        <Text
          style={[styles.dayViewFullDate, { color: colors.mutedForeground }]}
        >
          {format(selectedDate, "MMMM d, yyyy")}
        </Text>
      </View>

      {hourSlots.map((hour) => {
        const hourEvents = eventsWithHour.filter((ev) => ev.hour === hour);
        const label =
          hour === 0
            ? "12 AM"
            : hour < 12
              ? `${hour} AM`
              : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`;

        return (
          <View key={hour} style={styles.timeSlotRow}>
            <Text
              style={[
                styles.timeSlotLabel,
                { color: colors.mutedForeground },
              ]}
            >
              {label}
            </Text>
            <View
              style={[
                styles.timeSlotContent,
                { borderTopColor: colors.border },
              ]}
            >
              {hourEvents.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => onPressEvent(ev)}
                  style={[
                    styles.timelineEvent,
                    {
                      backgroundColor: getEventTypeColor(ev.type) + "20",
                      borderLeftColor: getEventTypeColor(ev.type),
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${ev.title} at ${ev.start_time}`}
                >
                  <Text
                    style={[
                      styles.timelineEventTitle,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {ev.title}
                  </Text>
                  <Text
                    style={[
                      styles.timelineEventTime,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {ev.start_time} - {ev.end_time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* All-day events at bottom */}
      {events.filter((ev) => ev.start_time === "00:00").length > 0 && (
        <View style={styles.allDaySection}>
          <Text
            style={[styles.allDaySectionTitle, { color: colors.foreground }]}
          >
            All Day
          </Text>
          {events
            .filter((ev) => ev.start_time === "00:00")
            .map((ev) => (
              <TouchableOpacity
                key={ev.id}
                onPress={() => onPressEvent(ev)}
                style={[
                  styles.timelineEvent,
                  {
                    backgroundColor: getEventTypeColor(ev.type) + "20",
                    borderLeftColor: getEventTypeColor(ev.type),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.timelineEventTitle,
                    { color: colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {ev.title}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Filter Modal
// ---------------------------------------------------------------------------

function FilterModal({
  visible,
  onClose,
  activeFilters,
  onToggleFilter,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  activeFilters: Set<string>;
  onToggleFilter: (type: string) => void;
  colors: ColorPalette;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.filterOverlay}>
        <View
          style={[
            styles.filterSheet,
            { backgroundColor: colors.card },
          ]}
        >
          <View style={styles.filterSheetHandle}>
            <View
              style={[
                styles.sheetHandleBar,
                { backgroundColor: colors.border },
              ]}
            />
          </View>

          <View style={styles.filterHeader}>
            <Text
              style={[styles.filterTitle, { color: colors.foreground }]}
            >
              Filter Events
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Icon name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {FILTER_EVENT_TYPES.map((type) => {
            const isActive = activeFilters.has(type);
            return (
              <TouchableOpacity
                key={type}
                style={styles.filterRow}
                onPress={() => onToggleFilter(type)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isActive }}
              >
                <View style={styles.filterRowLeft}>
                  <View
                    style={[
                      styles.filterColorDot,
                      { backgroundColor: getEventTypeColor(type) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterLabel,
                      { color: colors.foreground },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={() => onToggleFilter(type)}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "80",
                  }}
                  thumbColor={isActive ? colors.primary : colors.muted}
                />
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[styles.filterDoneButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={[styles.filterDoneText, { color: colors.primaryForeground }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("year");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    () => new Set(FILTER_EVENT_TYPES),
  );

  const { colors } = useTheme();

  const {
    data: allEvents = [],
    isLoading,
    isRefetching,
    refetch,
  } = useEvents();
  useRefreshOnFocus(["events"]);

  // Apply filters
  const events = useMemo(
    () => allEvents.filter((ev) => activeFilters.has(ev.type)),
    [allEvents, activeFilters],
  );

  // Build event lookup map
  const eventsByDate = useMemo(() => buildEventsByDateMap(events), [events]);

  // Events for selected day
  const selectedDateEvents = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate.get(dateKey) ?? [];
  }, [eventsByDate, selectedDate]);

  // ------ Handlers ------

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setSelectedDate((current) => {
        if (viewMode === "year") {
          const delta = direction === "next" ? 1 : -1;
          return new Date(
            current.getFullYear() + delta,
            current.getMonth(),
            1,
          );
        }
        if (viewMode === "month") {
          return direction === "next"
            ? addMonths(current, 1)
            : subMonths(current, 1);
        }
        if (viewMode === "week") {
          return direction === "next"
            ? addWeeks(current, 1)
            : subWeeks(current, 1);
        }
        return direction === "next"
          ? addDays(current, 1)
          : subDays(current, 1);
      });
    },
    [viewMode],
  );

  const headerLabel = useMemo(() => {
    if (viewMode === "year") return String(selectedDate.getFullYear());
    if (viewMode === "day") return format(selectedDate, "EEEE, MMM d, yyyy");
    if (viewMode === "week") {
      return `Week of ${format(startOfWeek(selectedDate), "MMM d, yyyy")}`;
    }
    return format(selectedDate, "MMMM yyyy");
  }, [selectedDate, viewMode]);

  const handleFabPress = () => {
    ReactNativeHapticFeedback.trigger("impactLight");
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = useCallback((event: Event) => {
    ReactNativeHapticFeedback.trigger("impactLight");
    setEditingEvent(event);
    setShowEventForm(true);
  }, []);

  const handleDayTapFromYear = useCallback((date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  }, []);

  const handleExport = useCallback(() => {
    if (events.length === 0) {
      Alert.alert("No Events", "There are no events to export.");
      return;
    }
    const icsContent = generateICS(events);
    Share.share({
      message: icsContent,
      title: "CoParent Calendar Export",
    }).catch(() => {
      // User cancelled share
    });
  }, [events]);

  const handleShare = useCallback(() => {
    Share.share({
      message:
        "Check out our shared family calendar on CoParent! Download the app to stay in sync.",
      title: "CoParent Calendar",
    }).catch(() => {
      // User cancelled share
    });
  }, []);

  const handleCloseEventForm = useCallback(() => {
    setShowEventForm(false);
    setEditingEvent(null);
  }, []);

  // ------ Render ------

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.header, { color: colors.foreground }]}>
          Calendar
        </Text>
        <ViewToggle
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          colors={colors}
        />
      </View>

      {/* Color legend */}
      <ColorLegendRow colors={colors} />

      {/* Navigation row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => navigateDate("prev")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Previous"
        >
          <Icon name="chevron-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navLabel, { color: colors.foreground }]}>
          {headerLabel}
        </Text>
        <TouchableOpacity
          onPress={() => navigateDate("next")}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Icon name="chevron-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <ActionButtonsRow
        colors={colors}
        onAddEvent={() => {
          setEditingEvent(null);
          setShowEventForm(true);
        }}
        onFilter={() => setShowFilter(true)}
        onExport={handleExport}
        onShare={handleShare}
      />

      {/* Calendar views */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View
          style={
            viewMode === "year" ? styles.yearContainer : styles.calendarContainer
          }
        >
          {viewMode === "year" && (
            <YearPlannerView
              selectedDate={selectedDate}
              colors={colors}
              eventsByDate={eventsByDate}
              onSelectDay={handleDayTapFromYear}
            />
          )}

          {viewMode === "month" && (
            <MonthView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              colors={colors}
              eventsByDate={eventsByDate}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              colors={colors}
              eventsByDate={eventsByDate}
              onPressEvent={handleEditEvent}
            />
          )}

          {viewMode === "day" && (
            <DayView
              selectedDate={selectedDate}
              events={selectedDateEvents}
              colors={colors}
              onPressEvent={handleEditEvent}
            />
          )}
        </View>
      )}

      {/* Events list (month and day views show events inline or below) */}
      {viewMode === "month" && (
        <View style={styles.eventsSection}>
          <Text
            style={[styles.eventsSectionTitle, { color: colors.foreground }]}
          >
            Events for {format(selectedDate, "MMM d")}
          </Text>

          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar" size={32} color={colors.border} />
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                No events on this day
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedDateEvents}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  colors={colors}
                  onPress={handleEditEvent}
                />
              )}
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
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleFabPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add event"
      >
        <Icon name="plus" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Event form modal (create & edit) */}
      <EventForm
        visible={showEventForm}
        onClose={handleCloseEventForm}
        initialDate={format(selectedDate, "yyyy-MM-dd")}
        event={editingEvent}
      />

      {/* Filter modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        colors={colors}
      />
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

  // Legend
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Action buttons
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  actionSmallButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionSmallLabel: {
    fontSize: 12,
    fontWeight: "500",
  },

  // View toggle
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

  // Nav
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    gap: 4,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Year planner
  yearContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 80,
  },
  miniMonthContainer: {
    width: "48%",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  miniMonthName: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  miniDayNamesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 2,
  },
  miniDayName: {
    fontSize: 9,
    fontWeight: "500",
    width: 16,
    textAlign: "center",
  },
  miniDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  miniDayCell: {
    width: "14.28%",
    alignItems: "center",
    paddingVertical: 2,
  },
  miniDayNumber: {
    fontSize: 10,
  },
  miniDotsRow: {
    flexDirection: "row",
    gap: 1,
    marginTop: 1,
  },
  miniEventDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  // Calendar (month)
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
    marginTop: 2,
  },
  monthDotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },

  // Week
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
    paddingHorizontal: 4,
  },
  weekDayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 12,
    minHeight: 120,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  weekEventBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    width: "100%",
  },
  weekEventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 2,
  },
  weekEventLabel: {
    fontSize: 8,
    flex: 1,
  },
  weekMoreLabel: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: "500",
  },

  // Day timeline
  dayTimelineContainer: {
    paddingBottom: 80,
  },
  dayViewHeader: {
    alignItems: "center",
    paddingVertical: 16,
  },
  dayViewDate: {
    fontSize: 24,
    fontWeight: "700",
  },
  dayViewFullDate: {
    fontSize: 14,
    marginTop: 4,
  },
  timeSlotRow: {
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  timeSlotLabel: {
    width: 56,
    fontSize: 12,
    fontWeight: "500",
    paddingTop: 6,
    textAlign: "right",
    paddingRight: 8,
  },
  timeSlotContent: {
    flex: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  timelineEvent: {
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  timelineEventTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  timelineEventTime: {
    fontSize: 11,
    marginTop: 2,
  },
  allDaySection: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  allDaySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  // Events section
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
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 12,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },

  // FAB
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

  // Filter modal
  filterOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  filterSheetHandle: {
    alignItems: "center",
    paddingVertical: 12,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  filterRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  filterDoneButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  filterDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

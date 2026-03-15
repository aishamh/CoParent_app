import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Skeleton,
  SkeletonLine,
  SkeletonCircle,
  SkeletonCard,
} from "./Skeleton";
import { useTheme } from "../../theme/useTheme";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const SCREEN_PADDING = 24;
const SECTION_GAP = 24;
const ITEM_GAP = 12;

interface RowWithLinesProps {
  circleSize?: number;
  lineWidths?: (number | string)[];
}

/**
 * Renders a common pattern: circle on the left, stacked lines on the right.
 * Used by messages, expenses, events, and journal skeletons.
 */
function RowWithLines({
  circleSize = 48,
  lineWidths = ["60%", "85%"],
}: RowWithLinesProps) {
  return (
    <View style={sharedStyles.row}>
      <SkeletonCircle size={circleSize} />
      <View style={sharedStyles.rowLines}>
        {lineWidths.map((width, index) => (
          <SkeletonLine key={index} width={width} height={index === 0 ? 14 : 12} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DashboardSkeleton
// ---------------------------------------------------------------------------

export function DashboardSkeleton() {
  const { colors, shadows: themeShadows } = useTheme();

  return (
    <SafeAreaView
      style={[sharedStyles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={sharedStyles.scrollContent}>
        {/* Greeting area */}
        <View style={dashboardStyles.greeting}>
          <SkeletonLine width="55%" height={24} />
          <View style={sharedStyles.spacerSmall} />
          <SkeletonLine width="40%" height={14} />
        </View>

        {/* Stat cards row */}
        <View style={dashboardStyles.statsRow}>
          {Array.from({ length: 3 }).map((_, index) => (
            <View
              key={index}
              style={[
                dashboardStyles.statCard,
                { backgroundColor: colors.card },
                themeShadows.md,
              ]}
            >
              <Skeleton width={36} height={28} borderRadius={4} />
              <View style={sharedStyles.spacerSmall} />
              <SkeletonLine width="70%" height={12} />
            </View>
          ))}
        </View>

        {/* Event list items */}
        <View style={sharedStyles.section}>
          <SkeletonLine width="45%" height={18} />
          <View style={sharedStyles.spacerMedium} />
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={sharedStyles.itemWrapper}>
              <RowWithLines
                circleSize={40}
                lineWidths={["50%", "75%"]}
              />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// MessageListSkeleton
// ---------------------------------------------------------------------------

export function MessageListSkeleton() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[sharedStyles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header placeholder */}
      <View style={messageStyles.header}>
        <SkeletonLine width="35%" height={20} />
      </View>

      {/* Conversation rows */}
      {Array.from({ length: 5 }).map((_, index) => (
        <View
          key={index}
          style={[
            messageStyles.conversationRow,
            { borderBottomColor: colors.border },
          ]}
        >
          <SkeletonCircle size={48} />
          <View style={sharedStyles.rowLines}>
            <View style={messageStyles.topRow}>
              <SkeletonLine width="45%" height={14} />
              <SkeletonLine width={40} height={12} />
            </View>
            <SkeletonLine width="80%" height={12} />
          </View>
        </View>
      ))}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// EventListSkeleton
// ---------------------------------------------------------------------------

export function EventListSkeleton() {
  const { colors, shadows: themeShadows } = useTheme();

  return (
    <SafeAreaView
      style={[sharedStyles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={sharedStyles.scrollContent}>
        {/* Calendar header */}
        <View style={eventStyles.calendarHeader}>
          <Skeleton width={32} height={32} borderRadius={8} />
          <SkeletonLine width="40%" height={20} />
          <Skeleton width={32} height={32} borderRadius={8} />
        </View>

        {/* Day-of-week labels */}
        <View style={eventStyles.weekRow}>
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} width={28} height={12} borderRadius={4} />
          ))}
        </View>

        <View style={sharedStyles.spacerLarge} />

        {/* Event cards */}
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={index}
            style={[
              eventStyles.eventCard,
              { backgroundColor: colors.card, borderLeftColor: colors.muted },
              themeShadows.sm,
            ]}
          >
            <SkeletonLine width={60} height={12} />
            <View style={sharedStyles.spacerSmall} />
            <SkeletonLine width="70%" height={15} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ExpenseListSkeleton
// ---------------------------------------------------------------------------

export function ExpenseListSkeleton() {
  const { colors, shadows: themeShadows } = useTheme();

  return (
    <SafeAreaView
      style={[sharedStyles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={sharedStyles.scrollContent}>
        {/* Summary card */}
        <View
          style={[
            expenseStyles.summaryCard,
            { backgroundColor: colors.card },
            themeShadows.md,
          ]}
        >
          <View style={expenseStyles.summaryRow}>
            <View style={expenseStyles.summaryColumn}>
              <SkeletonLine width="80%" height={12} />
              <View style={sharedStyles.spacerSmall} />
              <Skeleton width={72} height={24} borderRadius={4} />
            </View>
            <View style={expenseStyles.summaryColumn}>
              <SkeletonLine width="80%" height={12} />
              <View style={sharedStyles.spacerSmall} />
              <Skeleton width={72} height={24} borderRadius={4} />
            </View>
          </View>
        </View>

        <View style={sharedStyles.spacerMedium} />

        {/* Expense rows */}
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={index}
            style={[
              expenseStyles.expenseRow,
              { borderBottomColor: colors.border },
            ]}
          >
            <SkeletonCircle size={40} />
            <View style={sharedStyles.rowLines}>
              <SkeletonLine width="55%" height={14} />
              <SkeletonLine width="35%" height={12} />
            </View>
            <Skeleton width={56} height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// JournalListSkeleton
// ---------------------------------------------------------------------------

export function JournalListSkeleton() {
  const { colors, shadows: themeShadows } = useTheme();

  return (
    <SafeAreaView
      style={[sharedStyles.safe, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={sharedStyles.scrollContent}>
        {/* Header with lock icon placeholder */}
        <View style={journalStyles.header}>
          <SkeletonCircle size={28} />
          <SkeletonLine width="40%" height={20} />
        </View>

        {/* Journal entry cards */}
        {Array.from({ length: 3 }).map((_, index) => (
          <View
            key={index}
            style={[
              journalStyles.entryCard,
              { backgroundColor: colors.card },
              themeShadows.md,
            ]}
          >
            <View style={journalStyles.entryHeader}>
              <SkeletonCircle size={32} />
              <View style={journalStyles.entryMeta}>
                <SkeletonLine width="50%" height={14} />
                <View style={sharedStyles.spacerTiny} />
                <SkeletonLine width="30%" height={11} />
              </View>
            </View>
            <View style={sharedStyles.spacerSmall} />
            <SkeletonLine width="90%" height={12} />
            <View style={sharedStyles.spacerTiny} />
            <SkeletonLine width="70%" height={12} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const sharedStyles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: SECTION_GAP,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLines: {
    flex: 1,
    gap: 8,
  },
  itemWrapper: {
    marginBottom: ITEM_GAP,
  },
  spacerTiny: {
    height: 4,
  },
  spacerSmall: {
    height: 8,
  },
  spacerMedium: {
    height: 16,
  },
  spacerLarge: {
    height: 24,
  },
});

// ---------------------------------------------------------------------------
// Layout-specific styles
// ---------------------------------------------------------------------------

const dashboardStyles = StyleSheet.create({
  greeting: {
    paddingTop: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: SECTION_GAP,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
});

const messageStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

const eventStyles = StyleSheet.create({
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  eventCard: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: ITEM_GAP,
  },
});

const expenseStyles = StyleSheet.create({
  summaryCard: {
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryColumn: {
    flex: 1,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

const journalStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: ITEM_GAP,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  entryMeta: {
    flex: 1,
  },
});

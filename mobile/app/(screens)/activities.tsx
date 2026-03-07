import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useActivities, useOsloEvents } from "../../src/hooks/useActivities";
import { useTheme } from "../../src/theme/useTheme";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import type { Activity, OsloEvent } from "../../src/types/schema";

type SeasonFilter = "all" | "spring" | "summer" | "fall" | "winter";

const SEASON_FILTERS: SeasonFilter[] = [
  "all",
  "spring",
  "summer",
  "fall",
  "winter",
];

const SEASON_ICONS: Record<SeasonFilter, keyof typeof Feather.glyphMap> = {
  all: "globe",
  spring: "sun",
  summer: "sun",
  fall: "cloud",
  winter: "cloud-snow",
};

export default function ActivitiesScreen() {
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const { colors } = useTheme();

  const apiSeason = seasonFilter === "all" ? undefined : seasonFilter;
  const { data: activities = [], isLoading: activitiesLoading } =
    useActivities(apiSeason);
  const { data: osloEvents = [], isLoading: osloLoading } = useOsloEvents();
  useRefreshOnFocus(["activities"]);

  const isLoading = activitiesLoading && activities.length === 0;
  const typedOsloEvents = osloEvents as OsloEvent[];

  function FilterChip({
    label,
    isActive,
    onPress,
  }: {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: colors.muted },
          isActive && { backgroundColor: colors.primary },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Filter: ${label}`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.chipText,
            { color: colors.mutedForeground },
            isActive && { color: colors.primaryForeground },
          ]}
        >
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  }

  function OsloEventCard({ event }: { event: OsloEvent }) {
    return (
      <View style={[styles.osloCard, { backgroundColor: colors.card, borderColor: colors.amber }]}>
        <View style={styles.osloCardHeader}>
          <Feather name="map-pin" size={14} color={colors.primary} />
          <Text style={[styles.osloLocation, { color: colors.mutedForeground }]} numberOfLines={1}>
            {event.location?.name ?? "Oslo"}
          </Text>
          {event.isFree && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          )}
        </View>
        <Text style={[styles.osloTitle, { color: colors.foreground }]} numberOfLines={2}>
          {event.title || event.name}
        </Text>
        <Text style={[styles.osloDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
          {event.description}
        </Text>
        <View style={styles.osloFooter}>
          <Text style={[styles.osloDate, { color: colors.mutedForeground }]}>
            {event.startDate}
            {event.startTime ? ` at ${event.startTime}` : ""}
          </Text>
        </View>
      </View>
    );
  }

  function ActivityCard({ activity }: { activity: Activity }) {
    return (
      <View
        style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: colors.foreground }]} numberOfLines={1}>
            {activity.title}
          </Text>
          {activity.season && (
            <View style={[styles.seasonBadge, { backgroundColor: colors.muted }]}>
              <Feather
                name={SEASON_ICONS[activity.season as SeasonFilter] ?? "globe"}
                size={12}
                color={colors.mutedForeground}
              />
              <Text style={[styles.seasonBadgeText, { color: colors.mutedForeground }]}>{activity.season}</Text>
            </View>
          )}
        </View>
        <View style={styles.activityMeta}>
          <View style={styles.metaTag}>
            <Feather name="tag" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTagText, { color: colors.mutedForeground }]}>{activity.category}</Text>
          </View>
          <View style={styles.metaTag}>
            <Feather name="users" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTagText, { color: colors.mutedForeground }]}>{activity.age_range}</Text>
          </View>
          <View style={styles.metaTag}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaTagText, { color: colors.mutedForeground }]}>{activity.duration}</Text>
          </View>
        </View>
        <Text style={[styles.activityDescription, { color: colors.mutedForeground }]} numberOfLines={3}>
          {activity.description}
        </Text>
      </View>
    );
  }

  function EmptyActivities() {
    return (
      <View style={styles.emptyState}>
        <Feather name="heart" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No activities</Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Discover fun activities for the whole family.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <Stack.Screen options={{ title: "Activities" }} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {SEASON_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            isActive={seasonFilter === filter}
            onPress={() => setSeasonFilter(filter)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            typedOsloEvents.length > 0 ? (
              <View style={styles.osloSection}>
                <View style={styles.osloSectionHeader}>
                  <Feather name="map-pin" size={18} color={colors.amber} />
                  <Text style={[styles.osloSectionTitle, { color: colors.foreground }]}>Oslo Events</Text>
                </View>
                <FlatList
                  data={typedOsloEvents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <OsloEventCard event={item} />}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.osloList}
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !activitiesLoading ? <EmptyActivities /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  chipRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  osloSection: {
    marginBottom: 20,
  },
  osloSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  osloSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  osloList: {
    gap: 12,
  },
  osloCard: {
    width: 260,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  osloCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  osloLocation: {
    fontSize: 12,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#065F46",
  },
  osloTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  osloDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  osloFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  osloDate: {
    fontSize: 12,
  },
  activityCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  seasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seasonBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  activityMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaTagText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  activityDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
});

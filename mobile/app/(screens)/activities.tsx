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
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import type { Activity, OsloEvent } from "../../src/types/schema";

const TEAL = "#0d9488";
const AMBER = "#f59e0b";
const BACKGROUND = "#FDFAF5";

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
      style={[styles.chip, isActive && styles.chipActive]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function OsloEventCard({ event }: { event: OsloEvent }) {
  return (
    <View style={styles.osloCard}>
      <View style={styles.osloCardHeader}>
        <Feather name="map-pin" size={14} color={TEAL} />
        <Text style={styles.osloLocation} numberOfLines={1}>
          {event.location?.name ?? "Oslo"}
        </Text>
        {event.isFree && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Free</Text>
          </View>
        )}
      </View>
      <Text style={styles.osloTitle} numberOfLines={2}>
        {event.title || event.name}
      </Text>
      <Text style={styles.osloDescription} numberOfLines={2}>
        {event.description}
      </Text>
      <View style={styles.osloFooter}>
        <Text style={styles.osloDate}>
          {event.startDate}
          {event.startTime ? ` at ${event.startTime}` : ""}
        </Text>
      </View>
    </View>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <View style={styles.activityCard} accessibilityRole="summary">
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        {activity.season && (
          <View style={styles.seasonBadge}>
            <Feather
              name={SEASON_ICONS[activity.season as SeasonFilter] ?? "globe"}
              size={12}
              color="#6B7280"
            />
            <Text style={styles.seasonBadgeText}>{activity.season}</Text>
          </View>
        )}
      </View>
      <View style={styles.activityMeta}>
        <View style={styles.metaTag}>
          <Feather name="tag" size={12} color="#9CA3AF" />
          <Text style={styles.metaTagText}>{activity.category}</Text>
        </View>
        <View style={styles.metaTag}>
          <Feather name="users" size={12} color="#9CA3AF" />
          <Text style={styles.metaTagText}>{activity.age_range}</Text>
        </View>
        <View style={styles.metaTag}>
          <Feather name="clock" size={12} color="#9CA3AF" />
          <Text style={styles.metaTagText}>{activity.duration}</Text>
        </View>
      </View>
      <Text style={styles.activityDescription} numberOfLines={3}>
        {activity.description}
      </Text>
    </View>
  );
}

function EmptyActivities() {
  return (
    <View style={styles.emptyState}>
      <Feather name="heart" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No activities</Text>
      <Text style={styles.emptySubtext}>
        Discover fun activities for the whole family.
      </Text>
    </View>
  );
}

export default function ActivitiesScreen() {
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");

  const apiSeason = seasonFilter === "all" ? undefined : seasonFilter;
  const { data: activities = [], isLoading: activitiesLoading } =
    useActivities(apiSeason);
  const { data: osloEvents = [], isLoading: osloLoading } = useOsloEvents();
  useRefreshOnFocus(["activities"]);

  const isLoading = activitiesLoading && activities.length === 0;
  const typedOsloEvents = osloEvents as OsloEvent[];

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ title: "Activities" }} />

      {/* Season Filters */}
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
          <ActivityIndicator size="large" color={TEAL} />
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
                  <Feather name="map-pin" size={18} color={AMBER} />
                  <Text style={styles.osloSectionTitle}>Oslo Events</Text>
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
    backgroundColor: BACKGROUND,
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
    backgroundColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: TEAL,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#FFFFFF",
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
    color: "#111827",
  },
  osloList: {
    gap: 12,
  },
  osloCard: {
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  osloCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  osloLocation: {
    fontSize: 12,
    color: "#6B7280",
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
    color: "#111827",
    marginBottom: 4,
  },
  osloDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  osloFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  osloDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
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
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  seasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  seasonBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
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
    color: "#9CA3AF",
    textTransform: "capitalize",
  },
  activityDescription: {
    fontSize: 14,
    color: "#6B7280",
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
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
  },
});

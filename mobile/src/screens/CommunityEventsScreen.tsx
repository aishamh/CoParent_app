import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format, isSameDay, isThisWeek, parseISO, isTomorrow } from "date-fns";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import {
  useCommunityEvents,
  useCommunityEventSummary,
  useRsvpToEvent,
} from "../hooks/useCommunityEvents";
import { useCarpoolArrangements, useCreateCarpoolArrangement } from "../hooks/useCarpool";
import type { CommunityEvent } from "../types/schema";
import Card from "../components/ui/Card";

// ============================================================
// Types
// ============================================================

type CategoryFilter = "all" | "sports" | "arts" | "education" | "social" | "outdoor" | "other";
type TimeFilter = "all" | "today" | "this_week" | "this_month";

interface CommunityEventWithRsvp extends CommunityEvent {
  user_rsvp_status: "going" | "interested" | "declined" | null;
}

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "grid" },
  { id: "sports", label: "Sports", icon: "activity" },
  { id: "arts", label: "Arts", icon: "palette" },
  { id: "education", label: "Education", icon: "book" },
  { id: "social", label: "Social", icon: "users" },
  { id: "outdoor", label: "Outdoor", icon: "sun" },
  { id: "other", label: "Other", icon: "more-horizontal" },
];

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
];

// ============================================================
// Helper Functions
// ============================================================

function getCategoryColor(category: string | null): string {
  const colors: Record<string, string> = {
    sports: "#22C55E",
    arts: "#A855F7",
    education: "#3B82F6",
    social: "#EC4899",
    outdoor: "#F59E0B",
    other: "#6B7280",
  };
  return colors[category || "other"] || colors.other;
}

function getCategoryIcon(category: string | null): string {
  const icons: Record<string, string> = {
    sports: "activity",
    arts: "palette",
    education: "book",
    social: "users",
    outdoor: "sun",
    other: "more-horizontal",
  };
  return icons[category || "other"] || icons.other;
}

function formatEventDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isSameDay(date, new Date())) {
    return "Today";
  }
  if (isTomorrow(date)) {
    return "Tomorrow";
  }
  if (isThisWeek(date)) {
    return format(date, "EEEE");
  }
  return format(date, "MMM d");
}

function formatEventTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function groupEventsByDate(events: CommunityEventWithRsvp[]): Record<string, CommunityEventWithRsvp[]> {
  return events.reduce((groups, event) => {
    const dateKey = formatEventDate(event.event_date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(event);
    return groups;
  }, {} as Record<string, CommunityEventWithRsvp[]>);
}

function filterEventsByTime(events: CommunityEventWithRsvp[], filter: TimeFilter): CommunityEventWithRsvp[] {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  if (filter === "today") {
    return events.filter((e) => e.event_date === todayStr);
  }
  if (filter === "this_week") {
    return events.filter((e) => {
      const eventDate = parseISO(e.event_date);
      return isThisWeek(eventDate);
    });
  }
  // For this_month, we'll just return all since we already limit by date in API
  return events;
}

// ============================================================
// Components
// ============================================================

function CategoryFilterBar({
  selected,
  onSelect,
  colors,
}: {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  colors: any;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.categoryChip,
            selected === cat.id && { backgroundColor: colors.primary },
            selected !== cat.id && { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactLight");
            onSelect(cat.id);
          }}
          activeOpacity={0.7}
        >
          <Icon
            name={cat.icon}
            size={16}
            color={selected === cat.id ? colors.primaryForeground : colors.mutedForeground}
          />
          <Text
            style={[
              styles.categoryText,
              selected === cat.id && { color: colors.primaryForeground },
              selected !== cat.id && { color: colors.foreground },
            ]}
          >
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function TimeFilterBar({
  selected,
  onSelect,
  colors,
}: {
  selected: TimeFilter;
  onSelect: (filter: TimeFilter) => void;
  colors: any;
}) {
  return (
    <View style={styles.timeFilterContainer}>
      {TIME_FILTERS.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          onPress={() => {
            ReactNativeHapticFeedback.trigger("impactLight");
            onSelect(filter.id);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.timeFilterText,
              selected === filter.id && { color: colors.primary, fontWeight: "700" },
              selected !== filter.id && { color: colors.mutedForeground },
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface EventCardProps {
  event: CommunityEventWithRsvp;
  colors: any;
  onPress: (event: CommunityEventWithRsvp) => void;
  onRsvp: (status: "going" | "interested" | "declined") => void;
  rsvpPending: boolean;
}

function EventCard({ event, colors, onPress, onRsvp, rsvpPending }: EventCardProps) {
  const categoryColor = getCategoryColor(event.category);
  const categoryIcon = getCategoryIcon(event.category);

  return (
    <View style={styles.eventCardWrapper}>
      <TouchableOpacity onPress={() => onPress(event)} activeOpacity={0.8}>
        <Card style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.eventCardHeader}>
            <View style={[styles.eventCategoryBadge, { backgroundColor: categoryColor + "20" }]}>
              <Icon name={categoryIcon} size={14} color={categoryColor} />
              <Text style={[styles.eventCategoryText, { color: categoryColor }]}>
                {event.category || "Other"}
              </Text>
            </View>
            {event.price && (
              <Text style={[styles.eventPrice, { color: colors.mutedForeground }]}>
                {event.price}
              </Text>
            )}
          </View>

          <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={2}>
            {event.title}
          </Text>

          {event.description && (
            <Text style={[styles.eventDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          <View style={styles.eventMeta}>
            <View style={styles.eventMetaItem}>
              <Icon name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>
                {formatEventDate(event.event_date)}
              </Text>
            </View>
            {event.event_time && (
              <View style={styles.eventMetaItem}>
                <Icon name="clock" size={14} color={colors.mutedForeground} />
                <Text style={[styles.eventMetaText, { color: colors.mutedForeground }]}>
                  {formatEventTime(event.event_time)}
                </Text>
              </View>
            )}
          </View>

          {event.location && (
            <View style={styles.eventLocation}>
              <Icon name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.eventLocationText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          {event.source_name && (
            <View style={styles.eventSource}>
              <Icon name="briefcase" size={12} color={colors.mutedForeground} />
              <Text style={[styles.eventSourceText, { color: colors.mutedForeground }]}>
                {event.source_name}
              </Text>
            </View>
          )}

          {/* RSVP Buttons */}
          <View style={styles.rsvpActions}>
            {event.user_rsvp_status !== "going" && (
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  styles.rsvpButtonGoing,
                  { backgroundColor: "#22C55E" },
                ]}
                onPress={() => onRsvp("going")}
                disabled={rsvpPending}
                activeOpacity={0.7}
              >
                {rsvpPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={[styles.rsvpButtonText, { color: "#FFFFFF" }]}>Going</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {event.user_rsvp_status === "going" && (
              <View style={[styles.rsvpButton, styles.rsvpButtonGoing, { backgroundColor: "#D1FAE5" }]}>
                <Icon name="check-circle" size={16} color="#065F46" />
                <Text style={[styles.rsvpButtonText, { color: "#065F46" }]}>Going</Text>
              </View>
            )}

            {event.user_rsvp_status !== "interested" && event.user_rsvp_status !== "going" && (
              <TouchableOpacity
                style={[
                  styles.rsvpButton,
                  styles.rsvpButtonInterested,
                  { borderColor: colors.border },
                ]}
                onPress={() => onRsvp("interested")}
                disabled={rsvpPending}
                activeOpacity={0.7}
              >
                <Text style={[styles.rsvpButtonText, { color: colors.foreground }]}>Interested</Text>
              </TouchableOpacity>
            )}

            {event.user_rsvp_status === "interested" && (
              <View style={[
                styles.rsvpButton,
                styles.rsvpButtonInterested,
                { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
              ]}>
                <Text style={[styles.rsvpButtonText, { color: "#92400E" }]}>Interested</Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}

interface EventDetailModalProps {
  visible: boolean;
  event: CommunityEventWithRsvp | null;
  colors: any;
  onClose: () => void;
  onRsvp: (status: "going" | "interested" | "declined") => void;
  rsvpPending: boolean;
  onCreateCarpool: (type: "need_ride" | "offering_ride") => void;
}

function EventDetailModal({
  visible,
  event,
  colors,
  onClose,
  onRsvp,
  rsvpPending,
  onCreateCarpool,
}: EventDetailModalProps) {
  if (!event) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {event.title}
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.modalSection}>
              <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                When & Where
              </Text>
              <View style={styles.modalDetailRow}>
                <Icon name="calendar" size={18} color={colors.mutedForeground} />
                <Text style={[styles.modalDetailText, { color: colors.foreground }]}>
                  {formatEventDate(event.event_date)} {event.event_time && `at ${formatEventTime(event.event_time)}`}
                </Text>
              </View>
              {event.location && (
                <View style={styles.modalDetailRow}>
                  <Icon name="map-pin" size={18} color={colors.mutedForeground} />
                  <Text style={[styles.modalDetailText, { color: colors.foreground }]}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>

            {event.description && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                  About
                </Text>
                <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
                  {event.description}
                </Text>
              </View>
            )}

            {event.tags && event.tags.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                  Tags
                </Text>
                <View style={styles.tagsContainer}>
                  {event.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.tagChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {event.user_rsvp_status === "going" && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.foreground }]}>
                  Carpool Options
                </Text>
                <View style={styles.carpoolButtons}>
                  <TouchableOpacity
                    style={[styles.carpoolButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => onCreateCarpool("need_ride")}
                    activeOpacity={0.7}
                  >
                    <Icon name="navigation" size={20} color={colors.primary} />
                    <Text style={[styles.carpoolButtonText, { color: colors.foreground }]}>
                      Need a Ride
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.carpoolButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => onCreateCarpool("offering_ride")}
                    activeOpacity={0.7}
                  >
                    <Icon name="car" size={20} color={colors.primary} />
                    <Text style={[styles.carpoolButtonText, { color: colors.foreground }]}>
                      Offer a Ride
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {event.user_rsvp_status !== "going" && (
            <TouchableOpacity
              style={[styles.rsvpCta, { backgroundColor: colors.primary }]}
              onPress={() => onRsvp("going")}
              disabled={rsvpPending}
              activeOpacity={0.7}
            >
              {rsvpPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.rsvpCtaText, { color: colors.primaryForeground }]}>
                  I'm Going
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Main Screen
// ============================================================

export default function CommunityEventsScreen() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedTime, setSelectedTime] = useState<TimeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<CommunityEventWithRsvp | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { colors } = useTheme();
  const { data, isLoading, isRefetching, refetch } = useCommunityEvents({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    include_attended: true,
  });
  const { data: summary } = useCommunityEventSummary();
  const rsvpMutation = useRsvpToEvent();

  useRefreshOnFocus(["communityEvents"]);

  const filteredEvents = useMemo(() => {
    if (!data?.data) return [];
    let events = data.data as CommunityEventWithRsvp[];
    if (selectedTime !== "all") {
      events = filterEventsByTime(events, selectedTime);
    }
    return events;
  }, [data?.data, selectedTime]);

  const groupedEvents = useMemo(() => {
    return groupEventsByDate(filteredEvents);
  }, [filteredEvents]);

  const recommendedEvents = useMemo(() => {
    return (data?.recommended || []) as CommunityEventWithRsvp[];
  }, [data?.recommended]);

  const handleEventPress = (event: CommunityEventWithRsvp) => {
    ReactNativeHapticFeedback.trigger("impactLight");
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleRsvp = (eventId: string, status: "going" | "interested" | "declined") => {
    rsvpMutation.mutate(
      { eventId, data: { status, attending_children: [] } },
      {
        onSuccess: () => {
          if (status === "declined") {
            setShowDetailModal(false);
          }
        },
      },
    );
  };

  const handleCreateCarpool = (type: "need_ride" | "offering_ride") => {
    // Navigate to carpool setup or show modal
    Alert.alert("Carpool", `${type === "need_ride" ? "Request" : "Offer"} ride functionality`);
    setShowDetailModal(false);
  };

  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.foreground }]}>{date}</Text>
    </View>
  );

  const renderRecommendedSection = () => {
    if (recommendedEvents.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="star" size={18} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recommended for You
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {recommendedEvents.map((event) => (
            <View key={event.id} style={styles.horizontalCard}>
              <EventCard
                event={event}
                colors={colors}
                onPress={handleEventPress}
                onRsvp={(status) => handleRsvp(event.id, status)}
                rsvpPending={rsvpMutation.isPending}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTimelineSection = () => {
    const dates = Object.keys(groupedEvents).sort((a, b) => {
      // Sort dates - today first, then tomorrow, then by date
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Tomorrow") return -1;
      if (b === "Tomorrow") return 1;
      return a.localeCompare(b);
    });

    if (dates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="calendar" size={48} color={colors.border} />
          <Text style={[styles.emptyStateTitle, { color: colors.mutedForeground }]}>
            No events found
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.mutedForeground }]}>
            Try changing your filters or check back later
          </Text>
        </View>
      );
    }

    return dates.map((date) => (
      <View key={date} style={styles.timelineSection}>
        {renderSectionHeader(date)}
        {groupedEvents[date].map((event) => (
          <EventCard
            key={event.id}
            event={event}
            colors={colors}
            onPress={handleEventPress}
            onRsvp={(status) => handleRsvp(event.id, status)}
            rsvpPending={rsvpMutation.isPending}
          />
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  Community Events
                </Text>
                {summary && (
                  <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                    {summary.upcoming_week.length} events this week
                  </Text>
                )}
              </View>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="Search events..."
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            {/* Time Filter */}
            <TimeFilterBar selected={selectedTime} onSelect={setSelectedTime} colors={colors} />

            {/* Category Filter */}
            <CategoryFilterBar selected={selectedCategory} onSelect={setSelectedCategory} colors={colors} />

            {/* Recommended Section */}
            {renderRecommendedSection()}

            {/* Timeline */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Upcoming Events
              </Text>
            </View>

            {renderTimelineSection()}
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />

      <EventDetailModal
        visible={showDetailModal}
        event={selectedEvent}
        colors={colors}
        onClose={() => setShowDetailModal(false)}
        onRsvp={(status) => selectedEvent && handleRsvp(selectedEvent.id, status)}
        rsvpPending={rsvpMutation.isPending}
        onCreateCarpool={handleCreateCarpool}
      />
    </SafeAreaView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginHorizontal: 24,
    borderRadius: 12,
    height: 44,
    borderWidth: 0.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  timeFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 20,
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  timelineSection: {
    marginTop: 8,
  },
  horizontalList: {
    paddingLeft: 24,
    paddingVertical: 8,
  },
  horizontalCard: {
    width: 300,
    marginRight: 12,
  },
  eventCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  eventCardWrapper: {
    marginHorizontal: 24,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventCategoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventPrice: {
    fontSize: 13,
    fontWeight: "600",
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  eventMeta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  eventMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eventMetaText: {
    fontSize: 13,
  },
  eventLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  eventLocationText: {
    fontSize: 13,
    flex: 1,
  },
  eventSource: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  eventSourceText: {
    fontSize: 12,
  },
  rsvpActions: {
    flexDirection: "row",
    gap: 8,
  },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    borderWidth: 0.5,
  },
  rsvpButtonGoing: {
    flex: 1.5,
  },
  rsvpButtonInterested: {
    flex: 1,
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  modalBody: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  modalDetailText: {
    fontSize: 15,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  tagText: {
    fontSize: 13,
  },
  carpoolButtons: {
    flexDirection: "row",
    gap: 12,
  },
  carpoolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    justifyContent: "center",
  },
  carpoolButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rsvpCta: {
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  rsvpCtaText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

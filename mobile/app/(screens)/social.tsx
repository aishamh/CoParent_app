import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import {
  useFriends,
  useSocialEvents,
  useUpdateSocialEvent,
} from "../../src/hooks/useSocial";
import { useTheme } from "../../src/theme/useTheme";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatShortDate } from "../../src/utils/formatDate";
import FriendForm from "../../src/components/forms/FriendForm";
import type { Friend, SocialEvent } from "../../src/types/schema";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export default function SocialScreen() {
  const [showFriendForm, setShowFriendForm] = useState(false);
  const { colors } = useTheme();

  const { data: friends = [], isLoading: friendsLoading, isRefetching: friendsRefetching, refetch: refetchFriends } = useFriends();
  const { data: socialEvents = [], isLoading: eventsLoading, isRefetching: eventsRefetching, refetch: refetchEvents } =
    useSocialEvents();

  useRefreshOnFocus(["friends"]);
  useRefreshOnFocus(["socialEvents"]);

  const isLoading = friendsLoading && eventsLoading;
  const isRefetching = friendsRefetching || eventsRefetching;

  const handleRefresh = () => {
    refetchFriends();
    refetchEvents();
  };

  function AvatarCircle({ name }: { name: string }) {
    return (
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{getInitials(name)}</Text>
      </View>
    );
  }

  function FriendCard({ friend }: { friend: Friend }) {
    return (
      <View style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AvatarCircle name={friend.name} />
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.name}</Text>
          <Text style={[styles.friendRelation, { color: colors.mutedForeground }]}>{friend.relation}</Text>
          {friend.email && (
            <Text style={[styles.friendEmail, { color: colors.mutedForeground }]}>{friend.email}</Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={colors.border} />
      </View>
    );
  }

  function RsvpButton({
    label,
    isActive,
    variant,
    onPress,
  }: {
    label: string;
    isActive: boolean;
    variant: "accept" | "decline";
    onPress: () => void;
  }) {
    const activeColor = variant === "accept" ? "#22C55E" : "#EF4444";

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.rsvpButton,
          isActive && { backgroundColor: activeColor },
          !isActive && { borderWidth: 1, borderColor: activeColor },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label} this event`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.rsvpButtonText,
            isActive ? { color: "#FFFFFF" } : { color: activeColor },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function SocialEventCard({ event }: { event: SocialEvent }) {
    const updateEvent = useUpdateSocialEvent();

    const handleRsvp = (status: "accepted" | "declined") => {
      updateEvent.mutate({
        id: event.id,
        updates: { rsvp_status: status },
      });
    };

    return (
      <View style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventTitle, { color: colors.foreground }]} numberOfLines={1}>
            {event.title}
          </Text>
        </View>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
              {formatShortDate(event.date)}
            </Text>
          </View>
          {event.location && (
            <View style={styles.eventDetailRow}>
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>{event.location}</Text>
            </View>
          )}
        </View>
        {event.description && (
          <Text style={[styles.eventDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
            {event.description}
          </Text>
        )}
        <View style={styles.rsvpRow}>
          <RsvpButton
            label="Accept"
            isActive={event.rsvp_status === "accepted"}
            variant="accept"
            onPress={() => handleRsvp("accepted")}
          />
          <RsvpButton
            label="Decline"
            isActive={event.rsvp_status === "declined"}
            variant="decline"
            onPress={() => handleRsvp("declined")}
          />
        </View>
      </View>
    );
  }

  function EmptySection({
    icon,
    title,
    subtitle,
  }: {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
  }) {
    return (
      <View style={styles.emptySection}>
        <Feather name={icon} size={36} color={colors.border} />
        <Text style={[styles.emptySectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
        <Text style={[styles.emptySectionSubtext, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    );
  }

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFriendForm(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
        <Stack.Screen options={{ title: "Social" }} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <Stack.Screen options={{ title: "Social" }} />

      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Friends</Text>
              {friends.length === 0 ? (
                <EmptySection
                  icon="users"
                  title="No friends yet"
                  subtitle="Add friends to organize playdates."
                />
              ) : (
                friends.map((friend) => (
                  <FriendCard key={friend.id} friend={friend} />
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Playdates & Events
              </Text>
              {socialEvents.length === 0 ? (
                <EmptySection
                  icon="calendar"
                  title="No events yet"
                  subtitle="Plan a playdate or family event."
                />
              ) : (
                socialEvents.map((event) => (
                  <SocialEventCard key={event.id} event={event} />
                ))
              )}
            </View>
          </>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleFabPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add friend"
      >
        <Feather name="user-plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <FriendForm
        visible={showFriendForm}
        onClose={() => setShowFriendForm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
  },
  friendRelation: {
    fontSize: 13,
    marginTop: 1,
    textTransform: "capitalize",
  },
  friendEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  eventCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  eventDetails: {
    gap: 4,
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  rsvpRow: {
    flexDirection: "row",
    gap: 10,
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  rsvpButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptySectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySectionSubtext: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
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

import React from "react";
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
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
  useFriends,
  useSocialEvents,
  useUpdateSocialEvent,
} from "../../src/hooks/useSocial";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatShortDate } from "../../src/utils/formatDate";
import type { Friend, SocialEvent } from "../../src/types/schema";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function AvatarCircle({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

function FriendCard({ friend }: { friend: Friend }) {
  return (
    <View style={styles.friendCard}>
      <AvatarCircle name={friend.name} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name}</Text>
        <Text style={styles.friendRelation}>{friend.relation}</Text>
        {friend.email && (
          <Text style={styles.friendEmail}>{friend.email}</Text>
        )}
      </View>
      <Feather name="chevron-right" size={18} color="#D1D5DB" />
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
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>
          {event.title}
        </Text>
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Feather name="calendar" size={14} color="#9CA3AF" />
          <Text style={styles.eventDetailText}>
            {formatShortDate(event.date)}
          </Text>
        </View>
        {event.location && (
          <View style={styles.eventDetailRow}>
            <Feather name="map-pin" size={14} color="#9CA3AF" />
            <Text style={styles.eventDetailText}>{event.location}</Text>
          </View>
        )}
      </View>
      {event.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
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
      <Feather name={icon} size={36} color="#D1D5DB" />
      <Text style={styles.emptySectionTitle}>{title}</Text>
      <Text style={styles.emptySectionSubtext}>{subtitle}</Text>
    </View>
  );
}

export default function SocialScreen() {
  const { data: friends = [], isLoading: friendsLoading } = useFriends();
  const { data: socialEvents = [], isLoading: eventsLoading } =
    useSocialEvents();

  useRefreshOnFocus(["friends"]);
  useRefreshOnFocus(["socialEvents"]);

  const isLoading = friendsLoading && eventsLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <Stack.Screen options={{ title: "Social" }} />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ title: "Social" }} />

      <FlatList
        data={[]}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            {/* Friends Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Friends</Text>
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

            {/* Social Events Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          Alert.alert("Add Friend", "Friend creation form coming soon.")
        }
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add friend"
      >
        <Feather name="user-plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
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
    color: "#111827",
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  friendRelation: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
    textTransform: "capitalize",
  },
  friendEmail: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  eventHeader: {
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
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
    color: "#6B7280",
  },
  eventDescription: {
    fontSize: 13,
    color: "#6B7280",
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
    color: "#6B7280",
    marginTop: 10,
  },
  emptySectionSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
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

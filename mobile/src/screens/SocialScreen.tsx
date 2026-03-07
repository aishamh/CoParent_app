import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import {
  useFriends,
  useSocialEvents,
  useCreateSocialEvent,
  useUpdateSocialEvent,
} from "../hooks/useSocial";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatShortDate } from "../utils/formatDate";
import FriendForm from "../components/forms/FriendForm";
import Card from "../components/ui/Card";
import type { Friend, SocialEvent } from "../types/schema";

interface SuggestActivityForm {
  title: string;
  description: string;
  location: string;
  date: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function SuggestActivityModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [form, setForm] = useState<SuggestActivityForm>({
    title: "",
    description: "",
    location: "",
    date: "",
  });
  const createEvent = useCreateSocialEvent();

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert("Required", "Please enter an activity title.");
      return;
    }
    ReactNativeHapticFeedback.trigger("impactLight");
    createEvent.mutate(
      {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        date: form.date.trim() || new Date().toISOString().split("T")[0],
      } as any,
      {
        onSuccess: () => {
          setForm({ title: "", description: "", location: "", date: "" });
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={suggestStyles.overlay}>
        <View style={[suggestStyles.sheet, { backgroundColor: colors.card }]}>
          <View style={suggestStyles.header}>
            <Text style={[suggestStyles.headerTitle, { color: colors.foreground }]}>
              Suggest Activity
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Icon name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[suggestStyles.label, { color: colors.foreground }]}>Activity Name *</Text>
          <TextInput
            style={[suggestStyles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
            placeholder="e.g. Zoo Trip, Movie Night"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[suggestStyles.label, { color: colors.foreground }]}>Location</Text>
          <TextInput
            style={[suggestStyles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={form.location}
            onChangeText={(t) => setForm((p) => ({ ...p, location: t }))}
            placeholder="e.g. Central Park"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[suggestStyles.label, { color: colors.foreground }]}>Date</Text>
          <TextInput
            style={[suggestStyles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={form.date}
            onChangeText={(t) => setForm((p) => ({ ...p, date: t }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[suggestStyles.label, { color: colors.foreground }]}>Description</Text>
          <TextInput
            style={[suggestStyles.input, suggestStyles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={form.description}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            placeholder="What should we do?"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={[suggestStyles.submitButton, { backgroundColor: colors.primary }]}
            disabled={createEvent.isPending}
            accessibilityRole="button"
          >
            {createEvent.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[suggestStyles.submitText, { color: colors.primaryForeground }]}>
                Create Activity
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const suggestStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function SocialScreen() {
  const [showFriendForm, setShowFriendForm] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const { colors } = useTheme();

  const {
    data: friends = [],
    isLoading: friendsLoading,
    isRefetching: friendsRefetching,
    refetch: refetchFriends,
  } = useFriends();
  const {
    data: socialEvents = [],
    isLoading: eventsLoading,
    isRefetching: eventsRefetching,
    refetch: refetchEvents,
  } = useSocialEvents();

  useRefreshOnFocus(["friends"]);
  useRefreshOnFocus(["socialEvents"]);

  const isLoading = friendsLoading && eventsLoading;
  const isRefetching = friendsRefetching || eventsRefetching;

  const handleRefresh = () => {
    refetchFriends();
    refetchEvents();
  };

  function AvatarCircle({ name, size = 44 }: { name: string; size?: number }) {
    return (
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: colors.primary,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color: colors.primaryForeground, fontSize: size * 0.36 },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  }

  function YourCircleHeader() {
    return (
      <View style={styles.sectionHeaderRow}>
        <Icon name="users" size={20} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your Circle
        </Text>
      </View>
    );
  }

  function UpcomingEventsSection() {
    const upcomingEvents = socialEvents.filter(
      (e) => new Date(e.date) >= new Date(),
    );

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Upcoming Social Events
        </Text>
        {upcomingEvents.length === 0 ? (
          <EmptySection
            icon="calendar"
            title="No upcoming events"
            subtitle="Suggest an activity to plan something together."
          />
        ) : (
          upcomingEvents.slice(0, 5).map((event) => (
            <UpcomingEventCard key={event.id} event={event} />
          ))
        )}
      </View>
    );
  }

  function UpcomingEventCard({ event }: { event: SocialEvent }) {
    const eventDate = new Date(event.date);
    const month = eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = String(eventDate.getDate());
    const updateEvent = useUpdateSocialEvent();

    return (
      <Card style={[styles.upcomingEventCard, { backgroundColor: colors.card }]}>
        <View style={styles.upcomingEventRow}>
          <View style={[styles.dateBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.dateBadgeMonth, { color: colors.primaryForeground }]}>
              {month}
            </Text>
            <Text style={[styles.dateBadgeDay, { color: colors.primaryForeground }]}>
              {day}
            </Text>
          </View>
          <View style={styles.upcomingEventInfo}>
            <Text style={[styles.upcomingEventTitle, { color: colors.foreground }]}>
              {event.title}
            </Text>
            {event.location && (
              <View style={styles.upcomingEventDetailRow}>
                <Icon name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.upcomingEventDetail, { color: colors.mutedForeground }]}>
                  {event.location}
                </Text>
              </View>
            )}
          </View>
          {event.rsvp_status !== "accepted" && (
            <TouchableOpacity
              style={[styles.rsvpChip, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
              onPress={() =>
                updateEvent.mutate({ id: event.id, updates: { rsvp_status: "accepted" } })
              }
              accessibilityRole="button"
              accessibilityLabel={`RSVP to ${event.title}`}
            >
              <Text style={[styles.rsvpChipText, { color: colors.primaryForeground }]}>
                RSVP
              </Text>
            </TouchableOpacity>
          )}
          {event.rsvp_status === "accepted" && (
            <View style={[styles.rsvpChip, { backgroundColor: "#D1FAE5" }]}>
              <Text style={[styles.rsvpChipText, { color: "#065F46" }]}>Going</Text>
            </View>
          )}
        </View>
      </Card>
    );
  }

  function PlaydateCard() {
    return (
      <Card style={[styles.featureCard, { backgroundColor: colors.card }]}>
        <View style={styles.featureCardHeader}>
          <Icon name="sun" size={20} color="#F59E0B" />
          <Text style={[styles.featureCardTitle, { color: colors.foreground }]}>
            Plan a Playdate
          </Text>
        </View>
        <Text style={[styles.featureCardBody, { color: colors.mutedForeground }]}>
          The weekend of March 22nd is open for both you and The Johnsons.
        </Text>
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
          onPress={() => setShowSuggestModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Suggest activity"
        >
          <Icon name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.featureButtonText, { color: colors.primaryForeground }]}>
            Suggest Activity
          </Text>
        </TouchableOpacity>
      </Card>
    );
  }

  function PendingInvitesCard() {
    const pendingEvents = socialEvents.filter(
      (e) => !e.rsvp_status || e.rsvp_status === "pending",
    );
    const updateEvent = useUpdateSocialEvent();

    if (pendingEvents.length === 0) return null;

    return (
      <Card style={[styles.featureCard, { backgroundColor: colors.card }]}>
        <View style={styles.featureCardHeader}>
          <Icon name="inbox" size={20} color={colors.primary} />
          <Text style={[styles.featureCardTitle, { color: colors.foreground }]}>
            Pending Invites ({pendingEvents.length})
          </Text>
        </View>

        {pendingEvents.slice(0, 3).map((event) => (
          <View key={event.id}>
            <View style={styles.inviteRow}>
              <AvatarCircle name={event.title} size={40} />
              <View style={styles.inviteInfo}>
                <Text style={[styles.inviteName, { color: colors.foreground }]}>
                  {event.title}
                </Text>
                <Text style={[styles.inviteDate, { color: colors.mutedForeground }]}>
                  {formatShortDate(event.date)}
                  {event.location ? ` · ${event.location}` : ""}
                </Text>
              </View>
            </View>

            <View style={styles.inviteActions}>
              <TouchableOpacity
                style={[styles.inviteAcceptButton, { backgroundColor: "#22C55E" }]}
                activeOpacity={0.7}
                onPress={() =>
                  updateEvent.mutate({ id: event.id, updates: { rsvp_status: "accepted" } })
                }
                accessibilityRole="button"
                accessibilityLabel={`Accept ${event.title}`}
              >
                <Text style={styles.inviteActionText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inviteDeclineButton, { borderColor: "#EF4444" }]}
                activeOpacity={0.7}
                onPress={() =>
                  updateEvent.mutate({ id: event.id, updates: { rsvp_status: "declined" } })
                }
                accessibilityRole="button"
                accessibilityLabel={`Decline ${event.title}`}
              >
                <Text style={[styles.inviteDeclineText, { color: "#EF4444" }]}>
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </Card>
    );
  }

  function InviteCoParentCard() {
    return (
      <Card style={[styles.featureCard, { backgroundColor: colors.card }]}>
        <View style={styles.featureCardHeader}>
          <Icon name="send" size={20} color={colors.primary} />
          <Text style={[styles.featureCardTitle, { color: colors.foreground }]}>
            Invite Co-Parent
          </Text>
        </View>
        <Text style={[styles.featureCardBody, { color: colors.mutedForeground }]}>
          Send an invitation to the other parent to join Co-Parent and coordinate together.
        </Text>
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Send invite"
        >
          <Icon name="mail" size={16} color={colors.primaryForeground} />
          <Text style={[styles.featureButtonText, { color: colors.primaryForeground }]}>
            Send Invite
          </Text>
        </TouchableOpacity>
      </Card>
    );
  }

  function FriendCard({ friend }: { friend: Friend }) {
    return (
      <View style={[styles.friendCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AvatarCircle name={friend.name} />
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.foreground }]}>
            {friend.name}
          </Text>
          <Text style={[styles.friendRelation, { color: colors.mutedForeground }]}>
            {friend.relation}
          </Text>
          {friend.email && (
            <Text style={[styles.friendEmail, { color: colors.mutedForeground }]}>
              {friend.email}
            </Text>
          )}
        </View>
        <Icon name="chevron-right" size={18} color={colors.border} />
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
            <Icon name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
              {formatShortDate(event.date)}
            </Text>
          </View>
          {event.location && (
            <View style={styles.eventDetailRow}>
              <Icon name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.eventDetailText, { color: colors.mutedForeground }]}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
        {event.description && (
          <Text
            style={[styles.eventDescription, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
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
    icon: string;
    title: string;
    subtitle: string;
  }) {
    return (
      <View style={styles.emptySection}>
        <Icon name={icon} size={36} color={colors.border} />
        <Text style={[styles.emptySectionTitle, { color: colors.mutedForeground }]}>
          {title}
        </Text>
        <Text style={[styles.emptySectionSubtext, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      </View>
    );
  }

  const handleFabPress = () => {
    ReactNativeHapticFeedback.trigger("impactLight");
    setShowFriendForm(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
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
            <YourCircleHeader />

            <UpcomingEventsSection />

            <PlaydateCard />

            <PendingInvitesCard />

            <InviteCoParentCard />

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Friends
              </Text>
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
        <Icon name="user-plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <FriendForm
        visible={showFriendForm}
        onClose={() => setShowFriendForm(false)}
      />

      <SuggestActivityModal
        visible={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        colors={colors}
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 14,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  upcomingEventCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  upcomingEventRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateBadge: {
    width: 52,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  dateBadgeMonth: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateBadgeDay: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: -2,
  },
  upcomingEventInfo: {
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  upcomingEventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  upcomingEventDetail: {
    fontSize: 12,
  },
  rsvpChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  rsvpChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  featureCard: {
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  featureCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  featureCardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  featureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  featureButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteName: {
    fontSize: 14,
    fontWeight: "600",
  },
  inviteDate: {
    fontSize: 12,
    marginTop: 2,
  },
  inviteActions: {
    flexDirection: "row",
    gap: 10,
  },
  inviteAcceptButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  inviteDeclineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  inviteActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inviteDeclineText: {
    fontSize: 14,
    fontWeight: "600",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
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

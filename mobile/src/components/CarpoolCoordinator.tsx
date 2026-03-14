import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useTheme } from "../theme/useTheme";
import { useCarpoolArrangements, useCreateCarpoolArrangement, useMatchCarpoolArrangement } from "../hooks/useCarpool";
import type { CarpoolArrangement } from "../types/schema";

// ============================================================
// Types
// ============================================================

interface CarpoolArrangementWithUser extends CarpoolArrangement {
  username: string | null;
  display_name: string | null;
}

interface CarpoolCoordinatorProps {
  visible: boolean;
  eventId: string | undefined;
  colors: any;
  onClose: () => void;
}

// ============================================================
// Components
// ============================================================

function CarpoolRequestCard({
  arrangement,
  colors,
  onMatch,
}: {
  arrangement: CarpoolArrangementWithUser;
  colors: any;
  onMatch: (id: string) => void;
}) {
  const isOffering = arrangement.type === "offering_ride";

  return (
    <View style={[styles.arrangementCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.arrangementHeader}>
        <View style={[styles.arrangementTypeBadge, { backgroundColor: isOffering ? "#D1FAE5" : "#DBEAFE" }]}>
          <Icon name={isOffering ? "car" : "navigation"} size={16} color={isOffering ? "#065F46" : "#1E40AF"} />
          <Text style={[styles.arrangementTypeText, { color: isOffering ? "#065F46" : "#1E40AF" }]}>
            {isOffering ? "Offering" : "Needs"} a Ride
          </Text>
        </View>
        <Text style={[styles.arrangementCapacity, { color: colors.mutedForeground }]}>
          {isOffering && arrangement.capacity ? `${arrangement.capacity} seats` : ""}
        </Text>
      </View>

      <View style={styles.arrangementUserInfo}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {(arrangement.display_name || arrangement.username || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.arrangementDetails}>
          <Text style={[styles.arrangementUserName, { color: colors.foreground }]}>
            {arrangement.display_name || arrangement.username || "Anonymous"}
          </Text>
          {arrangement.pickup_location && (
            <View style={styles.pickupInfo}>
              <Icon name="map-pin" size={14} color={colors.mutedForeground} />
              <Text style={[styles.pickupText, { color: colors.mutedForeground }]}>
                {arrangement.pickup_location}
              </Text>
            </View>
          )}
          {arrangement.pickup_time && (
            <View style={styles.pickupInfo}>
              <Icon name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.pickupText, { color: colors.mutedForeground }]}>
                {arrangement.pickup_time}
              </Text>
            </View>
          )}
        </View>
      </View>

      {arrangement.notes && (
        <Text style={[styles.arrangementNotes, { color: colors.mutedForeground }]}>
          "{arrangement.notes}"
        </Text>
      )}

      <TouchableOpacity
        style={[styles.matchButton, { backgroundColor: colors.primary }]}
        onPress={() => onMatch(arrangement.id)}
        activeOpacity={0.7}
      >
        <Text style={[styles.matchButtonText, { color: colors.primaryForeground }]}>
          {isOffering ? "Request Ride" : "Offer Ride"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CarpoolCoordinator({ visible, eventId, colors, onClose }: CarpoolCoordinatorProps) {
  const [activeTab, setActiveTab] = useState<"browse" | "create">("browse");
  const [formData, setFormData] = useState({
    type: "need_ride" as "need_ride" | "offering_ride",
    capacity: 3,
    pickup_location: "",
    pickup_time: "",
    notes: "",
    children_transporting: [] as number[],
  });

  const { data: arrangements = [] } = useCarpoolArrangements(eventId);
  const createMutation = useCreateCarpoolArrangement();
  const matchMutation = useMatchCarpoolArrangement();

  const needRide = arrangements.filter((a) => a.type === "need_ride");
  const offeringRide = arrangements.filter((a) => a.type === "offering_ride");
  const canShow = activeTab === "browse" ? (formData.type === "need_ride" ? offeringRide : needRide) : [];

  const handleSubmit = () => {
    if (!eventId) return;

    if (formData.type === "offering_ride" && formData.capacity < 1) {
      Alert.alert("Error", "Please specify at least 1 seat capacity");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");

    createMutation.mutate(
      { eventId, data: formData },
      {
        onSuccess: () => {
          Alert.alert("Success", formData.type === "need_ride"
            ? "Your ride request has been posted!"
            : "Your ride offer has been posted!");
          setFormData({
            type: "need_ride",
            capacity: 3,
            pickup_location: "",
            pickup_time: "",
            notes: "",
            children_transporting: [],
          });
          onClose();
        },
        onError: (error) => {
          Alert.alert("Error", "Failed to create carpool arrangement");
        },
      },
    );
  };

  const handleMatch = (otherId: string) => {
    if (!arrangements.find((a) => a.user_id === (global as any).userId)) {
      Alert.alert("Create Arrangement First", "Please create your own arrangement before matching.");
      return;
    }

    const myArrangement = arrangements.find((a) =>
      a.user_id === (global as any).userId &&
      a.status === "open"
    );

    if (!myArrangement) {
      Alert.alert("Error", "No active arrangement found");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");

    Alert.alert(
      "Confirm Match",
      "Connect with this person to arrange carpool details?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          style: "default",
          onPress: () => {
            matchMutation.mutate(
              { id: myArrangement.id, withId: otherId },
              {
                onSuccess: () => {
                  Alert.alert("Connected!", "Contact info shared. Reach out to arrange details.");
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Carpool Coordination
            </Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Icon name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "browse" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("impactLight");
                setActiveTab("browse");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "browse" && { color: colors.primary },
                  activeTab !== "browse" && { color: colors.mutedForeground },
                ]}
              >
                Browse ({arrangements.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "create" && { borderBottomColor: colors.primary },
              ]}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("impactLight");
                setActiveTab("create");
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "create" && { color: colors.primary },
                  activeTab !== "create" && { color: colors.mutedForeground },
                ]}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {activeTab === "browse" && (
              <>
                {/* Type Filter */}
                <View style={styles.typeFilter}>
                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      formData.type === "need_ride" && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      formData.type !== "need_ride" && {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger("impactLight");
                      setFormData((p) => ({ ...p, type: "need_ride" }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        formData.type === "need_ride" && { color: colors.primaryForeground },
                        formData.type !== "need_ride" && { color: colors.foreground },
                      ]}
                    >
                      Need a Ride
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeChip,
                      formData.type === "offering_ride" && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                      formData.type !== "offering_ride" && {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger("impactLight");
                      setFormData((p) => ({ ...p, type: "offering_ride" }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        formData.type === "offering_ride" && { color: colors.primaryForeground },
                        formData.type !== "offering_ride" && { color: colors.foreground },
                      ]}
                    >
                      Offering a Ride
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Arrangements List */}
                {arrangements.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="users" size={48} color={colors.border} />
                    <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
                      No carpool arrangements yet
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                      Be the first to create one!
                    </Text>
                  </View>
                ) : (
                  (formData.type === "need_ride" ? offeringRide : needRide).map((arrangement) => (
                    <CarpoolRequestCard
                      key={arrangement.id}
                      arrangement={arrangement}
                      colors={colors}
                      onMatch={handleMatch}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === "create" && (
              <View style={styles.formContainer}>
                <Text style={[styles.formTitle, { color: colors.foreground }]}>
                  I want to...
                </Text>

                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeSelectorOption,
                      formData.type === "need_ride" && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                      formData.type !== "need_ride" && { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger("impactLight");
                      setFormData((p) => ({ ...p, type: "need_ride" }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="navigation"
                      size={24}
                      color={formData.type === "need_ride" ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.typeSelectorText,
                        formData.type === "need_ride" && { color: colors.foreground },
                        formData.type !== "need_ride" && { color: colors.mutedForeground },
                      ]}
                    >
                      Need a Ride
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeSelectorOption,
                      formData.type === "offering_ride" && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                      formData.type !== "offering_ride" && { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => {
                      ReactNativeHapticFeedback.trigger("impactLight");
                      setFormData((p) => ({ ...p, type: "offering_ride" }));
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name="car"
                      size={24}
                      color={formData.type === "offering_ride" ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.typeSelectorText,
                        formData.type === "offering_ride" && { color: colors.foreground },
                        formData.type !== "offering_ride" && { color: colors.mutedForeground },
                      ]}
                    >
                      Offer a Ride
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.type === "offering_ride" && (
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: colors.foreground }]}>
                      Available Seats
                    </Text>
                    <View style={styles.capacitySelector}>
                      {[1, 2, 3, 4, 5, 6].map((seats) => (
                        <TouchableOpacity
                          key={seats}
                          style={[
                            styles.capacityChip,
                            formData.capacity === seats && { backgroundColor: colors.primary },
                            formData.capacity !== seats && { backgroundColor: colors.card, borderColor: colors.border },
                          ]}
                          onPress={() => {
                            ReactNativeHapticFeedback.trigger("impactLight");
                            setFormData((p) => ({ ...p, capacity: seats }));
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.capacityChipText,
                              formData.capacity === seats && { color: colors.primaryForeground },
                              formData.capacity !== seats && { color: colors.foreground },
                            ]}
                          >
                            {seats}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>
                    Pickup Location
                  </Text>
                  <View style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Icon name="map-pin" size={18} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.formTextInput, { color: colors.foreground }]}
                      placeholder="e.g., Downtown Library"
                      placeholderTextColor={colors.mutedForeground}
                      value={formData.pickup_location}
                      onChangeText={(text) => setFormData((p) => ({ ...p, pickup_location: text }))}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>
                    Pickup Time
                  </Text>
                  <View style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Icon name="clock" size={18} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.formTextInput, { color: colors.foreground }]}
                      placeholder="e.g., 09:00"
                      placeholderTextColor={colors.mutedForeground}
                      value={formData.pickup_time}
                      onChangeText={(text) => setFormData((p) => ({ ...p, pickup_time: text }))}
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.foreground }]}>
                    Notes (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.formTextArea,
                      { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
                    ]}
                    placeholder="Any special requirements or preferences..."
                    placeholderTextColor={colors.mutedForeground}
                    value={formData.notes}
                    onChangeText={(text) => setFormData((p) => ({ ...p, notes: text }))}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleSubmit}
                  disabled={createMutation.isPending}
                  activeOpacity={0.7}
                >
                  {createMutation.isPending ? (
                    <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                      Creating...
                    </Text>
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>
                      {formData.type === "need_ride" ? "Request Ride" : "Offer Ride"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    padding: 24,
  },
  typeFilter: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  arrangementCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 0.5,
  },
  arrangementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  arrangementTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arrangementTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  arrangementCapacity: {
    fontSize: 12,
  },
  arrangementUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  arrangementDetails: {
    flex: 1,
  },
  arrangementUserName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  pickupInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  pickupText: {
    fontSize: 13,
  },
  arrangementNotes: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 12,
  },
  matchButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  matchButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  formContainer: {
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  typeSelectorOption: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  typeSelectorText: {
    fontSize: 15,
    fontWeight: "600",
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
    height: 50,
    borderWidth: 0.5,
    gap: 10,
  },
  formTextInput: {
    flex: 1,
    fontSize: 15,
  },
  formTextArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 100,
    borderWidth: 0.5,
    textAlignVertical: "top",
    fontSize: 15,
  },
  capacitySelector: {
    flexDirection: "row",
    gap: 8,
  },
  capacityChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
  },
  capacityChipText: {
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

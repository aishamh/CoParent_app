import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import TextInput from "../ui/TextInput";
import Button from "../ui/Button";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "../../hooks/useEvents";
import { useTheme } from "../../theme/useTheme";
import type { Event } from "../../types/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  "custody",
  "holiday",
  "activity",
  "travel",
  "medical",
  "school",
  "other",
] as const;

const RECURRENCE_OPTIONS = [
  { label: "None", value: "" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventFormProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: string;
  /** Pass an existing event to enable edit mode. */
  event?: Event | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventForm({
  visible,
  onClose,
  initialDate,
  event,
}: EventFormProps) {
  const isEditing = Boolean(event);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("other");
  const [startDate, setStartDate] = useState(initialDate ?? todayString());
  const [endDate, setEndDate] = useState(initialDate ?? todayString());
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [parent, setParent] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");

  const { colors } = useTheme();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  // Pre-fill fields when editing an existing event
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type);
      setStartDate(event.start_date);
      setEndDate(event.end_date);
      setStartTime(event.start_time);
      setEndTime(event.end_time);
      setParent(event.parent);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setAddress(event.address ?? "");
      setRecurrence(event.recurrence ?? "");
      setRecurrenceEnd(event.recurrence_end ?? "");
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle("");
    setType("other");
    setStartDate(initialDate ?? todayString());
    setEndDate(initialDate ?? todayString());
    setStartTime("00:00");
    setEndTime("23:59");
    setParent("");
    setDescription("");
    setLocation("");
    setAddress("");
    setRecurrence("");
    setRecurrenceEnd("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter an event title.");
      return;
    }
    if (!parent.trim()) {
      Alert.alert("Required", "Please enter who is responsible.");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");

    const payload: Omit<Event, "id"> = {
      title: title.trim(),
      type,
      start_date: startDate,
      end_date: endDate || startDate,
      start_time: startTime || "00:00",
      end_time: endTime || "23:59",
      time_zone: "Europe/Oslo",
      parent: parent.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      address: address.trim() || null,
      city: null,
      postal_code: null,
      recurrence: recurrence || null,
      recurrence_interval: 1,
      recurrence_end: recurrenceEnd || null,
      recurrence_days: null,
      child_id: event?.child_id ?? null,
      family_id: event?.family_id ?? "",
      created_at: event?.created_at ?? "",
    };

    if (isEditing && event) {
      updateEvent.mutate(
        { id: event.id, updates: payload },
        {
          onSuccess: () => {
            resetForm();
            onClose();
          },
          onError: () => {
            Alert.alert("Error", "Failed to update event. Please try again.");
          },
        },
      );
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => {
          resetForm();
          onClose();
        },
        onError: () => {
          Alert.alert("Error", "Failed to create event. Please try again.");
        },
      });
    }
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("notificationWarning");
            deleteEvent.mutate(event.id, {
              onSuccess: () => {
                resetForm();
                onClose();
              },
              onError: () => {
                Alert.alert("Error", "Failed to delete event.");
              },
            });
          },
        },
      ],
    );
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isMutating =
    createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} accessibilityRole="button">
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? "Edit Event" : "New Event"}
          </Text>
          {isEditing ? (
            <TouchableOpacity
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete event"
            >
              <Icon name="trash-2" size={20} color={colors.destructive} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {/* Form body */}
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            label="Title *"
            placeholder="Event title"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          {/* Event type pills */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Type
          </Text>
          <View style={styles.pillRow}>
            {EVENT_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.pill,
                  { backgroundColor: colors.muted },
                  type === t && { backgroundColor: colors.primary },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: type === t }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: colors.mutedForeground },
                    type === t && { color: colors.primaryForeground },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dates */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                label="Start Date *"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>
            <View style={styles.halfField}>
              <TextInput
                label="End Date"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>
          </View>

          {/* Times */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                label="Start Time"
                placeholder="HH:MM"
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
            <View style={styles.halfField}>
              <TextInput
                label="End Time"
                placeholder="HH:MM"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          <TextInput
            label="Responsible Parent *"
            placeholder="Who is responsible?"
            value={parent}
            onChangeText={setParent}
          />

          <TextInput
            label="Location"
            placeholder="Where is it?"
            value={location}
            onChangeText={setLocation}
          />

          <TextInput
            label="Address"
            placeholder="Street address"
            value={address}
            onChangeText={setAddress}
          />

          {/* Recurrence */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Recurrence
          </Text>
          <View style={styles.pillRow}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setRecurrence(opt.value)}
                style={[
                  styles.pill,
                  { backgroundColor: colors.muted },
                  recurrence === opt.value && {
                    backgroundColor: colors.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: recurrence === opt.value }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: colors.mutedForeground },
                    recurrence === opt.value && {
                      color: colors.primaryForeground,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {recurrence !== "" && (
            <TextInput
              label="Recurrence End Date"
              placeholder="YYYY-MM-DD"
              value={recurrenceEnd}
              onChangeText={setRecurrenceEnd}
            />
          )}

          <TextInput
            label="Description"
            placeholder="Additional details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />

          <Button
            title={isEditing ? "Save Changes" : "Create Event"}
            onPress={handleSubmit}
            loading={isMutating}
            disabled={isMutating}
            style={styles.submitButton}
          />

          {isEditing && (
            <Button
              title="Delete Event"
              onPress={handleDelete}
              variant="destructive"
              loading={deleteEvent.isPending}
              disabled={isMutating}
              style={styles.deleteButton}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 60,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    paddingBottom: 48,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  deleteButton: {
    marginTop: 12,
  },
});

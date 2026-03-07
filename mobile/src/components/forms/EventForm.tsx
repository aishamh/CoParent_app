import React, { useState } from "react";
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
import * as Haptics from "expo-haptics";

import TextInput from "../ui/TextInput";
import Button from "../ui/Button";
import { useCreateEvent } from "../../hooks/useEvents";
import { useTheme } from "../../theme/useTheme";
import type { Event } from "../../types/schema";

const EVENT_TYPES = [
  "custody",
  "holiday",
  "activity",
  "travel",
  "medical",
  "school",
  "other",
] as const;

interface EventFormProps {
  visible: boolean;
  onClose: () => void;
  initialDate?: string;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function EventForm({
  visible,
  onClose,
  initialDate,
}: EventFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("other");
  const [startDate, setStartDate] = useState(initialDate ?? todayString());
  const [endDate, setEndDate] = useState(initialDate ?? todayString());
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [parent, setParent] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const { colors } = useTheme();

  const createEvent = useCreateEvent();

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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const eventData: Omit<Event, "id"> = {
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
      address: null,
      city: null,
      postal_code: null,
      recurrence: null,
      recurrence_interval: 1,
      recurrence_end: null,
      recurrence_days: null,
      child_id: null,
      family_id: "",
      created_at: "",
    };

    createEvent.mutate(eventData, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
      onError: () => {
        Alert.alert("Error", "Failed to create event. Please try again.");
      },
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} accessibilityRole="button">
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Event</Text>
          <View style={styles.headerSpacer} />
        </View>

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

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Type</Text>
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
            label="Description"
            placeholder="Additional details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />

          <Button
            title="Create Event"
            onPress={handleSubmit}
            loading={createEvent.isPending}
            disabled={createEvent.isPending}
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
});

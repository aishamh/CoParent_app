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
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import TextInput from "../ui/TextInput";
import Button from "../ui/Button";
import { useCreateFriend } from "../../hooks/useSocial";
import { useTheme } from "../../theme/useTheme";
import type { Friend } from "../../types/schema";

interface FriendFormProps {
  visible: boolean;
  onClose: () => void;
}

export default function FriendForm({ visible, onClose }: FriendFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("");
  const { colors } = useTheme();

  const createFriend = useCreateFriend();

  const resetForm = () => {
    setName("");
    setEmail("");
    setRelation("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter the friend's name.");
      return;
    }
    if (!relation.trim()) {
      Alert.alert("Required", "Please enter the relationship.");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactLight");

    const friendData: Omit<Friend, "id"> = {
      name: name.trim(),
      email: email.trim() || null,
      avatar: null,
      relation: relation.trim(),
      kids: "[]",
      family_id: "",
      created_at: "",
    };

    createFriend.mutate(friendData, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
      onError: () => {
        Alert.alert("Error", "Failed to add friend. Please try again.");
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Friend</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            label="Name *"
            placeholder="Friend's name"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
            autoCapitalize="words"
          />

          <TextInput
            label="Email"
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            label="Relationship *"
            placeholder='e.g. "school friend", "neighbor"'
            value={relation}
            onChangeText={setRelation}
            returnKeyType="done"
          />

          <Button
            title="Add Friend"
            onPress={handleSubmit}
            loading={createFriend.isPending}
            disabled={createFriend.isPending}
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
  submitButton: {
    marginTop: 8,
  },
});

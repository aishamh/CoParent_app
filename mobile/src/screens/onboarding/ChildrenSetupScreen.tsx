import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import Icon from "react-native-vector-icons/Feather";

import { createChild } from "../../api/children";
import { useTheme } from "../../theme/useTheme";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import ProgressDots from "../../components/ui/ProgressDots";

interface LocalChild {
  name: string;
  age: number;
}

export default function ChildrenSetupScreen() {
  const navigation = useNavigation();
  const [children, setChildren] = useState<LocalChild[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const { colors } = useTheme();

  const mutation = useMutation({
    mutationFn: (child: Parameters<typeof createChild>[0]) =>
      createChild(child),
  });

  const resetForm = () => {
    setChildName("");
    setChildAge("");
    setShowForm(false);
  };

  const handleAddChild = () => {
    const trimmedName = childName.trim();
    const parsedAge = parseInt(childAge, 10);

    if (!trimmedName) {
      Alert.alert("Name required", "Please enter your child's name.");
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 18) {
      Alert.alert("Invalid age", "Please enter an age between 0 and 18.");
      return;
    }

    setChildren((prev) => [...prev, { name: trimmedName, age: parsedAge }]);
    resetForm();
  };

  const handleRemoveChild = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const navigateToInvite = async () => {
    for (const child of children) {
      mutation.mutate({
        family_id: "",
        name: child.name,
        age: child.age,
        gender: null,
        interests: "[]",
        created_at: new Date().toISOString(),
      });
    }
    navigation.navigate("Invite" as never);
  };

  const skipToInvite = () => {
    navigation.navigate("Invite" as never);
  };

  const renderChildRow = ({
    item,
    index,
  }: {
    item: LocalChild;
    index: number;
  }) => (
    <View
      style={[
        styles.childRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.childInfo}>
        <Text style={[styles.childName, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text style={[styles.childAge, { color: colors.mutedForeground }]}>
          Age {item.age}
        </Text>
      </View>

      <Pressable
        onPress={() => handleRemoveChild(index)}
        style={styles.removeButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
      >
        <Icon name="x-circle" size={22} color={colors.destructive} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <ProgressDots total={4} current={2} />

          <Text style={[styles.title, { color: colors.foreground }]}>
            Add Your Children
          </Text>

          <FlatList
            data={children}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderChildRow}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.mutedForeground },
                ]}
              >
                No children added yet. Tap the button below to get started.
              </Text>
            }
          />

          {showForm ? (
            <View
              style={[
                styles.inlineForm,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                label="Child's Name"
                placeholder="Enter name"
                value={childName}
                onChangeText={setChildName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <TextInput
                label="Age"
                placeholder="Enter age"
                value={childAge}
                onChangeText={setChildAge}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleAddChild}
              />

              <View style={styles.formActions}>
                <Button
                  title="Add"
                  onPress={handleAddChild}
                  style={styles.addConfirmButton}
                />
                <Pressable
                  onPress={resetForm}
                  style={styles.cancelWrapper}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding child"
                >
                  <Text
                    style={[
                      styles.cancelText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Button
              title="Add Child"
              onPress={() => setShowForm(true)}
              variant="outline"
              style={styles.addChildButton}
            />
          )}

          <View style={styles.footer}>
            <Button title="Continue" onPress={navigateToInvite} />

            <Pressable
              onPress={skipToInvite}
              style={styles.skipWrapper}
              accessibilityRole="link"
              accessibilityLabel="Skip adding children"
            >
              <Text
                style={[styles.skipText, { color: colors.mutedForeground }]}
              >
                Skip
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },
  list: {
    flexGrow: 0,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    lineHeight: 20,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: "600",
  },
  childAge: {
    fontSize: 14,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineForm: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addConfirmButton: {
    flex: 1,
  },
  cancelWrapper: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addChildButton: {
    marginBottom: 16,
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 16,
  },
  skipWrapper: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

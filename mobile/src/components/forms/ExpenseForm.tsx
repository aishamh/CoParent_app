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
import { useCreateExpense } from "../../hooks/useExpenses";
import { useChildren } from "../../hooks/useChildren";
import { useTheme } from "../../theme/useTheme";
import type { Expense } from "../../types/schema";

const EXPENSE_CATEGORIES = [
  "medical",
  "education",
  "activities",
  "clothing",
  "food",
  "transport",
  "other",
] as const;

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ExpenseForm({ visible, onClose }: ExpenseFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [childId, setChildId] = useState<number | null>(null);
  const [paidBy, setPaidBy] = useState("");
  const [splitPercentage, setSplitPercentage] = useState("50");
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");
  const { colors } = useTheme();

  const createExpense = useCreateExpense();
  const { data: children = [] } = useChildren();

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("other");
    setChildId(null);
    setPaidBy("");
    setSplitPercentage("50");
    setDate(todayString());
    setNotes("");
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Required", "Please enter an expense title.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Required", "Please enter a valid amount.");
      return;
    }

    if (!paidBy.trim()) {
      Alert.alert("Required", "Please enter who paid.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const parsedSplit = parseInt(splitPercentage, 10);
    const safeSplit = isNaN(parsedSplit)
      ? 50
      : Math.min(100, Math.max(0, parsedSplit));

    const expenseData: Omit<Expense, "id"> = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      child_id: childId ?? (children.length > 0 ? children[0].id : 0),
      paid_by: paidBy.trim(),
      split_percentage: safeSplit,
      date,
      receipt: null,
      status: "pending",
      notes: notes.trim() || null,
      family_id: "",
      created_at: "",
    };

    createExpense.mutate(expenseData, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
      onError: () => {
        Alert.alert("Error", "Failed to create expense. Please try again.");
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Expense</Text>
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
            placeholder="What was this expense for?"
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <TextInput
            label="Amount *"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.pillRow}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.pill,
                  { backgroundColor: colors.muted },
                  category === cat && { backgroundColor: colors.primary },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: category === cat }}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: colors.mutedForeground },
                    category === cat && { color: colors.primaryForeground },
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {children.length > 0 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Child</Text>
              <View style={styles.pillRow}>
                {children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    onPress={() => setChildId(child.id)}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.muted },
                      childId === child.id && { backgroundColor: colors.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: childId === child.id }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.mutedForeground },
                        childId === child.id && { color: colors.primaryForeground },
                      ]}
                    >
                      {child.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TextInput
            label="Paid By *"
            placeholder="Who paid?"
            value={paidBy}
            onChangeText={setPaidBy}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <TextInput
                label="Split %"
                placeholder="50"
                value={splitPercentage}
                onChangeText={setSplitPercentage}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfField}>
              <TextInput
                label="Date *"
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>

          <TextInput
            label="Notes"
            placeholder="Additional details..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.multilineInput}
          />

          <Button
            title="Add Expense"
            onPress={handleSubmit}
            loading={createExpense.isPending}
            disabled={createExpense.isPending}
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

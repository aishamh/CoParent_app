import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useExpenses } from "../../src/hooks/useExpenses";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatCurrency } from "../../src/utils/formatCurrency";
import { formatShortDate } from "../../src/utils/formatDate";
import type { Expense } from "../../src/types/schema";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

type StatusFilter = "all" | "pending" | "approved" | "reimbursed";

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "approved", "reimbursed"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  approved: { bg: "#D1FAE5", text: "#065F46" },
  reimbursed: { bg: "#DBEAFE", text: "#1E40AF" },
};

const CATEGORY_COLORS: Record<string, string> = {
  medical: "#EF4444",
  education: "#A855F7",
  activities: "#22C55E",
  clothing: "#EC4899",
  food: "#F59E0B",
  transport: "#06B6D4",
  other: "#6B7280",
};

function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, isActive && styles.chipActive]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

function ExpenseCard({ expense }: { expense: Expense }) {
  const statusColor = STATUS_COLORS[expense.status] ?? STATUS_COLORS.pending;
  const categoryColor = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.other;
  const splitLabel =
    expense.split_percentage === 50
      ? "50/50 split"
      : `${expense.split_percentage}/${100 - expense.split_percentage} split`;

  return (
    <View style={styles.expenseCard} accessibilityRole="summary">
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.expenseAmount}>
          {formatCurrency(expense.amount)}
        </Text>
      </View>

      <View style={styles.expenseMeta}>
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18` }]}>
          <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
            {expense.category}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
            {expense.status}
          </Text>
        </View>
      </View>

      <View style={styles.expenseFooter}>
        <Text style={styles.expenseDetail}>Paid by {expense.paid_by}</Text>
        <Text style={styles.expenseDetail}>{splitLabel}</Text>
        <Text style={styles.expenseDetail}>
          {formatShortDate(expense.date)}
        </Text>
      </View>
    </View>
  );
}

function EmptyExpenses() {
  return (
    <View style={styles.emptyState}>
      <Feather name="dollar-sign" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No expenses</Text>
      <Text style={styles.emptySubtext}>
        Add an expense to start tracking shared costs.
      </Text>
    </View>
  );
}

export default function ExpensesScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;
  const { data: expenses = [], isLoading } = useExpenses(undefined, apiStatus);
  useRefreshOnFocus(["expenses"]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ title: "Expenses" }} />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            isActive={statusFilter === filter}
            onPress={() => setStatusFilter(filter)}
          />
        ))}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : expenses.length === 0 ? (
        <EmptyExpenses />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ExpenseCard expense={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          Alert.alert("Add Expense", "Expense creation form coming soon.")
        }
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  chipRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: TEAL,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  expenseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  expenseMeta: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  expenseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  expenseDetail: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
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

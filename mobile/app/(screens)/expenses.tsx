import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useExpenses } from "../../src/hooks/useExpenses";
import { useTheme } from "../../src/theme/useTheme";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatCurrency } from "../../src/utils/formatCurrency";
import { formatShortDate } from "../../src/utils/formatDate";
import ExpenseForm from "../../src/components/forms/ExpenseForm";
import type { Expense } from "../../src/types/schema";

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

export default function ExpensesScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const { colors } = useTheme();

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;
  const { data: expenses = [], isLoading, isRefetching, refetch } = useExpenses(undefined, apiStatus);
  useRefreshOnFocus(["expenses"]);

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
        style={[
          styles.chip,
          { backgroundColor: colors.muted },
          isActive && { backgroundColor: colors.primary },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Filter: ${label}`}
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.chipText,
            { color: colors.mutedForeground },
            isActive && { color: colors.primaryForeground },
          ]}
        >
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
      <View
        style={[styles.expenseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={styles.expenseHeader}>
          <Text style={[styles.expenseTitle, { color: colors.foreground }]} numberOfLines={1}>
            {expense.title}
          </Text>
          <Text style={[styles.expenseAmount, { color: colors.foreground }]}>
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
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>Paid by {expense.paid_by}</Text>
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>{splitLabel}</Text>
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>
            {formatShortDate(expense.date)}
          </Text>
        </View>
      </View>
    );
  }

  function EmptyExpenses() {
    return (
      <View style={styles.emptyState}>
        <Feather name="dollar-sign" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No expenses</Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Add an expense to start tracking shared costs.
        </Text>
      </View>
    );
  }

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExpenseForm(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <Stack.Screen options={{ title: "Expenses" }} />

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

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleFabPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Feather name="plus" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <ExpenseForm
        visible={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
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
    flex: 1,
    marginRight: 12,
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: "700",
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

import React, { useState, useMemo } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";

import { useExpenses, useUpdateExpense, useDeleteExpense } from "../hooks/useExpenses";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatCurrency } from "../utils/formatCurrency";
import { formatShortDate } from "../utils/formatDate";
import ExpenseForm from "../components/forms/ExpenseForm";
import Card from "../components/ui/Card";
import { ExpenseListSkeleton } from "../components/ui/SkeletonLayouts";
import type { Expense } from "../types/schema";

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

interface SummaryTotals {
  pendingTotal: number;
  pendingCount: number;
  approvedTotal: number;
  approvedCount: number;
  totalAmount: number;
  totalCount: number;
}

function calculateSummaryTotals(expenses: Expense[]): SummaryTotals {
  let pendingTotal = 0;
  let pendingCount = 0;
  let approvedTotal = 0;
  let approvedCount = 0;

  for (const expense of expenses) {
    if (expense.status === "pending") {
      pendingTotal += expense.amount;
      pendingCount += 1;
    } else if (expense.status === "approved") {
      approvedTotal += expense.amount;
      approvedCount += 1;
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    pendingTotal,
    pendingCount,
    approvedTotal,
    approvedCount,
    totalAmount,
    totalCount: expenses.length,
  };
}

export default function ExpensesScreen() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const { colors } = useTheme();

  const apiStatus = statusFilter === "all" ? undefined : statusFilter;
  const {
    data: expenses = [],
    isLoading,
    isRefetching,
    refetch,
  } = useExpenses(undefined, apiStatus);
  useRefreshOnFocus(["expenses"]);

  const { data: allExpenses = [] } = useExpenses();

  const summary = useMemo(
    () => calculateSummaryTotals(allExpenses),
    [allExpenses],
  );

  function SummaryStatCards() {
    return (
      <View style={styles.summaryRow}>
        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryAccent, { backgroundColor: "#F59E0B" }]} />
          <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
            {formatCurrency(summary.pendingTotal)}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#92400E" }]}>
            Pending Approval
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
            {summary.pendingCount} expense{summary.pendingCount !== 1 ? "s" : ""}
          </Text>
        </Card>

        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryAccent, { backgroundColor: "#22C55E" }]} />
          <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
            {formatCurrency(summary.approvedTotal)}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#065F46" }]}>
            Approved
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
            {summary.approvedCount} expense{summary.approvedCount !== 1 ? "s" : ""}
          </Text>
        </Card>

        <Card style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={[styles.summaryAccent, { backgroundColor: colors.primary }]} />
          <Text style={[styles.summaryAmount, { color: colors.foreground }]}>
            {formatCurrency(summary.totalAmount)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>
            Total Expenses
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
            {summary.totalCount} total
          </Text>
        </Card>
      </View>
    );
  }

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

  const updateExpense = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  function handleApprove(expense: Expense) {
    ReactNativeHapticFeedback.trigger("impactLight");
    updateExpense.mutate({ id: expense.id, updates: { status: "approved" } });
  }

  function handleReject(expense: Expense) {
    Alert.alert(
      "Reject Expense",
      `Are you sure you want to reject "${expense.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            updateExpense.mutate({ id: expense.id, updates: { status: "pending", notes: "Rejected — needs discussion" } });
          },
        },
      ],
    );
  }

  function handleDelete(expense: Expense) {
    Alert.alert(
      "Delete Expense",
      `Permanently delete "${expense.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("notificationWarning");
            deleteExpenseMutation.mutate(expense.id);
          },
        },
      ],
    );
  }

  function ExpenseCard({ expense }: { expense: Expense }) {
    const statusColor = STATUS_COLORS[expense.status] ?? STATUS_COLORS.pending;
    const categoryColor = CATEGORY_COLORS[expense.category] ?? CATEGORY_COLORS.other;
    const splitLabel =
      expense.split_percentage === 50
        ? "50/50 split"
        : `${expense.split_percentage}/${100 - expense.split_percentage} split`;
    const isPending = expense.status === "pending";

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
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>
            Paid by {expense.paid_by}
          </Text>
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>
            {splitLabel}
          </Text>
          <Text style={[styles.expenseDetail, { color: colors.mutedForeground }]}>
            {formatShortDate(expense.date)}
          </Text>
        </View>

        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          {isPending && (
            <>
              <TouchableOpacity
                onPress={() => handleApprove(expense)}
                style={[styles.actionButton, { backgroundColor: "#D1FAE5" }]}
                accessibilityRole="button"
                accessibilityLabel={`Approve ${expense.title}`}
              >
                <Icon name="check" size={16} color="#065F46" />
                <Text style={[styles.actionButtonText, { color: "#065F46" }]}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(expense)}
                style={[styles.actionButton, { backgroundColor: "#FEE2E2" }]}
                accessibilityRole="button"
                accessibilityLabel={`Reject ${expense.title}`}
              >
                <Icon name="x" size={16} color="#991B1B" />
                <Text style={[styles.actionButtonText, { color: "#991B1B" }]}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
          {expense.status === "approved" && (
            <TouchableOpacity
              onPress={() => {
                ActionSheetIOS.showActionSheetWithOptions(
                  {
                    options: ["Cancel", "Pay via Venmo", "Pay via PayPal", "Mark as Paid"],
                    cancelButtonIndex: 0,
                  },
                  (buttonIndex) => {
                    const owedAmount = (expense.amount * (100 - expense.split_percentage) / 100).toFixed(2);
                    if (buttonIndex === 1) {
                      Linking.openURL(`venmo://paycharge?txn=pay&amount=${owedAmount}&note=${encodeURIComponent(expense.title)}`);
                    } else if (buttonIndex === 2) {
                      Linking.openURL(`https://paypal.me/?amount=${owedAmount}&currency_code=USD`);
                    } else if (buttonIndex === 3) {
                      updateExpense.mutate({ id: expense.id, updates: { status: "reimbursed" } });
                    }
                  },
                );
              }}
              style={[styles.actionButton, { backgroundColor: "#DBEAFE" }]}
              accessibilityRole="button"
              accessibilityLabel={`Pay ${expense.title}`}
            >
              <Icon name="credit-card" size={16} color="#1E40AF" />
              <Text style={[styles.actionButtonText, { color: "#1E40AF" }]}>Pay</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDelete(expense)}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${expense.title}`}
          >
            <Icon name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function EmptyExpenses() {
    return (
      <View style={styles.emptyState}>
        <Icon name="dollar-sign" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
          No expenses
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Add an expense to start tracking shared costs.
        </Text>
      </View>
    );
  }

  const handleFabPress = () => {
    ReactNativeHapticFeedback.trigger("impactLight");
    setShowExpenseForm(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <SummaryStatCards />

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
        <ExpenseListSkeleton />
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
        <Icon name="plus" size={28} color={colors.primaryForeground} />
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
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  summaryAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  summaryAmount: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  summarySubtitle: {
    fontSize: 10,
    marginTop: 2,
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
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
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

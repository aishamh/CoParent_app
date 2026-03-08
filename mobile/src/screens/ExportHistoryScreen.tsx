import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
  useExportHistory,
  useExportMessages,
  useExportExpenses,
  useExportCalendar,
} from "../hooks/useExports";
import { useTheme } from "../theme/useTheme";
import { formatShortDate } from "../utils/formatDate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExportType = "messages" | "expenses" | "calendar";

interface DateRangeForm {
  startDate: string;
  endDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPORT_TYPE_CONFIG: Record<ExportType, { icon: string; label: string; color: string }> = {
  messages: { icon: "message-circle", label: "Messages", color: "#3B82F6" },
  expenses: { icon: "dollar-sign", label: "Expenses", color: "#22C55E" },
  calendar: { icon: "calendar", label: "Calendar", color: "#A855F7" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidDateString(value: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(value)) return false;
  return !isNaN(new Date(value).getTime());
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 12)}...`;
}

function getExportTypeFromString(type: string): ExportType {
  if (type === "messages" || type === "expenses" || type === "calendar") {
    return type;
  }
  return "messages";
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ExportHistoryScreen() {
  const { colors } = useTheme();

  const [showDateModal, setShowDateModal] = useState(false);
  const [activeExportType, setActiveExportType] = useState<ExportType>("messages");
  const [dateRange, setDateRange] = useState<DateRangeForm>({ startDate: "", endDate: "" });

  const { data: exports = [], isLoading, isRefetching, refetch } = useExportHistory();
  const exportMessages = useExportMessages();
  const exportExpenses = useExportExpenses();
  const exportCalendar = useExportCalendar();

  // -- Handlers -------------------------------------------------------------

  function openDateRangeModal(type: ExportType) {
    setActiveExportType(type);
    setDateRange({ startDate: "", endDate: "" });
    setShowDateModal(true);
  }

  function closeDateRangeModal() {
    setShowDateModal(false);
  }

  function isDateRangeValid(): boolean {
    return isValidDateString(dateRange.startDate) && isValidDateString(dateRange.endDate);
  }

  function handleExport() {
    if (!isDateRangeValid()) {
      Alert.alert("Invalid Dates", "Please enter valid start and end dates in YYYY-MM-DD format.");
      return;
    }

    ReactNativeHapticFeedback.trigger("impactMedium");

    const payload = { startDate: dateRange.startDate, endDate: dateRange.endDate };
    const onSuccess = () => {
      ReactNativeHapticFeedback.trigger("notificationSuccess");
      closeDateRangeModal();
      refetch();
    };
    const onError = () => {
      ReactNativeHapticFeedback.trigger("notificationError");
      Alert.alert("Export Failed", "Could not create export. Please try again.");
    };

    switch (activeExportType) {
      case "messages":
        exportMessages.mutate(payload, { onSuccess, onError });
        break;
      case "expenses":
        exportExpenses.mutate(payload, { onSuccess, onError });
        break;
      case "calendar":
        exportCalendar.mutate(payload, { onSuccess, onError });
        break;
    }
  }

  function handleOpenExport(downloadUrl: string) {
    ReactNativeHapticFeedback.trigger("impactLight");
    Linking.openURL(downloadUrl).catch(() => {
      Alert.alert("Error", "Could not open the download link.");
    });
  }

  function isExporting(): boolean {
    return exportMessages.isPending || exportExpenses.isPending || exportCalendar.isPending;
  }

  // -- Sub-components -------------------------------------------------------

  function CreateExportSection() {
    return (
      <View style={styles.createSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Create New Export
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          Generate a PDF export of your records.
        </Text>

        <View style={styles.exportButtonRow}>
          {(Object.keys(EXPORT_TYPE_CONFIG) as ExportType[]).map((type) => {
            const config = EXPORT_TYPE_CONFIG[type];
            return (
              <TouchableOpacity
                key={type}
                onPress={() => openDateRangeModal(type)}
                style={[styles.exportTypeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Export ${config.label}`}
              >
                <View style={[styles.exportTypeIconWrapper, { backgroundColor: `${config.color}18` }]}>
                  <Icon name={config.icon} size={20} color={config.color} />
                </View>
                <Text style={[styles.exportTypeLabel, { color: colors.foreground }]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  function ExportCard({ item }: { item: any }) {
    const exportType = getExportTypeFromString(item.type ?? item.export_type ?? "messages");
    const config = EXPORT_TYPE_CONFIG[exportType];
    const dateRangeLabel = item.start_date && item.end_date
      ? `${formatShortDate(item.start_date)} - ${formatShortDate(item.end_date)}`
      : "All dates";
    const recordCount = item.record_count ?? item.recordCount ?? 0;
    const documentHash = item.document_hash ?? item.documentHash ?? "";
    const createdAt = item.created_at ?? item.createdAt;
    const downloadUrl = item.download_url ?? item.downloadUrl ?? "";

    return (
      <TouchableOpacity
        onPress={() => downloadUrl && handleOpenExport(downloadUrl)}
        style={[styles.exportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={downloadUrl ? 0.7 : 1}
        accessibilityRole="button"
        accessibilityLabel={`${config.label} export from ${dateRangeLabel}`}
      >
        <View style={[styles.exportCardIcon, { backgroundColor: `${config.color}18` }]}>
          <Icon name={config.icon} size={22} color={config.color} />
        </View>

        <View style={styles.exportCardContent}>
          <Text style={[styles.exportCardTitle, { color: colors.foreground }]}>
            {config.label} Export
          </Text>

          <View style={styles.exportCardMeta}>
            <View style={styles.exportCardMetaRow}>
              <Icon name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.exportCardMetaText, { color: colors.mutedForeground }]}>
                {dateRangeLabel}
              </Text>
            </View>

            <View style={styles.exportCardMetaRow}>
              <Icon name="hash" size={12} color={colors.mutedForeground} />
              <Text style={[styles.exportCardMetaText, { color: colors.mutedForeground }]}>
                {recordCount} records
              </Text>
            </View>

            {documentHash.length > 0 && (
              <View style={styles.exportCardMetaRow}>
                <Icon name="shield" size={12} color={colors.mutedForeground} />
                <Text style={[styles.exportCardMetaText, { color: colors.mutedForeground }]}>
                  {truncateHash(documentHash)}
                </Text>
              </View>
            )}

            {createdAt && (
              <View style={styles.exportCardMetaRow}>
                <Icon name="clock" size={12} color={colors.mutedForeground} />
                <Text style={[styles.exportCardMetaText, { color: colors.mutedForeground }]}>
                  {formatShortDate(createdAt)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {downloadUrl ? (
          <Icon name="download" size={18} color={colors.primary} />
        ) : (
          <Icon name="chevron-right" size={18} color={colors.border} />
        )}
      </TouchableOpacity>
    );
  }

  function EmptyExports() {
    return (
      <View style={styles.emptyState}>
        <Icon name="file-text" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
          No exports yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Create your first PDF export using the buttons above.
        </Text>
      </View>
    );
  }

  function DateRangeModal() {
    const config = EXPORT_TYPE_CONFIG[activeExportType];

    return (
      <Modal visible={showDateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: colors.foreground }]}>
                Export {config.label}
              </Text>
              <TouchableOpacity
                onPress={closeDateRangeModal}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="x" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.foreground }]}>
              Start Date
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={dateRange.startDate}
              onChangeText={(text) => setDateRange((prev) => ({ ...prev, startDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Start date"
            />

            <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 14 }]}>
              End Date
            </Text>
            <TextInput
              style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={dateRange.endDate}
              onChangeText={(text) => setDateRange((prev) => ({ ...prev, endDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="End date"
            />

            <TouchableOpacity
              onPress={handleExport}
              style={[
                styles.exportButton,
                { backgroundColor: colors.primary },
                !isDateRangeValid() && { opacity: 0.5 },
              ]}
              disabled={!isDateRangeValid() || isExporting()}
              accessibilityRole="button"
              accessibilityLabel={`Generate ${config.label} export`}
            >
              {isExporting() ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Icon name="download" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.exportButtonText, { color: colors.primaryForeground }]}>
                    Generate Export
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // -- Render ---------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
        <View style={styles.centeredLoader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <FlatList
        data={exports}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }) => <ExportCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <CreateExportSection />
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>
              Export History
            </Text>
          </>
        }
        ListEmptyComponent={<EmptyExports />}
      />

      <DateRangeModal />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // -- Create export section ------------------------------------------------
  createSection: {
    paddingTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  exportButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  exportTypeButton: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  exportTypeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  exportTypeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },

  // -- History title --------------------------------------------------------
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  // -- Export card -----------------------------------------------------------
  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  exportCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exportCardContent: {
    flex: 1,
  },
  exportCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  exportCardMeta: {
    gap: 3,
  },
  exportCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exportCardMetaText: {
    fontSize: 11,
  },

  // -- Empty state ----------------------------------------------------------
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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

  // -- Modal ----------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 24,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

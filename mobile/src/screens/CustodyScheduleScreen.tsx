import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
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
  useCustodySchedules,
  usePreviewCustodySchedule,
  useCreateCustodySchedule,
  useDeleteCustodySchedule,
} from "../hooks/useCustody";
import { useAuth } from "../auth/useAuth";
import { useFamilyMembers } from "../hooks/useFamily";
import { useTheme } from "../theme/useTheme";
import { formatShortDate } from "../utils/formatDate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TemplateType =
  | "week_on_week_off"
  | "2_2_3"
  | "alternating_weekends"
  | "alternating_weekends_midweek"
  | "custom";

type WizardStep = "template" | "start_date" | "preview" | "confirm";

interface PreviewDay {
  date: string;
  parent: "A" | "B";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPLATE_OPTIONS: { value: TemplateType; label: string; icon: string }[] = [
  { value: "week_on_week_off", label: "Week On / Week Off", icon: "repeat" },
  { value: "2_2_3", label: "2-2-3 Rotation", icon: "refresh-cw" },
  { value: "alternating_weekends", label: "Alternating Weekends", icon: "calendar" },
  { value: "alternating_weekends_midweek", label: "Alternating Weekends + Midweek", icon: "layers" },
  { value: "custom", label: "Custom Pattern", icon: "edit-3" },
];

const WIZARD_STEPS: WizardStep[] = ["template", "start_date", "preview", "confirm"];

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

function getStepLabel(step: WizardStep): string {
  switch (step) {
    case "template":
      return "Select Template";
    case "start_date":
      return "Set Start Date";
    case "preview":
      return "Preview Schedule";
    case "confirm":
      return "Confirm & Create";
  }
}

function isValidDateString(value: string): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function formatDayNumber(dateString: string): string {
  return String(new Date(dateString).getDate());
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CustodyScheduleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: familyMembers = [] } = useFamilyMembers();
  const coParent = familyMembers.find((m) => m.id !== user?.id);

  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("week_on_week_off");
  const [startDate, setStartDate] = useState("");
  const [previewDays, setPreviewDays] = useState<PreviewDay[]>([]);

  const { data: schedules = [], isLoading, refetch } = useCustodySchedules();
  const previewMutation = usePreviewCustodySchedule();
  const createMutation = useCreateCustodySchedule();
  const deleteMutation = useDeleteCustodySchedule();

  const activeSchedules = useMemo(
    () => schedules.filter((s: any) => s.active !== false),
    [schedules],
  );

  // -- Wizard navigation ----------------------------------------------------

  function openWizard() {
    setCurrentStep("template");
    setSelectedTemplate("week_on_week_off");
    setStartDate("");
    setPreviewDays([]);
    setShowWizard(true);
  }

  function closeWizard() {
    setShowWizard(false);
  }

  function goToNextStep() {
    const index = getStepIndex(currentStep);
    if (index < WIZARD_STEPS.length - 1) {
      const nextStep = WIZARD_STEPS[index + 1];
      if (nextStep === "preview") {
        fetchPreview();
      }
      setCurrentStep(nextStep);
    }
  }

  function goToPreviousStep() {
    const index = getStepIndex(currentStep);
    if (index > 0) {
      setCurrentStep(WIZARD_STEPS[index - 1]);
    }
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case "template":
        return true;
      case "start_date":
        return isValidDateString(startDate);
      case "preview":
        return previewDays.length > 0;
      case "confirm":
        return true;
    }
  }

  // -- Data operations ------------------------------------------------------

  function fetchPreview() {
    if (!isValidDateString(startDate)) return;

    previewMutation.mutate(
      {
        template_type: selectedTemplate,
        start_date: startDate,
        parent_a_id: user?.id ?? "",
        parent_b_id: coParent?.id ?? "",
      },
      {
        onSuccess: (data: any) => {
          setPreviewDays(data?.days ?? data ?? []);
        },
        onError: () => {
          Alert.alert("Error", "Could not generate preview. Please try again.");
        },
      },
    );
  }

  function handleCreate() {
    ReactNativeHapticFeedback.trigger("impactMedium");
    createMutation.mutate(
      {
        template_type: selectedTemplate,
        start_date: startDate,
        parent_a_id: user?.id ?? "",
        parent_b_id: coParent?.id ?? "",
      },
      {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          closeWizard();
          refetch();
        },
        onError: () => {
          ReactNativeHapticFeedback.trigger("notificationError");
          Alert.alert("Error", "Could not create schedule. Please try again.");
        },
      },
    );
  }

  function handleDeleteSchedule(scheduleId: string, label: string) {
    Alert.alert(
      "Deactivate Schedule",
      `Are you sure you want to deactivate "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => {
            ReactNativeHapticFeedback.trigger("impactMedium");
            deleteMutation.mutate(scheduleId, {
              onSuccess: () => refetch(),
              onError: () => {
                Alert.alert("Error", "Could not deactivate schedule.");
              },
            });
          },
        },
      ],
    );
  }

  // -- Sub-components -------------------------------------------------------

  function StepIndicator() {
    const stepIndex = getStepIndex(currentStep);

    return (
      <View style={styles.stepIndicatorRow}>
        {WIZARD_STEPS.map((step, index) => {
          const isActive = index === stepIndex;
          const isCompleted = index < stepIndex;

          return (
            <View key={step} style={styles.stepDot}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.border },
                  isActive && { backgroundColor: colors.primary },
                  isCompleted && { backgroundColor: colors.primary, opacity: 0.5 },
                ]}
              />
              <Text
                style={[
                  styles.stepDotLabel,
                  { color: colors.mutedForeground },
                  isActive && { color: colors.primary, fontWeight: "600" },
                ]}
                numberOfLines={1}
              >
                {getStepLabel(step)}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  function TemplateStep() {
    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          Choose a custody template
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
          Select the arrangement that best fits your custody agreement.
        </Text>

        {TEMPLATE_OPTIONS.map((option) => {
          const isSelected = selectedTemplate === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("selection");
                setSelectedTemplate(option.value);
              }}
              style={[
                styles.templateOption,
                { backgroundColor: colors.card, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
            >
              <View style={[styles.templateIconWrapper, { backgroundColor: isSelected ? `${colors.primary}18` : colors.muted }]}>
                <Icon name={option.icon} size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
              </View>
              <Text style={[styles.templateLabel, { color: colors.foreground }]}>
                {option.label}
              </Text>
              {isSelected && (
                <Icon name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function StartDateStep() {
    const isValid = isValidDateString(startDate);
    const hasInput = startDate.length > 0;

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          When does the schedule begin?
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
          Enter the start date for the custody rotation.
        </Text>

        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          Start Date
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              color: colors.foreground,
              borderColor: hasInput && !isValid ? colors.destructive : colors.border,
              backgroundColor: colors.card,
            },
          ]}
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Start date in YYYY-MM-DD format"
        />
        {hasInput && !isValid && (
          <Text style={[styles.validationError, { color: colors.destructive }]}>
            Please enter a valid date in YYYY-MM-DD format.
          </Text>
        )}
      </View>
    );
  }

  function PreviewStep() {
    if (previewMutation.isPending) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Generating preview...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          28-Day Preview
        </Text>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.parentA }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>Parent A</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.parentB }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>Parent B</Text>
          </View>
        </View>

        <View style={styles.calendarHeaderRow}>
          {DAY_HEADERS.map((day) => (
            <View key={day} style={styles.calendarHeaderCell}>
              <Text style={[styles.calendarHeaderText, { color: colors.mutedForeground }]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        <CalendarGrid days={previewDays} />
      </View>
    );
  }

  function CalendarGrid({ days }: { days: PreviewDay[] }) {
    const paddedDays = useMemo(() => {
      if (days.length === 0) return [];
      const firstDayOfWeek = new Date(days[0].date).getDay();
      const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      const padding: (PreviewDay | null)[] = Array(mondayOffset).fill(null);
      return [...padding, ...days];
    }, [days]);

    const rows: (PreviewDay | null)[][] = [];
    for (let i = 0; i < paddedDays.length; i += 7) {
      const row = paddedDays.slice(i, i + 7);
      while (row.length < 7) row.push(null);
      rows.push(row);
    }

    return (
      <View style={styles.calendarGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.calendarRow}>
            {row.map((day, cellIndex) => {
              if (!day) {
                return <View key={`empty-${cellIndex}`} style={styles.calendarCell} />;
              }

              const cellColor = day.parent === "A" ? colors.parentA : colors.parentB;

              return (
                <View
                  key={day.date}
                  style={[styles.calendarCell, { backgroundColor: cellColor, borderRadius: 8 }]}
                  accessibilityLabel={`${day.date}: Parent ${day.parent}`}
                >
                  <Text style={[styles.calendarCellText, { color: "#FFFFFF" }]}>
                    {formatDayNumber(day.date)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  function ConfirmStep() {
    const templateLabel = TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.label ?? selectedTemplate;

    return (
      <View style={styles.stepContent}>
        <View style={[styles.confirmIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Icon name="check-circle" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.stepTitle, { textAlign: "center", color: colors.foreground }]}>
          Ready to create?
        </Text>

        <View style={[styles.confirmSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ConfirmRow label="Template" value={templateLabel} />
          <ConfirmRow label="Start Date" value={startDate} />
          <ConfirmRow label="Duration" value="Ongoing rotation" />
        </View>
      </View>
    );
  }

  function ConfirmRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.confirmRow}>
        <Text style={[styles.confirmLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.confirmValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    );
  }

  function WizardBody() {
    switch (currentStep) {
      case "template":
        return <TemplateStep />;
      case "start_date":
        return <StartDateStep />;
      case "preview":
        return <PreviewStep />;
      case "confirm":
        return <ConfirmStep />;
    }
  }

  function ScheduleCard({ schedule }: { schedule: any }) {
    const templateLabel = TEMPLATE_OPTIONS.find((t) => t.value === schedule.template)?.label ?? schedule.template;

    return (
      <View
        style={[styles.scheduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={styles.scheduleCardHeader}>
          <View style={[styles.scheduleIconWrapper, { backgroundColor: `${colors.primary}18` }]}>
            <Icon name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={styles.scheduleCardInfo}>
            <Text style={[styles.scheduleCardTitle, { color: colors.foreground }]}>
              {templateLabel}
            </Text>
            <Text style={[styles.scheduleCardDetail, { color: colors.mutedForeground }]}>
              Started {formatShortDate(schedule.start_date ?? schedule.startDate ?? schedule.created_at)}
            </Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: "#D1FAE5" }]}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteSchedule(schedule.id, templateLabel)}
          style={[styles.deactivateButton, { borderColor: colors.destructive }]}
          accessibilityRole="button"
          accessibilityLabel={`Deactivate ${templateLabel} schedule`}
        >
          <Icon name="x-circle" size={14} color={colors.destructive} />
          <Text style={[styles.deactivateText, { color: colors.destructive }]}>
            Deactivate
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function EmptySchedules() {
    return (
      <View style={styles.emptyState}>
        <Icon name="calendar" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
          No custody schedules
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Create a schedule to track custody arrangements.
        </Text>
      </View>
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
        data={activeSchedules}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }) => <ScheduleCard schedule={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Schedules
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptySchedules />}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          ReactNativeHapticFeedback.trigger("impactLight");
          openWizard();
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Create new custody schedule"
      >
        <Icon name="plus" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <Modal visible={showWizard} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: colors.foreground }]}>
                Create New Schedule
              </Text>
              <TouchableOpacity
                onPress={closeWizard}
                accessibilityRole="button"
                accessibilityLabel="Close wizard"
              >
                <Icon name="x" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <StepIndicator />

            <ScrollView
              style={styles.wizardScrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.wizardScrollContent}
            >
              <WizardBody />
            </ScrollView>

            <View style={[styles.wizardFooter, { borderTopColor: colors.border }]}>
              {currentStep !== "template" && (
                <TouchableOpacity
                  onPress={goToPreviousStep}
                  style={[styles.wizardBackButton, { borderColor: colors.border }]}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Icon name="arrow-left" size={16} color={colors.foreground} />
                  <Text style={[styles.wizardBackText, { color: colors.foreground }]}>Back</Text>
                </TouchableOpacity>
              )}

              <View style={styles.footerSpacer} />

              {currentStep === "confirm" ? (
                <TouchableOpacity
                  onPress={handleCreate}
                  style={[styles.wizardNextButton, { backgroundColor: colors.primary }]}
                  disabled={createMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Create schedule"
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <>
                      <Icon name="check" size={16} color={colors.primaryForeground} />
                      <Text style={[styles.wizardNextText, { color: colors.primaryForeground }]}>
                        Create Schedule
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={goToNextStep}
                  style={[
                    styles.wizardNextButton,
                    { backgroundColor: colors.primary },
                    !canProceed() && { opacity: 0.5 },
                  ]}
                  disabled={!canProceed()}
                  accessibilityRole="button"
                  accessibilityLabel="Next step"
                >
                  <Text style={[styles.wizardNextText, { color: colors.primaryForeground }]}>
                    Next
                  </Text>
                  <Icon name="arrow-right" size={16} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 80,
  },
  headerSection: {
    paddingTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // -- Schedule card -------------------------------------------------------
  scheduleCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  scheduleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scheduleCardInfo: {
    flex: 1,
  },
  scheduleCardTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  scheduleCardDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
  },
  deactivateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  deactivateText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // -- Empty state ---------------------------------------------------------
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

  // -- FAB -----------------------------------------------------------------
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

  // -- Modal ---------------------------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  // -- Step indicator ------------------------------------------------------
  stepIndicatorRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 4,
  },
  stepDot: {
    flex: 1,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  stepDotLabel: {
    fontSize: 9,
    textAlign: "center",
  },

  // -- Wizard scroll -------------------------------------------------------
  wizardScrollView: {
    flex: 1,
  },
  wizardScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // -- Step content --------------------------------------------------------
  stepContent: {
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },

  // -- Template options ----------------------------------------------------
  templateOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  templateIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  templateLabel: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },

  // -- Date input ----------------------------------------------------------
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  validationError: {
    fontSize: 12,
    marginTop: 6,
  },

  // -- Preview calendar ----------------------------------------------------
  legendRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "500",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  calendarHeaderText: {
    fontSize: 11,
    fontWeight: "600",
  },
  calendarGrid: {
    gap: 4,
  },
  calendarRow: {
    flexDirection: "row",
    gap: 4,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // -- Confirm step --------------------------------------------------------
  confirmIcon: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmSummary: {
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 0.5,
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  confirmLabel: {
    fontSize: 14,
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  // -- Wizard footer -------------------------------------------------------
  wizardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 0.5,
  },
  footerSpacer: {
    flex: 1,
  },
  wizardBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  wizardBackText: {
    fontSize: 15,
    fontWeight: "500",
  },
  wizardNextButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  wizardNextText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // -- Loading -------------------------------------------------------------
  loaderContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
});

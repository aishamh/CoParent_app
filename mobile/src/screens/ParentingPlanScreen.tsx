import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../theme/useTheme";
import { useChildren } from "../hooks/useChildren";
import Card from "../components/ui/Card";
import type { ColorPalette } from "../constants/colors";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "@parenting_plans";
const TOTAL_STEPS = 8;

const CUSTODY_ARRANGEMENTS = [
  "50/50 Equal",
  "60/40",
  "70/30",
  "80/20",
  "Every Other Weekend",
  "Custom",
] as const;

const HOLIDAYS = [
  "New Year's",
  "Easter",
  "Eid al-Fitr",
  "Eid al-Adha",
  "Constitution Day (17. mai)",
  "Christmas Eve",
  "Christmas Day",
  "Summer Holiday (first half)",
  "Summer Holiday (second half)",
  "Fall Break",
  "Winter Break",
] as const;

const BIRTHDAY_OPTIONS = [
  "With child",
  "Alternating",
  "Split",
] as const;

const DECISION_CATEGORIES = [
  "Medical/Health",
  "Education/Schooling",
  "Religious upbringing",
  "Extracurricular activities",
  "Travel (domestic)",
  "Travel (international)",
] as const;

const DECISION_OPTIONS = ["joint", "parentA", "parentB"] as const;

const COMMUNICATION_METHODS = [
  "App Messages",
  "Phone",
  "Email",
] as const;

const RESPONSE_TIMES = [
  "2 hours",
  "4 hours",
  "12 hours",
  "24 hours",
  "48 hours",
] as const;

const VIDEO_CALL_SCHEDULES = [
  "Daily",
  "Every other day",
  "Weekly",
  "As needed",
] as const;

const TRANSPORTATION_OPTIONS = [
  "Parent A drops off",
  "Parent B picks up",
  "Meet halfway",
  "Custom",
] as const;

const GRACE_PERIOD_OPTIONS = [10, 15, 30] as const;

const PASSPORT_OPTIONS = [
  "Parent A holds",
  "Parent B holds",
  "Neutral third party",
] as const;

const SOCIAL_MEDIA_OPTIONS = [
  "No posting",
  "Pre-approval required",
  "Either parent can post",
] as const;

const PARTNER_INTRO_OPTIONS = [
  "No restriction",
  "After 6 months",
  "After 12 months",
  "Mutual agreement",
] as const;

const STEP_TITLES = [
  "Children & Parents",
  "Custody Schedule",
  "Holiday & Special Days",
  "Decision Making",
  "Communication Rules",
  "Exchange Details",
  "Additional Terms",
  "Review & Export",
] as const;

const STEP_DESCRIPTIONS = [
  "Identify the children and parents covered by this plan.",
  "Define the weekly custody arrangement and schedule.",
  "Assign holidays and special occasions to each parent.",
  "Specify who makes key decisions for your children.",
  "Set communication expectations between co-parents.",
  "Define where and how custody exchanges happen.",
  "Cover relocation, travel documents, and other provisions.",
  "Review the complete plan, then save or share it.",
] as const;

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface ParentingPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "completed";
  parentAName: string;
  parentBName: string;
  effectiveDate: string;
  childrenNames: string[];
  custodyArrangement: string;
  primaryResidence: "parentA" | "parentB";
  weekdaySchedule: string;
  weekendSchedule: string;
  holidays: Record<string, "parentA" | "parentB" | "alternating">;
  birthdayHandling: string;
  decisions: Record<string, "joint" | "parentA" | "parentB">;
  communicationMethod: string;
  responseTime: string;
  videoCallSchedule: string;
  rightOfFirstRefusal: boolean;
  exchangeLocation: string;
  backupLocation: string;
  exchangeTime: string;
  transportationResponsibility: string;
  gracePeriodMinutes: number;
  documentExchanges: boolean;
  relocationClause: boolean;
  relocationDistanceLimit: string;
  passportHandling: string;
  petCustody: string;
  socialMediaPolicy: string;
  newPartnerIntroduction: string;
  additionalTerms: string;
}

function createEmptyPlan(): ParentingPlan {
  const now = new Date().toISOString();
  return {
    id: `plan_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    status: "draft",
    parentAName: "",
    parentBName: "",
    effectiveDate: "",
    childrenNames: [],
    custodyArrangement: CUSTODY_ARRANGEMENTS[0],
    primaryResidence: "parentA",
    weekdaySchedule: "",
    weekendSchedule: "",
    holidays: buildDefaultHolidays(),
    birthdayHandling: BIRTHDAY_OPTIONS[0],
    decisions: buildDefaultDecisions(),
    communicationMethod: COMMUNICATION_METHODS[0],
    responseTime: RESPONSE_TIMES[2],
    videoCallSchedule: VIDEO_CALL_SCHEDULES[2],
    rightOfFirstRefusal: true,
    exchangeLocation: "",
    backupLocation: "",
    exchangeTime: "",
    transportationResponsibility: TRANSPORTATION_OPTIONS[0],
    gracePeriodMinutes: GRACE_PERIOD_OPTIONS[1],
    documentExchanges: true,
    relocationClause: false,
    relocationDistanceLimit: "",
    passportHandling: PASSPORT_OPTIONS[0],
    petCustody: "",
    socialMediaPolicy: SOCIAL_MEDIA_OPTIONS[1],
    newPartnerIntroduction: PARTNER_INTRO_OPTIONS[3],
    additionalTerms: "",
  };
}

function buildDefaultHolidays(): Record<string, "parentA" | "parentB" | "alternating"> {
  const result: Record<string, "parentA" | "parentB" | "alternating"> = {};
  for (const holiday of HOLIDAYS) {
    result[holiday] = "alternating";
  }
  return result;
}

function buildDefaultDecisions(): Record<string, "joint" | "parentA" | "parentB"> {
  const result: Record<string, "joint" | "parentA" | "parentB"> = {};
  for (const category of DECISION_CATEGORIES) {
    result[category] = "joint";
  }
  return result;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

async function loadPlansFromStorage(): Promise<ParentingPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function savePlansToStorage(plans: ParentingPlan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // Silently handle storage write failure
  }
}

async function saveSinglePlan(plan: ParentingPlan): Promise<void> {
  const plans = await loadPlansFromStorage();
  const index = plans.findIndex((p) => p.id === plan.id);
  const updated = { ...plan, updatedAt: new Date().toISOString() };

  if (index >= 0) {
    plans[index] = updated;
  } else {
    plans.push(updated);
  }
  await savePlansToStorage(plans);
}

// ---------------------------------------------------------------------------
// Text export helper
// ---------------------------------------------------------------------------

function buildPlanSummaryText(plan: ParentingPlan): string {
  const sections: string[] = [];
  sections.push("PARENTING PLAN");
  sections.push("==============\n");

  sections.push(`Effective Date: ${plan.effectiveDate || "Not set"}`);
  sections.push(`Parent A: ${plan.parentAName || "Not set"}`);
  sections.push(`Parent B: ${plan.parentBName || "Not set"}`);
  sections.push(`Children: ${plan.childrenNames.join(", ") || "None"}\n`);

  sections.push("CUSTODY SCHEDULE");
  sections.push(`Arrangement: ${plan.custodyArrangement}`);
  sections.push(`Primary Residence: ${formatParentLabel(plan.primaryResidence, plan)}`);
  sections.push(`Weekday Schedule: ${plan.weekdaySchedule || "Not specified"}`);
  sections.push(`Weekend Schedule: ${plan.weekendSchedule || "Not specified"}\n`);

  sections.push("HOLIDAYS & SPECIAL DAYS");
  for (const [holiday, assignment] of Object.entries(plan.holidays)) {
    sections.push(`  ${holiday}: ${formatHolidayAssignment(assignment, plan)}`);
  }
  sections.push(`Birthday Handling: ${plan.birthdayHandling}\n`);

  sections.push("DECISION MAKING");
  for (const [category, assignment] of Object.entries(plan.decisions)) {
    sections.push(`  ${category}: ${formatDecisionAssignment(assignment, plan)}`);
  }
  sections.push("");

  sections.push("COMMUNICATION RULES");
  sections.push(`Method: ${plan.communicationMethod}`);
  sections.push(`Response Time: ${plan.responseTime}`);
  sections.push(`Video Calls: ${plan.videoCallSchedule}`);
  sections.push(`Right of First Refusal: ${plan.rightOfFirstRefusal ? "Yes" : "No"}\n`);

  sections.push("EXCHANGE DETAILS");
  sections.push(`Primary Location: ${plan.exchangeLocation || "Not set"}`);
  sections.push(`Backup Location: ${plan.backupLocation || "Not set"}`);
  sections.push(`Exchange Time: ${plan.exchangeTime || "Not set"}`);
  sections.push(`Transportation: ${plan.transportationResponsibility}`);
  sections.push(`Grace Period: ${plan.gracePeriodMinutes} minutes`);
  sections.push(`Document Exchanges: ${plan.documentExchanges ? "Yes" : "No"}\n`);

  sections.push("ADDITIONAL TERMS");
  sections.push(`Relocation Clause: ${plan.relocationClause ? "Yes" : "No"}`);
  if (plan.relocationClause) {
    sections.push(`  Distance Limit: ${plan.relocationDistanceLimit || "Not set"}`);
  }
  sections.push(`Passport: ${plan.passportHandling}`);
  sections.push(`Pet Custody: ${plan.petCustody || "N/A"}`);
  sections.push(`Social Media: ${plan.socialMediaPolicy}`);
  sections.push(`New Partner Introduction: ${plan.newPartnerIntroduction}`);
  if (plan.additionalTerms) {
    sections.push(`\nAdditional Agreements:\n${plan.additionalTerms}`);
  }

  return sections.join("\n");
}

function formatParentLabel(
  key: "parentA" | "parentB",
  plan: ParentingPlan
): string {
  return key === "parentA"
    ? plan.parentAName || "Parent A"
    : plan.parentBName || "Parent B";
}

function formatHolidayAssignment(
  value: "parentA" | "parentB" | "alternating",
  plan: ParentingPlan
): string {
  if (value === "alternating") return "Alternating";
  return formatParentLabel(value, plan);
}

function formatDecisionAssignment(
  value: "joint" | "parentA" | "parentB",
  plan: ParentingPlan
): string {
  if (value === "joint") return "Joint";
  return formatParentLabel(value, plan);
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

interface SectionLabelProps {
  text: string;
  colors: ColorPalette;
}

function SectionLabel({ text, colors }: SectionLabelProps) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
      {text}
    </Text>
  );
}

interface OptionChipRowProps {
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
  colors: ColorPalette;
}

function OptionChipRow({ options, selected, onSelect, colors }: OptionChipRowProps) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => {
        const isActive = selected === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.chip,
              { backgroundColor: colors.muted },
              isActive && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.mutedForeground },
                isActive && { color: colors.primaryForeground },
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ThreeWayToggleProps {
  label: string;
  value: string;
  optionA: string;
  optionB: string;
  optionC: string;
  onSelect: (value: string) => void;
  colors: ColorPalette;
  parentAName: string;
  parentBName: string;
}

function ThreeWayToggle({
  label,
  value,
  optionA,
  optionB,
  optionC,
  onSelect,
  colors,
  parentAName,
  parentBName,
}: ThreeWayToggleProps) {
  const displayLabel = (opt: string): string => {
    if (opt === "parentA") return parentAName || "Parent A";
    if (opt === "parentB") return parentBName || "Parent B";
    if (opt === "joint") return "Joint";
    if (opt === "alternating") return "Alternating";
    return opt;
  };

  return (
    <View style={styles.threeWayRow}>
      <Text
        style={[styles.threeWayLabel, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <View style={styles.threeWayOptions}>
        {[optionA, optionB, optionC].map((opt) => {
          const isActive = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              style={[
                styles.threeWayChip,
                { backgroundColor: colors.muted, borderColor: colors.border },
                isActive && opt === "parentA" && { backgroundColor: colors.parentA },
                isActive && opt === "parentB" && { backgroundColor: colors.parentB },
                isActive && opt !== "parentA" && opt !== "parentB" && {
                  backgroundColor: colors.primary,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.threeWayChipText,
                  { color: colors.mutedForeground },
                  isActive && { color: "#FFFFFF" },
                ]}
              >
                {displayLabel(opt)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface LabeledInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  colors: ColorPalette;
  multiline?: boolean;
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  multiline = false,
}: LabeledInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          { color: colors.foreground, borderColor: colors.input, backgroundColor: colors.card },
          multiline && styles.textInputMultiline,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
      />
    </View>
  );
}

interface LabeledSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  colors: ColorPalette;
}

function LabeledSwitch({ label, description, value, onToggle, colors }: LabeledSwitchProps) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchTextColumn}>
        <Text style={[styles.switchLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.switchDescription, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Children & Parents
// ---------------------------------------------------------------------------

interface StepChildrenParentsProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepChildrenParents({ plan, onChange, colors }: StepChildrenParentsProps) {
  const { data: childrenData } = useChildren();
  const children = childrenData ?? [];

  const toggleChild = (name: string) => {
    const current = plan.childrenNames;
    const updated = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    onChange({ childrenNames: updated });
  };

  const addManualChild = () => {
    Alert.prompt?.(
      "Add Child",
      "Enter the child's name",
      (name: string) => {
        if (name.trim()) {
          onChange({ childrenNames: [...plan.childrenNames, name.trim()] });
        }
      }
    );
  };

  return (
    <View>
      <SectionLabel text="Children" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        {children.length > 0 ? (
          children.map((child) => {
            const name = child.name ?? `Child #${child.id}`;
            const isSelected = plan.childrenNames.includes(name);
            return (
              <TouchableOpacity
                key={child.id}
                style={styles.childRow}
                onPress={() => toggleChild(name)}
                activeOpacity={0.7}
              >
                <Icon
                  name={isSelected ? "check-square" : "square"}
                  size={20}
                  color={isSelected ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.childName, { color: colors.foreground }]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            No children found. Add manually below.
          </Text>
        )}

        {plan.childrenNames
          .filter((name) => !children.some((c) => (c.name ?? "") === name))
          .map((name) => (
            <View key={name} style={styles.childRow}>
              <Icon name="check-square" size={20} color={colors.primary} />
              <Text style={[styles.childName, { color: colors.foreground }]}>
                {name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  onChange({
                    childrenNames: plan.childrenNames.filter((n) => n !== name),
                  })
                }
              >
                <Icon name="x" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}

        <TouchableOpacity
          style={[styles.addChildButton, { borderColor: colors.border }]}
          onPress={addManualChild}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addChildText, { color: colors.primary }]}>
            Add Child Manually
          </Text>
        </TouchableOpacity>
      </Card>

      <SectionLabel text="Parents" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Parent A Name"
          value={plan.parentAName}
          onChangeText={(text) => onChange({ parentAName: text })}
          placeholder="e.g. Maria Johansen"
          colors={colors}
        />
        <LabeledInput
          label="Parent B Name"
          value={plan.parentBName}
          onChangeText={(text) => onChange({ parentBName: text })}
          placeholder="e.g. Erik Johansen"
          colors={colors}
        />
      </Card>

      <SectionLabel text="Effective Date" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Plan Effective Date"
          value={plan.effectiveDate}
          onChangeText={(text) => onChange({ effectiveDate: text })}
          placeholder="YYYY-MM-DD"
          colors={colors}
        />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Custody Schedule
// ---------------------------------------------------------------------------

interface CustodyPreviewProps {
  arrangement: string;
  colors: ColorPalette;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function computePreviewPattern(arrangement: string): ("A" | "B")[] {
  switch (arrangement) {
    case "50/50 Equal":
      return ["A", "A", "A", "B", "B", "B", "A"];
    case "60/40":
      return ["A", "A", "A", "A", "B", "B", "B"];
    case "70/30":
      return ["A", "A", "A", "A", "A", "B", "B"];
    case "80/20":
      return ["A", "A", "A", "A", "A", "A", "B"];
    case "Every Other Weekend":
      return ["A", "A", "A", "A", "A", "B", "B"];
    default:
      return ["A", "A", "A", "A", "B", "B", "B"];
  }
}

function CustodyPreview({ arrangement, colors }: CustodyPreviewProps) {
  const pattern = computePreviewPattern(arrangement);
  return (
    <View style={styles.previewRow}>
      {WEEKDAY_LABELS.map((day, index) => {
        const isA = pattern[index] === "A";
        return (
          <View key={day} style={styles.previewDayColumn}>
            <Text style={[styles.previewDayLabel, { color: colors.mutedForeground }]}>
              {day}
            </Text>
            <View
              style={[
                styles.previewBlock,
                { backgroundColor: isA ? colors.parentA : colors.parentB },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

interface StepCustodyScheduleProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepCustodySchedule({ plan, onChange, colors }: StepCustodyScheduleProps) {
  return (
    <View>
      <SectionLabel text="Custody Arrangement" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={CUSTODY_ARRANGEMENTS}
          selected={plan.custodyArrangement}
          onSelect={(value) => onChange({ custodyArrangement: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Weekly Preview" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <CustodyPreview arrangement={plan.custodyArrangement} colors={colors} />
        <View style={styles.previewLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.parentA }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>
              {plan.parentAName || "Parent A"}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.parentB }]} />
            <Text style={[styles.legendText, { color: colors.foreground }]}>
              {plan.parentBName || "Parent B"}
            </Text>
          </View>
        </View>
      </Card>

      <SectionLabel text="Primary Residence" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={["parentA", "parentB"]}
          selected={plan.primaryResidence}
          onSelect={(value) =>
            onChange({ primaryResidence: value as "parentA" | "parentB" })
          }
          colors={colors}
        />
      </Card>

      <SectionLabel text="Schedule Details" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Weekday Schedule"
          value={plan.weekdaySchedule}
          onChangeText={(text) => onChange({ weekdaySchedule: text })}
          placeholder="e.g. Mon-Thu with Parent A, Fri with Parent B"
          colors={colors}
          multiline
        />
        <LabeledInput
          label="Weekend Schedule"
          value={plan.weekendSchedule}
          onChangeText={(text) => onChange({ weekendSchedule: text })}
          placeholder="e.g. Alternating weekends starting Saturday 10 AM"
          colors={colors}
          multiline
        />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Holiday & Special Days
// ---------------------------------------------------------------------------

interface StepHolidaysProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepHolidays({ plan, onChange, colors }: StepHolidaysProps) {
  const updateHoliday = (
    holiday: string,
    value: "parentA" | "parentB" | "alternating"
  ) => {
    onChange({ holidays: { ...plan.holidays, [holiday]: value } });
  };

  return (
    <View>
      <SectionLabel text="Holiday Assignments" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        {HOLIDAYS.map((holiday) => (
          <ThreeWayToggle
            key={holiday}
            label={holiday}
            value={plan.holidays[holiday] ?? "alternating"}
            optionA="parentA"
            optionB="parentB"
            optionC="alternating"
            onSelect={(val) =>
              updateHoliday(holiday, val as "parentA" | "parentB" | "alternating")
            }
            colors={colors}
            parentAName={plan.parentAName}
            parentBName={plan.parentBName}
          />
        ))}
      </Card>

      <SectionLabel text="Birthdays" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={BIRTHDAY_OPTIONS}
          selected={plan.birthdayHandling}
          onSelect={(value) => onChange({ birthdayHandling: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Mother's & Father's Day" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <View style={styles.autoAssignRow}>
          <Icon name="info" size={16} color={colors.primary} />
          <Text style={[styles.autoAssignText, { color: colors.mutedForeground }]}>
            Mother's Day is automatically assigned to the mother. Father's Day is
            automatically assigned to the father.
          </Text>
        </View>
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Decision Making
// ---------------------------------------------------------------------------

interface StepDecisionMakingProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepDecisionMaking({ plan, onChange, colors }: StepDecisionMakingProps) {
  const updateDecision = (
    category: string,
    value: "joint" | "parentA" | "parentB"
  ) => {
    onChange({ decisions: { ...plan.decisions, [category]: value } });
  };

  return (
    <View>
      <SectionLabel text="Decision Authority" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        {DECISION_CATEGORIES.map((category) => (
          <ThreeWayToggle
            key={category}
            label={category}
            value={plan.decisions[category] ?? "joint"}
            optionA="joint"
            optionB="parentA"
            optionC="parentB"
            onSelect={(val) =>
              updateDecision(category, val as "joint" | "parentA" | "parentB")
            }
            colors={colors}
            parentAName={plan.parentAName}
            parentBName={plan.parentBName}
          />
        ))}
      </Card>

      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <View style={styles.autoAssignRow}>
          <Icon name="alert-triangle" size={16} color={colors.amber} />
          <Text style={[styles.autoAssignText, { color: colors.mutedForeground }]}>
            International travel requires both parents' written consent by default
            (Hague Convention compliance).
          </Text>
        </View>
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Communication Rules
// ---------------------------------------------------------------------------

interface StepCommunicationProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepCommunication({ plan, onChange, colors }: StepCommunicationProps) {
  return (
    <View>
      <SectionLabel text="Preferred Communication Method" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={COMMUNICATION_METHODS}
          selected={plan.communicationMethod}
          onSelect={(value) => onChange({ communicationMethod: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Response Time Expectation" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={RESPONSE_TIMES}
          selected={plan.responseTime}
          onSelect={(value) => onChange({ responseTime: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Video Call Schedule" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={VIDEO_CALL_SCHEDULES}
          selected={plan.videoCallSchedule}
          onSelect={(value) => onChange({ videoCallSchedule: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Emergency Protocol" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <View style={styles.autoAssignRow}>
          <Icon name="phone-call" size={16} color={colors.destructive} />
          <Text style={[styles.autoAssignText, { color: colors.mutedForeground }]}>
            In an emergency, always call the other parent first, then follow up
            with a message through the agreed channel.
          </Text>
        </View>
      </Card>

      <SectionLabel text="Right of First Refusal" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledSwitch
          label="Right of First Refusal"
          description="If one parent cannot care for the child, offer the other parent the opportunity first before arranging alternative care."
          value={plan.rightOfFirstRefusal}
          onToggle={(value) => onChange({ rightOfFirstRefusal: value })}
          colors={colors}
        />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 6: Exchange Details
// ---------------------------------------------------------------------------

interface StepExchangeProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepExchange({ plan, onChange, colors }: StepExchangeProps) {
  return (
    <View>
      <SectionLabel text="Exchange Locations" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Primary Exchange Location"
          value={plan.exchangeLocation}
          onChangeText={(text) => onChange({ exchangeLocation: text })}
          placeholder="e.g. School front entrance"
          colors={colors}
        />
        <LabeledInput
          label="Backup Exchange Location"
          value={plan.backupLocation}
          onChangeText={(text) => onChange({ backupLocation: text })}
          placeholder="e.g. Public library parking lot"
          colors={colors}
        />
      </Card>

      <SectionLabel text="Exchange Time" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Exchange Time"
          value={plan.exchangeTime}
          onChangeText={(text) => onChange({ exchangeTime: text })}
          placeholder="e.g. 5:00 PM"
          colors={colors}
        />
      </Card>

      <SectionLabel text="Transportation" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={TRANSPORTATION_OPTIONS}
          selected={plan.transportationResponsibility}
          onSelect={(value) => onChange({ transportationResponsibility: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Late Policy" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.inputLabel, { color: colors.foreground }]}>
          Grace Period (minutes)
        </Text>
        <OptionChipRow
          options={GRACE_PERIOD_OPTIONS.map(String)}
          selected={String(plan.gracePeriodMinutes)}
          onSelect={(value) => onChange({ gracePeriodMinutes: Number(value) })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Documentation" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledSwitch
          label="Record Each Exchange"
          description="Document every custody exchange with timestamps in the app."
          value={plan.documentExchanges}
          onToggle={(value) => onChange({ documentExchanges: value })}
          colors={colors}
        />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 7: Additional Terms
// ---------------------------------------------------------------------------

interface StepAdditionalTermsProps {
  plan: ParentingPlan;
  onChange: (partial: Partial<ParentingPlan>) => void;
  colors: ColorPalette;
}

function StepAdditionalTerms({ plan, onChange, colors }: StepAdditionalTermsProps) {
  return (
    <View>
      <SectionLabel text="Relocation" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledSwitch
          label="Relocation Clause"
          description="Require notice and consent before either parent relocates beyond the distance limit."
          value={plan.relocationClause}
          onToggle={(value) => onChange({ relocationClause: value })}
          colors={colors}
        />
        {plan.relocationClause && (
          <LabeledInput
            label="Distance Limit"
            value={plan.relocationDistanceLimit}
            onChangeText={(text) => onChange({ relocationDistanceLimit: text })}
            placeholder="e.g. 50 km"
            colors={colors}
          />
        )}
      </Card>

      <SectionLabel text="Passport Handling" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={PASSPORT_OPTIONS}
          selected={plan.passportHandling}
          onSelect={(value) => onChange({ passportHandling: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Pet Custody" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Pet Custody Notes"
          value={plan.petCustody}
          onChangeText={(text) => onChange({ petCustody: text })}
          placeholder="e.g. Dog stays with Parent A; cat travels with children"
          colors={colors}
          multiline
        />
      </Card>

      <SectionLabel text="Social Media Policy" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={SOCIAL_MEDIA_OPTIONS}
          selected={plan.socialMediaPolicy}
          onSelect={(value) => onChange({ socialMediaPolicy: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="New Partner Introduction" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <OptionChipRow
          options={PARTNER_INTRO_OPTIONS}
          selected={plan.newPartnerIntroduction}
          onSelect={(value) => onChange({ newPartnerIntroduction: value })}
          colors={colors}
        />
      </Card>

      <SectionLabel text="Additional Agreements" colors={colors} />
      <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
        <LabeledInput
          label="Free-Text Provisions"
          value={plan.additionalTerms}
          onChangeText={(text) => onChange({ additionalTerms: text })}
          placeholder="Enter any additional agreements here..."
          colors={colors}
          multiline
        />
      </Card>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 8: Review & Export
// ---------------------------------------------------------------------------

interface ReviewSectionProps {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  colors: ColorPalette;
  children: React.ReactNode;
}

function ReviewSection({ title, stepIndex, onEdit, colors, children }: ReviewSectionProps) {
  return (
    <Card style={[styles.stepCard, { backgroundColor: colors.card }]}>
      <View style={styles.reviewSectionHeader}>
        <Text style={[styles.reviewSectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => onEdit(stepIndex)}
          style={[styles.editButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.7}
        >
          <Icon name="edit-2" size={14} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
      {children}
    </Card>
  );
}

interface ReviewLineProps {
  label: string;
  value: string;
  colors: ColorPalette;
}

function ReviewLine({ label, value, colors }: ReviewLineProps) {
  return (
    <View style={styles.reviewLine}>
      <Text style={[styles.reviewLineLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.reviewLineValue, { color: colors.foreground }]}>
        {value || "Not set"}
      </Text>
    </View>
  );
}

interface StepReviewProps {
  plan: ParentingPlan;
  onEdit: (step: number) => void;
  onSave: () => void;
  onShare: () => void;
  colors: ColorPalette;
}

function StepReview({ plan, onEdit, onSave, onShare, colors }: StepReviewProps) {
  return (
    <View>
      {/* Section 1: Children & Parents */}
      <ReviewSection title="Children & Parents" stepIndex={0} onEdit={onEdit} colors={colors}>
        <ReviewLine label="Parent A" value={plan.parentAName} colors={colors} />
        <ReviewLine label="Parent B" value={plan.parentBName} colors={colors} />
        <ReviewLine
          label="Children"
          value={plan.childrenNames.join(", ")}
          colors={colors}
        />
        <ReviewLine label="Effective Date" value={plan.effectiveDate} colors={colors} />
      </ReviewSection>

      {/* Section 2: Custody Schedule */}
      <ReviewSection title="Custody Schedule" stepIndex={1} onEdit={onEdit} colors={colors}>
        <ReviewLine label="Arrangement" value={plan.custodyArrangement} colors={colors} />
        <ReviewLine
          label="Primary Residence"
          value={formatParentLabel(plan.primaryResidence, plan)}
          colors={colors}
        />
        <ReviewLine label="Weekdays" value={plan.weekdaySchedule} colors={colors} />
        <ReviewLine label="Weekends" value={plan.weekendSchedule} colors={colors} />
      </ReviewSection>

      {/* Section 3: Holidays */}
      <ReviewSection title="Holidays & Special Days" stepIndex={2} onEdit={onEdit} colors={colors}>
        {Object.entries(plan.holidays).map(([holiday, assignment]) => (
          <ReviewLine
            key={holiday}
            label={holiday}
            value={formatHolidayAssignment(assignment, plan)}
            colors={colors}
          />
        ))}
        <ReviewLine label="Birthdays" value={plan.birthdayHandling} colors={colors} />
      </ReviewSection>

      {/* Section 4: Decisions */}
      <ReviewSection title="Decision Making" stepIndex={3} onEdit={onEdit} colors={colors}>
        {Object.entries(plan.decisions).map(([category, assignment]) => (
          <ReviewLine
            key={category}
            label={category}
            value={formatDecisionAssignment(assignment, plan)}
            colors={colors}
          />
        ))}
      </ReviewSection>

      {/* Section 5: Communication */}
      <ReviewSection title="Communication Rules" stepIndex={4} onEdit={onEdit} colors={colors}>
        <ReviewLine label="Method" value={plan.communicationMethod} colors={colors} />
        <ReviewLine label="Response Time" value={plan.responseTime} colors={colors} />
        <ReviewLine label="Video Calls" value={plan.videoCallSchedule} colors={colors} />
        <ReviewLine
          label="Right of First Refusal"
          value={plan.rightOfFirstRefusal ? "Yes" : "No"}
          colors={colors}
        />
      </ReviewSection>

      {/* Section 6: Exchange */}
      <ReviewSection title="Exchange Details" stepIndex={5} onEdit={onEdit} colors={colors}>
        <ReviewLine label="Primary Location" value={plan.exchangeLocation} colors={colors} />
        <ReviewLine label="Backup Location" value={plan.backupLocation} colors={colors} />
        <ReviewLine label="Time" value={plan.exchangeTime} colors={colors} />
        <ReviewLine
          label="Transportation"
          value={plan.transportationResponsibility}
          colors={colors}
        />
        <ReviewLine
          label="Grace Period"
          value={`${plan.gracePeriodMinutes} minutes`}
          colors={colors}
        />
        <ReviewLine
          label="Document Exchanges"
          value={plan.documentExchanges ? "Yes" : "No"}
          colors={colors}
        />
      </ReviewSection>

      {/* Section 7: Additional */}
      <ReviewSection title="Additional Terms" stepIndex={6} onEdit={onEdit} colors={colors}>
        <ReviewLine
          label="Relocation Clause"
          value={plan.relocationClause ? "Yes" : "No"}
          colors={colors}
        />
        {plan.relocationClause && (
          <ReviewLine
            label="Distance Limit"
            value={plan.relocationDistanceLimit}
            colors={colors}
          />
        )}
        <ReviewLine label="Passport" value={plan.passportHandling} colors={colors} />
        <ReviewLine label="Pet Custody" value={plan.petCustody} colors={colors} />
        <ReviewLine label="Social Media" value={plan.socialMediaPolicy} colors={colors} />
        <ReviewLine
          label="New Partner"
          value={plan.newPartnerIntroduction}
          colors={colors}
        />
        {plan.additionalTerms ? (
          <ReviewLine
            label="Additional"
            value={plan.additionalTerms}
            colors={colors}
          />
        ) : null}
      </ReviewSection>

      {/* Action buttons */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: colors.primary }]}
          onPress={onSave}
          activeOpacity={0.8}
        >
          <Icon name="save" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
            Save Plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryAction, { borderColor: colors.primary }]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Icon name="share-2" size={18} color={colors.primary} />
          <Text style={[styles.secondaryActionText, { color: colors.primary }]}>
            Share Plan
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  colors: ColorPalette;
}

function ProgressBar({ currentStep, totalSteps, colors }: ProgressBarProps) {
  const progressFraction = (currentStep + 1) / totalSteps;

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${progressFraction * 100}%` },
          ]}
        />
      </View>
      <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
        Step {currentStep + 1} of {totalSteps}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Draft Picker Modal
// ---------------------------------------------------------------------------

interface DraftPickerProps {
  visible: boolean;
  drafts: ParentingPlan[];
  onSelectDraft: (plan: ParentingPlan) => void;
  onNewPlan: () => void;
  onDismiss: () => void;
  colors: ColorPalette;
}

function DraftPicker({
  visible,
  drafts,
  onSelectDraft,
  onNewPlan,
  onDismiss,
  colors,
}: DraftPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Parenting Plan
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
            Continue a draft or start fresh.
          </Text>

          {drafts.map((draft) => (
            <TouchableOpacity
              key={draft.id}
              style={[styles.draftRow, { borderColor: colors.border }]}
              onPress={() => onSelectDraft(draft)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.draftTitle, { color: colors.foreground }]}>
                  {draft.parentAName && draft.parentBName
                    ? `${draft.parentAName} & ${draft.parentBName}`
                    : "Untitled Plan"}
                </Text>
                <Text style={[styles.draftDate, { color: colors.mutedForeground }]}>
                  Last edited: {new Date(draft.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.newPlanButton, { backgroundColor: colors.primary }]}
            onPress={onNewPlan}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.newPlanButtonText, { color: colors.primaryForeground }]}>
              New Plan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.dismissButtonText, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ParentingPlanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [currentStep, setCurrentStep] = useState(0);
  const [plan, setPlan] = useState<ParentingPlan>(createEmptyPlan);
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [drafts, setDrafts] = useState<ParentingPlan[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    const saved = await loadPlansFromStorage();
    const draftPlans = saved.filter((p) => p.status === "draft");
    setDrafts(draftPlans);

    if (draftPlans.length > 0) {
      setShowDraftPicker(true);
    }
    setIsInitialized(true);
  };

  // Auto-save draft on step change
  const autoSaveDraft = useCallback(async (planToSave: ParentingPlan) => {
    await saveSinglePlan(planToSave);
  }, []);

  const handleChange = useCallback(
    (partial: Partial<ParentingPlan>) => {
      setPlan((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const goToStep = useCallback(
    (step: number) => {
      ReactNativeHapticFeedback.trigger("impactLight");
      autoSaveDraft(plan);
      setCurrentStep(step);
    },
    [plan, autoSaveDraft]
  );

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const handleSavePlan = useCallback(async () => {
    ReactNativeHapticFeedback.trigger("notificationSuccess");
    const completed = { ...plan, status: "completed" as const };
    setPlan(completed);
    await saveSinglePlan(completed);
    Alert.alert("Plan Saved", "Your parenting plan has been saved successfully.");
  }, [plan]);

  const handleSharePlan = useCallback(async () => {
    ReactNativeHapticFeedback.trigger("impactLight");
    const text = buildPlanSummaryText(plan);
    try {
      await Share.share({ message: text, title: "Parenting Plan" });
    } catch {
      Alert.alert("Error", "Could not open the share dialog.");
    }
  }, [plan]);

  const handleSelectDraft = useCallback((draft: ParentingPlan) => {
    setPlan(draft);
    setShowDraftPicker(false);
  }, []);

  const handleNewPlan = useCallback(() => {
    setPlan(createEmptyPlan());
    setCurrentStep(0);
    setShowDraftPicker(false);
  }, []);

  const handleDismissDraftPicker = useCallback(() => {
    setShowDraftPicker(false);
  }, []);

  const handleEditFromReview = useCallback(
    (stepIndex: number) => {
      goToStep(stepIndex);
    },
    [goToStep]
  );

  // Render the current step content
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <StepChildrenParents plan={plan} onChange={handleChange} colors={colors} />
        );
      case 1:
        return (
          <StepCustodySchedule plan={plan} onChange={handleChange} colors={colors} />
        );
      case 2:
        return (
          <StepHolidays plan={plan} onChange={handleChange} colors={colors} />
        );
      case 3:
        return (
          <StepDecisionMaking plan={plan} onChange={handleChange} colors={colors} />
        );
      case 4:
        return (
          <StepCommunication plan={plan} onChange={handleChange} colors={colors} />
        );
      case 5:
        return (
          <StepExchange plan={plan} onChange={handleChange} colors={colors} />
        );
      case 6:
        return (
          <StepAdditionalTerms plan={plan} onChange={handleChange} colors={colors} />
        );
      case 7:
        return (
          <StepReview
            plan={plan}
            onEdit={handleEditFromReview}
            onSave={handleSavePlan}
            onShare={handleSharePlan}
            colors={colors}
          />
        );
      default:
        return null;
    }
  }, [currentStep, plan, colors, handleChange, handleEditFromReview, handleSavePlan, handleSharePlan]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitleColumn}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Parenting Plan
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress */}
        <ProgressBar
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          colors={colors}
        />

        {/* Step heading */}
        <View style={styles.stepHeading}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            {STEP_TITLES[currentStep]}
          </Text>
          <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
            {STEP_DESCRIPTIONS[currentStep]}
          </Text>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepContent}
        </ScrollView>

        {/* Navigation footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={goBack}
            style={[
              styles.navButton,
              { backgroundColor: colors.muted },
              isFirstStep && styles.navButtonDisabled,
            ]}
            disabled={isFirstStep}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <Icon
              name="arrow-left"
              size={18}
              color={isFirstStep ? colors.border : colors.foreground}
            />
            <Text
              style={[
                styles.navButtonText,
                { color: isFirstStep ? colors.border : colors.foreground },
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          {!isLastStep && (
            <TouchableOpacity
              onPress={goNext}
              style={[styles.navButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Next step"
            >
              <Text style={[styles.navButtonText, { color: colors.primaryForeground }]}>
                Next
              </Text>
              <Icon name="arrow-right" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Draft picker modal */}
      <DraftPicker
        visible={showDraftPicker}
        drafts={drafts}
        onSelectDraft={handleSelectDraft}
        onNewPlan={handleNewPlan}
        onDismiss={handleDismissDraftPicker}
        colors={colors}
      />
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
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleColumn: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },

  // Progress bar
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },

  // Step heading
  stepHeading: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Scroll area
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Cards shared
  stepCard: {
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
  },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  // Chip row
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Three-way toggle
  threeWayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  threeWayLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  threeWayOptions: {
    flexDirection: "row",
    gap: 6,
  },
  threeWayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  threeWayChipText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Input
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Switch row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  switchTextColumn: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  // Step 1 children
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  childName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  emptyHint: {
    fontSize: 14,
    paddingVertical: 10,
  },
  addChildButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
  },
  addChildText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Step 2 custody preview
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  previewDayColumn: {
    flex: 1,
    alignItems: "center",
  },
  previewDayLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
  },
  previewBlock: {
    width: "100%",
    height: 36,
    borderRadius: 6,
  },
  previewLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Step 3 auto-assign info
  autoAssignRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
  },
  autoAssignText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // Step 8 review
  reviewSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  reviewLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  reviewLineLabel: {
    fontSize: 13,
    flex: 1,
  },
  reviewLineValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  reviewActions: {
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Navigation footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Draft picker modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  draftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  draftDate: {
    fontSize: 12,
    marginTop: 3,
  },
  newPlanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  newPlanButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  dismissButton: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

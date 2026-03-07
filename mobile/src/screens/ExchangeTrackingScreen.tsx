import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Alert,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Share,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "../theme/useTheme";
import { useAuth } from "../auth/useAuth";
import { useChildren } from "../hooks/useChildren";
import Card from "../components/ui/Card";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "@exchange_logs";
const EXCHANGE_TYPE_DROPOFF = "dropoff" as const;
const EXCHANGE_TYPE_PICKUP = "pickup" as const;
const STATUS_ONTIME = "ontime" as const;
const STATUS_LATE = "late" as const;
const STATUS_MISSED = "missed" as const;

const DROPOFF_COLOR = "#0d9488";
const PICKUP_COLOR = "#F97316";

const STATUS_BADGE_COLORS = {
  [STATUS_ONTIME]: { background: "#D1FAE5", text: "#065F46" },
  [STATUS_LATE]: { background: "#FEF3C7", text: "#92400E" },
  [STATUS_MISSED]: { background: "#FEE2E2", text: "#991B1B" },
} as const;

const STATUS_LABELS = {
  [STATUS_ONTIME]: "On Time",
  [STATUS_LATE]: "Late",
  [STATUS_MISSED]: "Missed",
} as const;

type FilterOption = "all" | "dropoffs" | "pickups" | "month" | "quarter";

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dropoffs", label: "Drop-offs" },
  { key: "pickups", label: "Pick-ups" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "Last 3 Months" },
];

type SortOption = "newest" | "oldest";

// ---------------------------------------------------------------------------
// Data Model
// ---------------------------------------------------------------------------

interface ExchangeLog {
  id: string;
  timestamp: string;
  type: "dropoff" | "pickup";
  fromParent: string;
  toParent: string;
  children: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  status: "ontime" | "late" | "missed";
  notes: string;
  photoUri?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatAbsoluteDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function isWithinCurrentMonth(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isWithinLastThreeMonths(isoString: string): boolean {
  const date = new Date(isoString);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return date >= threeMonthsAgo;
}

function calculateOnTimeRate(logs: ExchangeLog[]): number {
  if (logs.length === 0) return 100;
  const onTimeCount = logs.filter((log) => log.status === STATUS_ONTIME).length;
  return Math.round((onTimeCount / logs.length) * 100);
}

function buildExportText(logs: ExchangeLog[]): string {
  const header = `CUSTODY EXCHANGE LOG\nGenerated: ${formatAbsoluteDate(new Date().toISOString())}\n`;
  const divider = "---";

  const entries = logs.map((log, index) => {
    const typeLabel = log.type === EXCHANGE_TYPE_DROPOFF ? "Drop-off" : "Pick-up";
    const childrenList = log.children.join(", ");
    const coordinates = formatCoordinates(log.latitude, log.longitude);
    const statusLabel = STATUS_LABELS[log.status];
    const notesLine = log.notes ? `Notes: ${log.notes}` : "";

    return [
      `Exchange #${index + 1}`,
      `Date: ${formatAbsoluteDate(log.timestamp)}`,
      `Type: ${typeLabel}`,
      `From: ${log.fromParent} → ${log.toParent}`,
      `Children: ${childrenList}`,
      `Location: ${coordinates}`,
      `Status: ${statusLabel}`,
      notesLine,
      divider,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [header, ...entries].join("\n\n");
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function loadExchangeLogs(): Promise<ExchangeLog[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveExchangeLogs(logs: ExchangeLog[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

interface TypeBadgeProps {
  type: "dropoff" | "pickup";
}

function TypeBadge({ type }: TypeBadgeProps) {
  const isDropoff = type === EXCHANGE_TYPE_DROPOFF;
  const label = isDropoff ? "Drop-off" : "Pick-up";
  const color = isDropoff ? DROPOFF_COLOR : PICKUP_COLOR;

  return (
    <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.typeBadgeText, { color }]}>{label}</Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: "ontime" | "late" | "missed";
}

function StatusBadge({ status }: StatusBadgeProps) {
  const badgeColor = STATUS_BADGE_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: badgeColor.background }]}>
      <Text style={[styles.statusBadgeText, { color: badgeColor.text }]}>
        {label}
      </Text>
    </View>
  );
}

interface LocationPreviewProps {
  latitude: number;
  longitude: number;
  type: "dropoff" | "pickup";
  foregroundColor: string;
  mutedColor: string;
  borderColor: string;
}

function LocationPreview({
  latitude,
  longitude,
  type,
  foregroundColor,
  mutedColor,
  borderColor,
}: LocationPreviewProps) {
  const pinColor = type === EXCHANGE_TYPE_DROPOFF ? DROPOFF_COLOR : PICKUP_COLOR;

  return (
    <View style={[styles.mapPreview, { borderColor }]}>
      <View style={[styles.mapPin, { backgroundColor: pinColor }]} />
      <Text style={[styles.mapCoordinates, { color: mutedColor }]}>
        {formatCoordinates(latitude, longitude)}
      </Text>
    </View>
  );
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  primaryColor: string;
  primaryForegroundColor: string;
  mutedColor: string;
  mutedForegroundColor: string;
}

function FilterChip({
  label,
  isActive,
  onPress,
  primaryColor,
  primaryForegroundColor,
  mutedColor,
  mutedForegroundColor,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor: mutedColor },
        isActive && { backgroundColor: primaryColor },
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: mutedForegroundColor },
          isActive && { color: primaryForegroundColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  accentColor: string;
  cardColor: string;
  foregroundColor: string;
  mutedForegroundColor: string;
}

function StatCard({
  title,
  value,
  accentColor,
  cardColor,
  foregroundColor,
  mutedForegroundColor,
}: StatCardProps) {
  return (
    <Card style={[styles.statCard, { backgroundColor: cardColor }]}>
      <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
      <Text style={[styles.statValue, { color: foregroundColor }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: mutedForegroundColor }]}>
        {title}
      </Text>
    </Card>
  );
}

interface ExchangeCardProps {
  log: ExchangeLog;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ExchangeCard({ log, colors }: ExchangeCardProps) {
  const borderColor =
    log.type === EXCHANGE_TYPE_DROPOFF ? DROPOFF_COLOR : PICKUP_COLOR;

  return (
    <View
      style={[
        styles.exchangeCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftColor: borderColor,
        },
      ]}
      accessibilityRole="summary"
    >
      <ExchangeCardHeader log={log} foregroundColor={colors.foreground} />
      <ExchangeCardMeta log={log} mutedColor={colors.mutedForeground} />
      <ExchangeCardChildren
        children={log.children}
        mutedColor={colors.mutedForeground}
      />
      <ExchangeCardNotes notes={log.notes} mutedColor={colors.mutedForeground} />
      <LocationPreview
        latitude={log.latitude}
        longitude={log.longitude}
        type={log.type}
        foregroundColor={colors.foreground}
        mutedColor={colors.mutedForeground}
        borderColor={colors.border}
      />
    </View>
  );
}

interface ExchangeCardHeaderProps {
  log: ExchangeLog;
  foregroundColor: string;
}

function ExchangeCardHeader({ log, foregroundColor }: ExchangeCardHeaderProps) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        <Text style={[styles.cardDate, { color: foregroundColor }]}>
          {formatAbsoluteDate(log.timestamp)}
        </Text>
        <Text style={styles.cardRelativeTime}>
          {formatRelativeTime(log.timestamp)}
        </Text>
      </View>
      <View style={styles.cardBadges}>
        <TypeBadge type={log.type} />
        <StatusBadge status={log.status} />
      </View>
    </View>
  );
}

interface ExchangeCardMetaProps {
  log: ExchangeLog;
  mutedColor: string;
}

function ExchangeCardMeta({ log, mutedColor }: ExchangeCardMetaProps) {
  return (
    <View style={styles.cardMeta}>
      <Icon name="users" size={14} color={mutedColor} />
      <Text style={[styles.cardMetaText, { color: mutedColor }]}>
        {log.fromParent} → {log.toParent}
      </Text>
    </View>
  );
}

interface ExchangeCardChildrenProps {
  children: string[];
  mutedColor: string;
}

function ExchangeCardChildren({
  children: childNames,
  mutedColor,
}: ExchangeCardChildrenProps) {
  return (
    <View style={styles.cardMeta}>
      <Icon name="heart" size={14} color={mutedColor} />
      <Text style={[styles.cardMetaText, { color: mutedColor }]}>
        {childNames.join(", ")}
      </Text>
    </View>
  );
}

interface ExchangeCardNotesProps {
  notes: string;
  mutedColor: string;
}

function ExchangeCardNotes({ notes, mutedColor }: ExchangeCardNotesProps) {
  if (!notes) return null;

  return (
    <View style={styles.cardNotes}>
      <Icon name="file-text" size={14} color={mutedColor} />
      <Text
        style={[styles.cardNotesText, { color: mutedColor }]}
        numberOfLines={2}
      >
        {notes}
      </Text>
    </View>
  );
}

interface EmptyStateProps {
  borderColor: string;
  mutedForegroundColor: string;
}

function EmptyState({ borderColor, mutedForegroundColor }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Icon name="map-pin" size={56} color={borderColor} />
      <Text style={[styles.emptyTitle, { color: mutedForegroundColor }]}>
        No exchanges recorded yet
      </Text>
      <Text style={[styles.emptySubtext, { color: mutedForegroundColor }]}>
        Record your first exchange to start building a documented history for
        court records.
      </Text>
    </View>
  );
}

interface ChildCheckboxProps {
  name: string;
  isSelected: boolean;
  onToggle: () => void;
  primaryColor: string;
  foregroundColor: string;
  borderColor: string;
}

function ChildCheckbox({
  name,
  isSelected,
  onToggle,
  primaryColor,
  foregroundColor,
  borderColor,
}: ChildCheckboxProps) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.checkboxRow}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`Select ${name}`}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor },
          isSelected && { backgroundColor: primaryColor, borderColor: primaryColor },
        ]}
      >
        {isSelected && <Icon name="check" size={14} color="#FFFFFF" />}
      </View>
      <Text style={[styles.checkboxLabel, { color: foregroundColor }]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

interface ToggleButtonProps {
  options: { key: string; label: string }[];
  selectedKey: string;
  onSelect: (key: string) => void;
  primaryColor: string;
  primaryForegroundColor: string;
  mutedColor: string;
  mutedForegroundColor: string;
}

function ToggleButton({
  options,
  selectedKey,
  onSelect,
  primaryColor,
  primaryForegroundColor,
  mutedColor,
  mutedForegroundColor,
}: ToggleButtonProps) {
  return (
    <View style={[styles.toggleContainer, { backgroundColor: mutedColor }]}>
      {options.map((option) => {
        const isActive = option.key === selectedKey;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[
              styles.toggleOption,
              isActive && { backgroundColor: primaryColor },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.toggleOptionText,
                { color: mutedForegroundColor },
                isActive && { color: primaryForegroundColor },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Check-In Modal
// ---------------------------------------------------------------------------

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (log: ExchangeLog) => void;
  latitude: number;
  longitude: number;
  accuracy: number;
  parentAName: string;
  parentBName: string;
  childrenNames: string[];
  colors: ReturnType<typeof useTheme>["colors"];
}

function CheckInModal({
  visible,
  onClose,
  onSave,
  latitude,
  longitude,
  accuracy,
  parentAName,
  parentBName,
  childrenNames,
  colors,
}: CheckInModalProps) {
  const [exchangeType, setExchangeType] = useState<"dropoff" | "pickup">(
    EXCHANGE_TYPE_DROPOFF,
  );
  const [isHandingOff, setIsHandingOff] = useState(true);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"ontime" | "late">(STATUS_ONTIME);

  useEffect(() => {
    if (visible) {
      resetFormState();
    }
  }, [visible]);

  function resetFormState() {
    setExchangeType(EXCHANGE_TYPE_DROPOFF);
    setIsHandingOff(true);
    setSelectedChildren([]);
    setNotes("");
    setStatus(STATUS_ONTIME);
  }

  function toggleChildSelection(childName: string) {
    setSelectedChildren((prev) =>
      prev.includes(childName)
        ? prev.filter((name) => name !== childName)
        : [...prev, childName],
    );
  }

  function buildExchangeLog(): ExchangeLog {
    const fromParent = isHandingOff ? parentAName : parentBName;
    const toParent = isHandingOff ? parentBName : parentAName;

    return {
      id: generateId(),
      timestamp: new Date().toISOString(),
      type: exchangeType,
      fromParent,
      toParent,
      children: selectedChildren,
      latitude,
      longitude,
      accuracy,
      address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`,
      status,
      notes: notes.trim(),
    };
  }

  function handleConfirm() {
    if (selectedChildren.length === 0) {
      Alert.alert("Select Children", "Please select at least one child.");
      return;
    }

    const log = buildExchangeLog();
    onSave(log);
  }

  const directionLabel = isHandingOff
    ? `I'm handing off to ${parentBName}`
    : `I'm receiving from ${parentBName}`;

  const coordinatesDisplay = `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`;
  const timestampDisplay = formatAbsoluteDate(new Date().toISOString());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ModalHeader onClose={onClose} colors={colors} />
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormSection
            label="Exchange Type"
            colors={colors}
          >
            <ToggleButton
              options={[
                { key: EXCHANGE_TYPE_DROPOFF, label: "Drop-off" },
                { key: EXCHANGE_TYPE_PICKUP, label: "Pick-up" },
              ]}
              selectedKey={exchangeType}
              onSelect={(key) => setExchangeType(key as "dropoff" | "pickup")}
              primaryColor={colors.primary}
              primaryForegroundColor={colors.primaryForeground}
              mutedColor={colors.muted}
              mutedForegroundColor={colors.mutedForeground}
            />
          </FormSection>

          <FormSection label="Direction" colors={colors}>
            <ToggleButton
              options={[
                { key: "handoff", label: `Handing off` },
                { key: "receiving", label: `Receiving` },
              ]}
              selectedKey={isHandingOff ? "handoff" : "receiving"}
              onSelect={(key) => setIsHandingOff(key === "handoff")}
              primaryColor={colors.primary}
              primaryForegroundColor={colors.primaryForeground}
              mutedColor={colors.muted}
              mutedForegroundColor={colors.mutedForeground}
            />
            <Text style={[styles.directionHint, { color: colors.mutedForeground }]}>
              {directionLabel}
            </Text>
          </FormSection>

          <FormSection label="Children" colors={colors}>
            {childrenNames.length === 0 ? (
              <Text style={[styles.noChildrenText, { color: colors.mutedForeground }]}>
                No children found. Add children in Settings.
              </Text>
            ) : (
              childrenNames.map((name) => (
                <ChildCheckbox
                  key={name}
                  name={name}
                  isSelected={selectedChildren.includes(name)}
                  onToggle={() => toggleChildSelection(name)}
                  primaryColor={colors.primary}
                  foregroundColor={colors.foreground}
                  borderColor={colors.border}
                />
              ))
            )}
          </FormSection>

          <FormSection label="Location" colors={colors}>
            <View style={[styles.locationInfo, { backgroundColor: colors.muted }]}>
              <Icon name="map-pin" size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.foreground }]}>
                {coordinatesDisplay}
              </Text>
            </View>
            <Text style={[styles.accuracyText, { color: colors.mutedForeground }]}>
              Accuracy: {accuracy.toFixed(0)}m
            </Text>
          </FormSection>

          <FormSection label="On-Time Status" colors={colors}>
            <ToggleButton
              options={[
                { key: STATUS_ONTIME, label: "On Time" },
                { key: STATUS_LATE, label: "Late" },
              ]}
              selectedKey={status}
              onSelect={(key) => setStatus(key as "ontime" | "late")}
              primaryColor={colors.primary}
              primaryForegroundColor={colors.primaryForeground}
              mutedColor={colors.muted}
              mutedForegroundColor={colors.mutedForeground}
            />
          </FormSection>

          <FormSection label="Notes (Optional)" colors={colors}>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add notes about this exchange..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </FormSection>

          <FormSection label="Photo" colors={colors}>
            <TouchableOpacity
              style={[styles.photoButton, { borderColor: colors.border }]}
              disabled
              activeOpacity={0.5}
              accessibilityRole="button"
              accessibilityLabel="Attach photo (coming soon)"
            >
              <Icon name="camera" size={20} color={colors.mutedForeground} />
              <Text style={[styles.photoButtonText, { color: colors.mutedForeground }]}>
                Attach Photo (Coming Soon)
              </Text>
            </TouchableOpacity>
          </FormSection>

          <FormSection label="Timestamp" colors={colors}>
            <View style={[styles.timestampDisplay, { backgroundColor: colors.muted }]}>
              <Icon name="clock" size={16} color={colors.mutedForeground} />
              <Text style={[styles.timestampText, { color: colors.foreground }]}>
                {timestampDisplay}
              </Text>
            </View>
          </FormSection>

          <TouchableOpacity
            onPress={handleConfirm}
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Confirm exchange"
          >
            <Icon name="check-circle" size={20} color={colors.primaryForeground} />
            <Text style={[styles.confirmButtonText, { color: colors.primaryForeground }]}>
              Confirm Exchange
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ModalHeaderProps {
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ModalHeader({ onClose, colors }: ModalHeaderProps) {
  return (
    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>
        Record Exchange
      </Text>
      <TouchableOpacity
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.muted }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <Icon name="x" size={20} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

interface FormSectionProps {
  label: string;
  colors: ReturnType<typeof useTheme>["colors"];
  children: React.ReactNode;
}

function FormSection({ label, colors, children }: FormSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text style={[styles.formLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ExchangeTrackingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { data: childrenData = [] } = useChildren();

  const [logs, setLogs] = useState<ExchangeLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sortOrder, setSortOrder] = useState<SortOption>("newest");
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 0,
    longitude: 0,
    accuracy: 0,
  });

  const parentAName = user?.parent_a_name ?? user?.display_name ?? "Parent A";
  const parentBName = user?.parent_b_name ?? "Parent B";
  const childrenNames = childrenData.map((child) => child.name);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setIsLoading(true);
    const storedLogs = await loadExchangeLogs();
    setLogs(storedLogs);
    setIsLoading(false);
  }

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    result = applyTypeFilter(result, filter);
    result = applyDateFilter(result, filter);
    result = applySortOrder(result, sortOrder);

    return result;
  }, [logs, filter, sortOrder]);

  const summaryStats = useMemo(() => {
    const totalExchanges = logs.length;
    const onTimeRate = calculateOnTimeRate(logs);
    const thisMonth = logs.filter((log) => isWithinCurrentMonth(log.timestamp)).length;

    return { totalExchanges, onTimeRate, thisMonth };
  }, [logs]);

  function requestLocationAndOpenModal() {
    setIsLocating(true);
    ReactNativeHapticFeedback.trigger("impactLight");

    Geolocation.requestAuthorization();
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLocating(false);
        setShowModal(true);
      },
      (error) => {
        setIsLocating(false);
        Alert.alert(
          "Location Error",
          "Unable to get your current location. Please enable location services and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  }

  async function handleSaveExchange(newLog: ExchangeLog) {
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    await saveExchangeLogs(updatedLogs);
    setShowModal(false);
    ReactNativeHapticFeedback.trigger("notificationSuccess");
  }

  async function handleExportLog() {
    if (logs.length === 0) {
      Alert.alert("No Data", "There are no exchanges to export.");
      return;
    }

    const exportText = buildExportText(logs);

    try {
      await Share.share({
        message: exportText,
        title: "Custody Exchange Log",
      });
    } catch {
      Alert.alert("Export Failed", "Unable to share the exchange log.");
    }
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <ScreenHeader
        onExport={handleExportLog}
        onSortToggle={toggleSortOrder}
        sortOrder={sortOrder}
        colors={colors}
      />

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExchangeCard log={item} colors={colors} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader
            isLocating={isLocating}
            onRecordExchange={requestLocationAndOpenModal}
            summaryStats={summaryStats}
            filter={filter}
            onFilterChange={setFilter}
            colors={colors}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <EmptyState
              borderColor={colors.border}
              mutedForegroundColor={colors.mutedForeground}
            />
          )
        }
      />

      <CheckInModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveExchange}
        latitude={currentLocation.latitude}
        longitude={currentLocation.longitude}
        accuracy={currentLocation.accuracy}
        parentAName={parentAName}
        parentBName={parentBName}
        childrenNames={childrenNames}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Header & List Header Sub-Components
// ---------------------------------------------------------------------------

interface ScreenHeaderProps {
  onExport: () => void;
  onSortToggle: () => void;
  sortOrder: SortOption;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ScreenHeader({
  onExport,
  onSortToggle,
  sortOrder,
  colors,
}: ScreenHeaderProps) {
  const sortLabel = sortOrder === "newest" ? "Newest" : "Oldest";

  return (
    <View style={[styles.screenHeader, { borderBottomColor: colors.border }]}>
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>
        Exchange Tracking
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={onSortToggle}
          style={[styles.headerButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortLabel}`}
        >
          <Icon name="repeat" size={16} color={colors.mutedForeground} />
          <Text style={[styles.headerButtonText, { color: colors.mutedForeground }]}>
            {sortLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onExport}
          style={[styles.headerButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Export exchange log"
        >
          <Icon name="share" size={16} color={colors.mutedForeground} />
          <Text style={[styles.headerButtonText, { color: colors.mutedForeground }]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ListHeaderProps {
  isLocating: boolean;
  onRecordExchange: () => void;
  summaryStats: { totalExchanges: number; onTimeRate: number; thisMonth: number };
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ListHeader({
  isLocating,
  onRecordExchange,
  summaryStats,
  filter,
  onFilterChange,
  colors,
}: ListHeaderProps) {
  return (
    <View>
      <RecordExchangeButton
        isLocating={isLocating}
        onPress={onRecordExchange}
        primaryColor={colors.primary}
        primaryForegroundColor={colors.primaryForeground}
      />
      <SummaryStatsRow summaryStats={summaryStats} colors={colors} />
      <FilterBar
        filter={filter}
        onFilterChange={onFilterChange}
        colors={colors}
      />
    </View>
  );
}

interface RecordExchangeButtonProps {
  isLocating: boolean;
  onPress: () => void;
  primaryColor: string;
  primaryForegroundColor: string;
}

function RecordExchangeButton({
  isLocating,
  onPress,
  primaryColor,
  primaryForegroundColor,
}: RecordExchangeButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocating}
      style={[styles.recordButton, { backgroundColor: primaryColor }]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Record a custody exchange"
    >
      {isLocating ? (
        <ActivityIndicator size="small" color={primaryForegroundColor} />
      ) : (
        <Icon name="map-pin" size={22} color={primaryForegroundColor} />
      )}
      <Text style={[styles.recordButtonText, { color: primaryForegroundColor }]}>
        {isLocating ? "Getting Location..." : "Record Exchange"}
      </Text>
    </TouchableOpacity>
  );
}

interface SummaryStatsRowProps {
  summaryStats: { totalExchanges: number; onTimeRate: number; thisMonth: number };
  colors: ReturnType<typeof useTheme>["colors"];
}

function SummaryStatsRow({ summaryStats, colors }: SummaryStatsRowProps) {
  const summaryNote =
    summaryStats.totalExchanges > 0
      ? "All exchanges documented"
      : "No exchanges yet";

  return (
    <View style={styles.statsRow}>
      <StatCard
        title="Total"
        value={String(summaryStats.totalExchanges)}
        accentColor={DROPOFF_COLOR}
        cardColor={colors.card}
        foregroundColor={colors.foreground}
        mutedForegroundColor={colors.mutedForeground}
      />
      <StatCard
        title="On-Time"
        value={`${summaryStats.onTimeRate}%`}
        accentColor="#22C55E"
        cardColor={colors.card}
        foregroundColor={colors.foreground}
        mutedForegroundColor={colors.mutedForeground}
      />
      <StatCard
        title="This Month"
        value={String(summaryStats.thisMonth)}
        accentColor={PICKUP_COLOR}
        cardColor={colors.card}
        foregroundColor={colors.foreground}
        mutedForegroundColor={colors.mutedForeground}
      />
    </View>
  );
}

interface FilterBarProps {
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function FilterBar({ filter, onFilterChange, colors }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {FILTER_OPTIONS.map((option) => (
        <FilterChip
          key={option.key}
          label={option.label}
          isActive={filter === option.key}
          onPress={() => onFilterChange(option.key)}
          primaryColor={colors.primary}
          primaryForegroundColor={colors.primaryForeground}
          mutedColor={colors.muted}
          mutedForegroundColor={colors.mutedForeground}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Filter & Sort Helpers
// ---------------------------------------------------------------------------

function applyTypeFilter(
  logs: ExchangeLog[],
  filter: FilterOption,
): ExchangeLog[] {
  if (filter === "dropoffs") return logs.filter((l) => l.type === EXCHANGE_TYPE_DROPOFF);
  if (filter === "pickups") return logs.filter((l) => l.type === EXCHANGE_TYPE_PICKUP);
  return logs;
}

function applyDateFilter(
  logs: ExchangeLog[],
  filter: FilterOption,
): ExchangeLog[] {
  if (filter === "month") return logs.filter((l) => isWithinCurrentMonth(l.timestamp));
  if (filter === "quarter") return logs.filter((l) => isWithinLastThreeMonths(l.timestamp));
  return logs;
}

function applySortOrder(
  logs: ExchangeLog[],
  sortOrder: SortOption,
): ExchangeLog[] {
  return logs.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recordButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  exchangeCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardDate: {
    fontSize: 15,
    fontWeight: "600",
  },
  cardRelativeTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cardBadges: {
    flexDirection: "row",
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  cardMetaText: {
    fontSize: 13,
    fontWeight: "400",
  },
  cardNotes: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 8,
    paddingTop: 4,
  },
  cardNotesText: {
    fontSize: 13,
    fontStyle: "italic",
    flex: 1,
  },
  mapPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mapPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mapCoordinates: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  loaderContainer: {
    paddingTop: 60,
    alignItems: "center",
  },

  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  formSection: {
    marginTop: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  toggleOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  directionHint: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: "italic",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  noChildrenText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  accuracyText: {
    fontSize: 12,
    marginTop: 4,
  },
  notesInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    opacity: 0.5,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  timestampDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  timestampText: {
    fontSize: 14,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

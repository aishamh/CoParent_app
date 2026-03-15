import React, { useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
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

import { useChildren } from "../hooks/useChildren";
import {
  useChildInfoEntries,
  useCreateChildInfoEntry,
  useUpdateChildInfoEntry,
  useDeleteChildInfoEntry,
} from "../hooks/useChildInfo";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatRelative } from "../utils/formatDate";
import type { ChildInfoEntry, ChildInfoCategory } from "../types/schema";
import type { Child } from "../types/schema";

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

interface CategoryConfig {
  label: string;
  icon: string;
}

const CATEGORIES: Record<ChildInfoCategory, CategoryConfig> = {
  allergy: { label: "Allergies", icon: "alert-triangle" },
  dietary: { label: "Dietary", icon: "coffee" },
  routine: { label: "Routines", icon: "clock" },
  preference: { label: "Preferences", icon: "heart" },
  clothing: { label: "Clothing", icon: "shopping-bag" },
  emergency_contact: { label: "Emergency Contacts", icon: "phone" },
  important_date: { label: "Important Dates", icon: "calendar" },
  note: { label: "Notes", icon: "file-text" },
};

const CATEGORY_KEYS = Object.keys(CATEGORIES) as ChildInfoCategory[];

// ---------------------------------------------------------------------------
// Child Picker
// ---------------------------------------------------------------------------

interface ChildPickerProps {
  children: Child[];
  selectedId: number;
  onSelect: (id: number) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function ChildPicker({
  children: childList,
  selectedId,
  onSelect,
  colors,
}: ChildPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.childPickerContent}
      style={styles.childPicker}
    >
      {childList.map((child) => {
        const isSelected = child.id === selectedId;
        return (
          <TouchableOpacity
            key={child.id}
            onPress={() => onSelect(child.id)}
            style={[
              styles.childChip,
              {
                backgroundColor: isSelected ? colors.primary : colors.muted,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Select ${child.name}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.childChipText,
                { color: isSelected ? "#fff" : colors.foreground },
              ]}
            >
              {child.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Entry Row
// ---------------------------------------------------------------------------

interface EntryRowProps {
  entry: ChildInfoEntry;
  colors: ReturnType<typeof useTheme>["colors"];
  onEdit: () => void;
  onDelete: () => void;
}

function EntryRow({ entry, colors, onEdit, onDelete }: EntryRowProps) {
  const handleLongPress = () => {
    ReactNativeHapticFeedback.trigger("impactMedium");
    Alert.alert("Delete Entry", `Delete "${entry.label}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.entryRow, { borderBottomColor: colors.border }]}
      onPress={onEdit}
      onLongPress={handleLongPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${entry.label}: ${entry.value}`}
    >
      <View style={styles.entryContent}>
        <Text
          style={[styles.entryLabel, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {entry.label}
        </Text>
        <Text
          style={[styles.entryValue, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {entry.value}
        </Text>
      </View>
      <Text style={[styles.entryMeta, { color: colors.mutedForeground }]}>
        {formatRelative(entry.updated_at)}
      </Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

interface CategorySectionProps {
  category: ChildInfoCategory;
  entries: ChildInfoEntry[];
  colors: ReturnType<typeof useTheme>["colors"];
  onEdit: (entry: ChildInfoEntry) => void;
  onDelete: (entry: ChildInfoEntry) => void;
}

function CategorySection({
  category,
  entries,
  colors,
  onEdit,
  onDelete,
}: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const config = CATEGORIES[category];

  return (
    <View style={styles.categorySection}>
      <TouchableOpacity
        style={[styles.categoryHeader, { backgroundColor: colors.muted }]}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${config.label} section, ${entries.length} entries`}
      >
        <View style={styles.categoryHeaderLeft}>
          <Icon name={config.icon} size={16} color={colors.primary} />
          <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
            {config.label}
          </Text>
          <View
            style={[styles.countBadge, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.countText}>{entries.length}</Text>
          </View>
        </View>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>

      {expanded &&
        entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            colors={colors}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry)}
          />
        ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add/Edit Modal
// ---------------------------------------------------------------------------

interface EntryModalProps {
  visible: boolean;
  entry: ChildInfoEntry | null;
  onClose: () => void;
  onSubmit: (data: {
    category: ChildInfoCategory;
    label: string;
    value: string;
  }) => void;
  isLoading: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}

function EntryModal({
  visible,
  entry,
  onClose,
  onSubmit,
  isLoading,
  colors,
}: EntryModalProps) {
  const [category, setCategory] = useState<ChildInfoCategory>(
    entry?.category as ChildInfoCategory ?? "note",
  );
  const [label, setLabel] = useState(entry?.label ?? "");
  const [value, setValue] = useState(entry?.value ?? "");

  React.useEffect(() => {
    if (visible) {
      setCategory((entry?.category as ChildInfoCategory) ?? "note");
      setLabel(entry?.label ?? "");
      setValue(entry?.value ?? "");
    }
  }, [visible, entry]);

  const handleSubmit = () => {
    const trimmedLabel = label.trim();
    const trimmedValue = value.trim();
    if (!trimmedLabel || !trimmedValue) return;
    onSubmit({ category, label: trimmedLabel, value: trimmedValue });
  };

  const isValid = label.trim().length > 0 && value.trim().length > 0;
  const isEditing = entry !== null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {isEditing ? "Edit Entry" : "New Entry"}
          </Text>

          {/* Category picker */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryPicker}
          >
            {CATEGORY_KEYS.map((cat) => {
              const isSelected = cat === category;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.muted,
                    },
                  ]}
                >
                  <Icon
                    name={CATEGORIES[cat].icon}
                    size={12}
                    color={isSelected ? "#fff" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      { color: isSelected ? "#fff" : colors.foreground },
                    ]}
                  >
                    {CATEGORIES[cat].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Label input */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Label
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Peanut allergy"
            placeholderTextColor={colors.mutedForeground}
            value={label}
            onChangeText={setLabel}
            maxLength={100}
          />

          {/* Value input */}
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Details
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
              },
            ]}
            placeholder="e.g. Carries EpiPen in backpack"
            placeholderTextColor={colors.mutedForeground}
            value={value}
            onChangeText={setValue}
            multiline
            maxLength={1000}
          />

          {/* Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalButton}>
              <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isValid || isLoading}
              style={[
                styles.modalButton,
                styles.modalPrimaryButton,
                {
                  backgroundColor: isValid ? colors.primary : colors.muted,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryText}>
                  {isEditing ? "Save" : "Add"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ChildInfoBankScreen() {
  const { colors } = useTheme();
  const { data: childList, isLoading: loadingChildren } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChildInfoEntry | null>(null);

  const createEntry = useCreateChildInfoEntry();
  const updateEntry = useUpdateChildInfoEntry();
  const deleteEntry = useDeleteChildInfoEntry();

  // Auto-select first child when list loads
  React.useEffect(() => {
    if (childList?.length && selectedChildId === 0) {
      setSelectedChildId(childList[0].id);
    }
  }, [childList, selectedChildId]);

  const {
    data: entries,
    isLoading: loadingEntries,
    refetch,
  } = useChildInfoEntries(selectedChildId);

  useRefreshOnFocus(["childInfo", String(selectedChildId)]);

  // Group entries by category
  const groupedEntries = useMemo(() => {
    if (!entries?.length) return [];

    const grouped = new Map<ChildInfoCategory, ChildInfoEntry[]>();
    for (const entry of entries) {
      const cat = entry.category as ChildInfoCategory;
      const existing = grouped.get(cat) ?? [];
      existing.push(entry);
      grouped.set(cat, existing);
    }

    // Return in the order defined by CATEGORY_KEYS
    return CATEGORY_KEYS.filter((cat) => grouped.has(cat)).map((cat) => ({
      category: cat,
      entries: grouped.get(cat)!,
    }));
  }, [entries]);

  const handleCreateEntry = useCallback(
    (data: { category: ChildInfoCategory; label: string; value: string }) => {
      createEntry.mutate(
        {
          child_id: selectedChildId,
          category: data.category,
          label: data.label,
          value: data.value,
        },
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            setModalVisible(false);
            setEditingEntry(null);
          },
          onError: () => {
            Alert.alert("Error", "Failed to add entry. Please try again.");
          },
        },
      );
    },
    [createEntry, selectedChildId],
  );

  const handleUpdateEntry = useCallback(
    (data: { category: ChildInfoCategory; label: string; value: string }) => {
      if (!editingEntry) return;
      updateEntry.mutate(
        {
          id: editingEntry.id,
          childId: selectedChildId,
          data: {
            category: data.category,
            label: data.label,
            value: data.value,
          },
        },
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            setModalVisible(false);
            setEditingEntry(null);
          },
          onError: () => {
            Alert.alert("Error", "Failed to update entry. Please try again.");
          },
        },
      );
    },
    [updateEntry, editingEntry, selectedChildId],
  );

  const handleDeleteEntry = useCallback(
    (entry: ChildInfoEntry) => {
      deleteEntry.mutate(
        { id: entry.id, childId: selectedChildId },
        {
          onSuccess: () =>
            ReactNativeHapticFeedback.trigger("notificationSuccess"),
        },
      );
    },
    [deleteEntry, selectedChildId],
  );

  const handleEdit = useCallback((entry: ChildInfoEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingEntry(null);
    setModalVisible(true);
  }, []);

  const handleModalSubmit = useCallback(
    (data: { category: ChildInfoCategory; label: string; value: string }) => {
      if (editingEntry) {
        handleUpdateEntry(data);
      } else {
        handleCreateEntry(data);
      }
    },
    [editingEntry, handleCreateEntry, handleUpdateEntry],
  );

  const isLoading = loadingChildren || loadingEntries;
  const hasChildren = (childList?.length ?? 0) > 0;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {loadingChildren ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasChildren ? (
        <View style={styles.emptyState}>
          <Icon name="users" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No Children Added
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
          >
            Add children in your profile to start building their Info Bank.
          </Text>
        </View>
      ) : (
        <>
          {/* Child selector */}
          <ChildPicker
            children={childList ?? []}
            selectedId={selectedChildId}
            onSelect={setSelectedChildId}
            colors={colors}
          />

          {/* Info entries */}
          {loadingEntries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : groupedEntries.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.emptyState}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
            >
              <Icon name="book" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No Info Yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.mutedForeground },
                ]}
              >
                Tap + to add allergies, routines, preferences, and more.
              </Text>
            </ScrollView>
          ) : (
            <FlatList
              data={groupedEntries}
              keyExtractor={(item) => item.category}
              renderItem={({ item }) => (
                <CategorySection
                  category={item.category}
                  entries={item.entries}
                  colors={colors}
                  onEdit={handleEdit}
                  onDelete={handleDeleteEntry}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={refetch}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </>
      )}

      {/* FAB: Add Entry */}
      {hasChildren && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add new info entry"
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <EntryModal
        visible={modalVisible}
        entry={editingEntry}
        onClose={() => {
          setModalVisible(false);
          setEditingEntry(null);
        }}
        onSubmit={handleModalSubmit}
        isLoading={createEntry.isPending || updateEntry.isPending}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 80 },

  // Child picker
  childPicker: { flexGrow: 0 },
  childPickerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  childChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  childChipText: { fontSize: 14, fontWeight: "600" },

  // Category section
  categorySection: { marginBottom: 4 },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryTitle: { fontSize: 14, fontWeight: "700" },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  countText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Entry row
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  entryContent: { flex: 1, marginRight: 12 },
  entryLabel: { fontSize: 15, fontWeight: "600" },
  entryValue: { fontSize: 13, marginTop: 2 },
  entryMeta: { fontSize: 11 },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  categoryPicker: { marginBottom: 4, flexGrow: 0 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
  },
  catChipText: { fontSize: 12, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 20,
  },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalPrimaryButton: { minWidth: 80, alignItems: "center" },
  modalPrimaryText: { color: "#fff", fontWeight: "600" },
});

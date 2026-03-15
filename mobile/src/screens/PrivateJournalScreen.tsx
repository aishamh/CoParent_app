import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
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
import { format } from "date-fns";

import { useTheme } from "../theme/useTheme";
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from "../hooks/useJournal";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import Card from "../components/ui/Card";
import type {
  JournalEntry,
  JournalMood,
  InsertJournalEntry,
} from "../types/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOOD_EMOJIS: Record<string, string> = {
  positive: "\u{1F60A}",
  neutral: "\u{1F610}",
  concerned: "\u{1F61F}",
  negative: "\u{1F622}",
};

const MOOD_LABELS: Record<string, string> = {
  positive: "Positive",
  neutral: "Neutral",
  concerned: "Concerned",
  negative: "Negative",
};

const DEFAULT_MOOD_EMOJI = "\u{1F4DD}";

const MOOD_OPTIONS: JournalMood[] = [
  "positive",
  "neutral",
  "concerned",
  "negative",
];

const TAG_OPTIONS = [
  "custody",
  "behavior",
  "medical",
  "legal",
  "school",
] as const;

type JournalTag = (typeof TAG_OPTIONS)[number];

const TAG_COLORS: Record<JournalTag, string> = {
  custody: "#3B82F6",
  behavior: "#F59E0B",
  medical: "#EF4444",
  legal: "#8B5CF6",
  school: "#22C55E",
};

const CONTENT_PREVIEW_LENGTH = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMoodEmoji(mood: JournalMood | null): string {
  if (!mood) return DEFAULT_MOOD_EMOJI;
  return MOOD_EMOJIS[mood] ?? DEFAULT_MOOD_EMOJI;
}

function formatEntryDate(dateString: string): string {
  return format(new Date(dateString), "MMM d, yyyy");
}

function truncateContent(content: string): string {
  if (content.length <= CONTENT_PREVIEW_LENGTH) return content;
  return content.slice(0, CONTENT_PREVIEW_LENGTH) + "\u2026";
}

// ---------------------------------------------------------------------------
// MoodBadge
// ---------------------------------------------------------------------------

interface MoodBadgeProps {
  mood: JournalMood | null;
}

function MoodBadge({ mood }: MoodBadgeProps) {
  const emoji = getMoodEmoji(mood);
  const label = mood ? MOOD_LABELS[mood] : "Note";

  return (
    <View style={styles.moodBadge}>
      <Text style={styles.moodEmoji}>{emoji}</Text>
      <Text style={styles.moodLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TagPill
// ---------------------------------------------------------------------------

interface TagPillProps {
  tag: string;
}

function TagPill({ tag }: TagPillProps) {
  const color = TAG_COLORS[tag as JournalTag] ?? "#6B7280";

  return (
    <View style={[styles.tagPill, { backgroundColor: color + "1A" }]}>
      <Text style={[styles.tagPillText, { color }]}>{tag}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// JournalEntryCard
// ---------------------------------------------------------------------------

interface JournalEntryCardProps {
  entry: JournalEntry;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
  onDelete: () => void;
}

function JournalEntryCard({
  entry,
  colors,
  onPress,
  onDelete,
}: JournalEntryCardProps) {
  const handleLongPress = useCallback(() => {
    ReactNativeHapticFeedback.trigger("impactMedium");
    Alert.alert("Delete Entry", `Delete "${entry.title}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }, [entry.title, onDelete]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Journal entry: ${entry.title}`}
    >
      <Card style={[styles.entryCard, { backgroundColor: colors.card }]}>
        <View style={styles.entryHeader}>
          <MoodBadge mood={entry.mood} />
          <View style={styles.entryHeaderRight}>
            <Icon name="shield" size={12} color={colors.mutedForeground} />
            <Text
              style={[styles.entryDate, { color: colors.mutedForeground }]}
            >
              {formatEntryDate(entry.created_at)}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.entryTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {entry.title}
        </Text>

        <Text
          style={[styles.entryPreview, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {truncateContent(entry.content)}
        </Text>

        {entry.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {entry.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// EmptyJournalState
// ---------------------------------------------------------------------------

interface EmptyJournalStateProps {
  colors: ReturnType<typeof useTheme>["colors"];
  onAddEntry: () => void;
}

function EmptyJournalState({ colors, onAddEntry }: EmptyJournalStateProps) {
  return (
    <View style={styles.emptyState}>
      <Icon name="lock" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        Your Private Journal
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        A safe space for personal observations, concerns, and reflections.
        Every entry is timestamped with a cryptographic hash for integrity
        verification.
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={onAddEntry}
        accessibilityRole="button"
        accessibilityLabel="Add your first journal entry"
      >
        <Icon name="plus" size={18} color="#fff" />
        <Text style={styles.emptyButtonText}>Add Your First Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AddEntryModal
// ---------------------------------------------------------------------------

interface AddEntryModalProps {
  visible: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
  onSubmit: (data: InsertJournalEntry) => void;
  isLoading: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}

function AddEntryModal({
  visible,
  entry,
  onClose,
  onSubmit,
  isLoading,
  colors,
}: AddEntryModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  React.useEffect(() => {
    if (visible) {
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setMood(entry?.mood ?? null);
      setSelectedTags(entry?.tags ?? []);
    }
  }, [visible, entry]);

  const handleMoodSelect = useCallback((selected: JournalMood) => {
    ReactNativeHapticFeedback.trigger("selection");
    setMood((current) => (current === selected ? null : selected));
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    onSubmit({
      title: trimmedTitle,
      content: trimmedContent,
      mood,
      tags: selectedTags,
    });
  }, [title, content, mood, selectedTags, onSubmit]);

  const isValid = title.trim().length > 0 && content.trim().length > 0;
  const isEditing = entry !== null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {isEditing ? "Edit Entry" : "New Journal Entry"}
            </Text>

            {/* Title input */}
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              Title
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
              placeholder="What's this about?"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />

            {/* Content input */}
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              Content
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.contentInput,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Write your thoughts, observations, or concerns..."
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={10000}
            />

            {/* Mood picker */}
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              Mood
            </Text>
            <View style={styles.moodPickerRow}>
              {MOOD_OPTIONS.map((moodOption) => {
                const isSelected = mood === moodOption;
                return (
                  <TouchableOpacity
                    key={moodOption}
                    onPress={() => handleMoodSelect(moodOption)}
                    style={[
                      styles.moodPickerButton,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + "1A"
                          : colors.muted,
                        borderColor: isSelected
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Mood: ${MOOD_LABELS[moodOption]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={styles.moodPickerEmoji}>
                      {MOOD_EMOJIS[moodOption]}
                    </Text>
                    <Text
                      style={[
                        styles.moodPickerLabel,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {MOOD_LABELS[moodOption]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tag picker */}
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              Tags
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagPickerScroll}
            >
              {TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                const tagColor = TAG_COLORS[tag];
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => handleTagToggle(tag)}
                    style={[
                      styles.tagPickerChip,
                      {
                        backgroundColor: isSelected
                          ? tagColor + "1A"
                          : colors.muted,
                        borderColor: isSelected ? tagColor : "transparent",
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Tag: ${tag}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.tagPickerText,
                        {
                          color: isSelected ? tagColor : colors.mutedForeground,
                        },
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
                    {isEditing ? "Save" : "Add Entry"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// PrivateJournalScreen
// ---------------------------------------------------------------------------

export default function PrivateJournalScreen() {
  const { colors } = useTheme();
  const { data: entries, isLoading, refetch } = useJournalEntries();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useRefreshOnFocus(["journal"]);

  const handleAdd = useCallback(() => {
    setEditingEntry(null);
    setModalVisible(true);
  }, []);

  const handleEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingEntry(null);
  }, []);

  const handleDelete = useCallback(
    (entry: JournalEntry) => {
      deleteEntry.mutate(Number(entry.id), {
        onSuccess: () =>
          ReactNativeHapticFeedback.trigger("notificationSuccess"),
        onError: () =>
          Alert.alert("Error", "Failed to delete entry. Please try again."),
      });
    },
    [deleteEntry],
  );

  const handleCreateEntry = useCallback(
    (data: InsertJournalEntry) => {
      createEntry.mutate(data, {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          setModalVisible(false);
          setEditingEntry(null);
        },
        onError: () =>
          Alert.alert("Error", "Failed to create entry. Please try again."),
      });
    },
    [createEntry],
  );

  const handleUpdateEntry = useCallback(
    (data: InsertJournalEntry) => {
      if (!editingEntry) return;
      updateEntry.mutate(
        { id: Number(editingEntry.id), data },
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            setModalVisible(false);
            setEditingEntry(null);
          },
          onError: () =>
            Alert.alert("Error", "Failed to update entry. Please try again."),
        },
      );
    },
    [updateEntry, editingEntry],
  );

  const handleModalSubmit = useCallback(
    (data: InsertJournalEntry) => {
      if (editingEntry) {
        handleUpdateEntry(data);
      } else {
        handleCreateEntry(data);
      }
    },
    [editingEntry, handleCreateEntry, handleUpdateEntry],
  );

  const renderEntry = useCallback(
    ({ item }: { item: JournalEntry }) => (
      <JournalEntryCard
        entry={item}
        colors={colors}
        onPress={() => handleEdit(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [colors, handleEdit, handleDelete],
  );

  const keyExtractor = useCallback(
    (item: JournalEntry) => String(item.id),
    [],
  );

  const hasEntries = (entries?.length ?? 0) > 0;

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Icon name="lock" size={20} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Private Journal
          </Text>
        </View>
        <Text
          style={[styles.headerSubtitle, { color: colors.mutedForeground }]}
        >
          Only visible to you — entries are timestamped and integrity-verified
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !hasEntries ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyJournalState colors={colors} onAddEntry={handleAdd} />
        </ScrollView>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={renderEntry}
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

      {/* FAB */}
      {hasEntries && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
          accessibilityRole="button"
          accessibilityLabel="Add new journal entry"
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal */}
      <AddEntryModal
        visible={modalVisible}
        entry={editingEntry}
        onClose={handleCloseModal}
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
  listContent: { paddingHorizontal: 16, paddingBottom: 80, gap: 12 },
  emptyScrollContent: { flexGrow: 1 },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, lineHeight: 18 },

  // Entry card
  entryCard: {
    marginTop: 4,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  entryPreview: { fontSize: 14, lineHeight: 20 },
  entryDate: { fontSize: 12 },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  // Mood badge
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moodEmoji: { fontSize: 18 },
  moodLabel: { fontSize: 12, color: "#6B7280" },

  // Tag pill
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagPillText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

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
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  emptyButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },

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
  modalContent: {
    borderRadius: 16,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },

  // Mood picker
  moodPickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  moodPickerButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  moodPickerEmoji: { fontSize: 24 },
  moodPickerLabel: { fontSize: 10, fontWeight: "600", marginTop: 4 },

  // Tag picker
  tagPickerScroll: { marginBottom: 4, flexGrow: 0 },
  tagPickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1.5,
  },
  tagPickerText: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "capitalize",
  },

  // Modal actions
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

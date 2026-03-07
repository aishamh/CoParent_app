import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useReadingList,
  useCreateReadingListItem,
  useUpdateReadingListItem,
  useSchoolTasks,
  useCreateSchoolTask,
  useUpdateSchoolTask,
  useHandoverNotes,
  useCreateHandoverNote,
} from "../hooks/useEducation";
import { useChildren } from "../hooks/useChildren";
import { useCreateEvent } from "../hooks/useEvents";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatShortDate } from "../utils/formatDate";
import Card from "../components/ui/Card";
import type {
  Child,
  ReadingListItem,
  SchoolTask,
  HandoverNote,
} from "../types/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EducationTab = "goals" | "reading" | "tasks" | "handover";

interface EducationGoal {
  childId: number;
  freeText: string;
  academicTags: string[];
  lifeSkillTags: string[];
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  iconName: string;
  duration: string;
  location?: string;
  matchedGoal: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "education_goals";

const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  "in-progress": { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "in-progress",
  "in-progress": "completed",
  completed: "pending",
};

const ACADEMIC_TAG_OPTIONS = [
  "Math",
  "Reading",
  "Science",
  "Writing",
  "History",
  "Geography",
  "Languages",
  "Coding",
  "Art",
  "Music",
];

const LIFE_SKILL_TAG_OPTIONS = [
  "Cooking",
  "Time management",
  "Money skills",
  "Social skills",
  "Swimming",
  "Sport",
  "Nature",
  "Gardening",
  "Cleaning",
  "First aid",
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Math: { bg: "#DBEAFE", text: "#1D4ED8" },
  Reading: { bg: "#FEF3C7", text: "#B45309" },
  Nature: { bg: "#D1FAE5", text: "#047857" },
  Cooking: { bg: "#FFEDD5", text: "#C2410C" },
  Art: { bg: "#FCE7F3", text: "#BE185D" },
  Music: { bg: "#F3E8FF", text: "#7C3AED" },
  Swimming: { bg: "#CFFAFE", text: "#0E7490" },
  Sport: { bg: "#FEE2E2", text: "#DC2626" },
  Science: { bg: "#E0E7FF", text: "#4338CA" },
  Coding: { bg: "#EDE9FE", text: "#6D28D9" },
  Writing: { bg: "#CCFBF1", text: "#0F766E" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Math: "hash",
  Reading: "book-open",
  Nature: "sun",
  Cooking: "coffee",
  Art: "pen-tool",
  Music: "music",
  Swimming: "droplet",
  Sport: "award",
  Science: "zap",
  Coding: "terminal",
  Writing: "file-text",
};

// ---------------------------------------------------------------------------
// AI Suggestion Engine (rule-based, client-side)
// ---------------------------------------------------------------------------

interface SuggestionRule {
  keywords: string[];
  suggestions: Omit<AISuggestion, "id" | "matchedGoal">[];
}

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    keywords: ["math", "matte", "calculation", "numbers"],
    suggestions: [
      {
        title: "Visit Oslo Science Museum",
        description:
          "Interactive math exhibits that make learning fun with hands-on puzzles and geometry challenges.",
        category: "Math",
        iconName: "hash",
        duration: "2-3 hours",
        location: "Teknisk Museum, Oslo",
      },
      {
        title: "Math Puzzle Games Evening",
        description:
          "Spend an evening with Sudoku, tangrams, and logic puzzles. Builds problem-solving skills.",
        category: "Math",
        iconName: "hash",
        duration: "1-2 hours",
      },
      {
        title: "Grocery Store Math Challenge",
        description:
          "Turn grocery shopping into a math lesson: estimating totals and comparing unit prices.",
        category: "Math",
        iconName: "hash",
        duration: "1 hour",
        location: "Your local supermarket",
      },
    ],
  },
  {
    keywords: ["reading", "books", "literacy", "literature"],
    suggestions: [
      {
        title: "Library Visit at Deichman",
        description:
          "Explore the Deichman Bjorvika library with its children's section, reading nooks, and story-time events.",
        category: "Reading",
        iconName: "book-open",
        duration: "2-3 hours",
        location: "Deichman Bjorvika, Oslo",
      },
      {
        title: "Start a Family Book Club",
        description:
          "Pick a book together each month. Discuss characters, plot, and lessons learned.",
        category: "Reading",
        iconName: "book-open",
        duration: "Ongoing",
      },
      {
        title: "Audiobook & Nature Walk",
        description:
          "Combine a nature walk with listening to an audiobook together.",
        category: "Reading",
        iconName: "book-open",
        duration: "1-2 hours",
        location: "Nordmarka trails",
      },
    ],
  },
  {
    keywords: ["nature", "outdoor", "environment", "animals", "plants"],
    suggestions: [
      {
        title: "Nature Walk at Frognerparken",
        description:
          "Explore seasonal changes, identify trees and birds. Pack a nature journal for sketching.",
        category: "Nature",
        iconName: "sun",
        duration: "2-3 hours",
        location: "Frognerparken, Oslo",
      },
      {
        title: "Botanical Garden Visit",
        description:
          "Discover plants from around the world at the University Botanical Garden.",
        category: "Nature",
        iconName: "sun",
        duration: "1.5-2 hours",
        location: "Botanisk Hage, Toyen",
      },
    ],
  },
  {
    keywords: ["cooking", "baking", "food", "kitchen"],
    suggestions: [
      {
        title: "Kids Cooking Class",
        description:
          "Enrol in a local children's cooking class to learn basic kitchen skills and food safety.",
        category: "Cooking",
        iconName: "coffee",
        duration: "2 hours",
        location: "Baker Hansen, Oslo",
      },
      {
        title: "Bake Together Weekend",
        description:
          "Choose a recipe together, shop for ingredients, measure, mix, and bake.",
        category: "Cooking",
        iconName: "coffee",
        duration: "2-3 hours",
      },
    ],
  },
  {
    keywords: ["art", "drawing", "painting", "creative", "craft"],
    suggestions: [
      {
        title: "Art Workshop at Barnas Kulturhus",
        description:
          "Drop-in art workshops designed for children with professional materials and guidance.",
        category: "Art",
        iconName: "pen-tool",
        duration: "2 hours",
        location: "Barnas Kulturhus, Oslo",
      },
      {
        title: "DIY Craft Afternoon",
        description:
          "Set up a craft station at home with recycled materials. Build, paint, and create.",
        category: "Art",
        iconName: "pen-tool",
        duration: "1-3 hours",
      },
    ],
  },
  {
    keywords: ["music", "instrument", "singing"],
    suggestions: [
      {
        title: "Music Class for Kids",
        description:
          "Group music classes introduce rhythm, melody, and instruments.",
        category: "Music",
        iconName: "music",
        duration: "1 hour",
        location: "Oslo Kulturskole",
      },
      {
        title: "Kitchen Band Jam Session",
        description:
          "Use pots, pans, and wooden spoons to explore rhythm and beats.",
        category: "Music",
        iconName: "music",
        duration: "30-60 min",
      },
    ],
  },
  {
    keywords: ["swimming", "water"],
    suggestions: [
      {
        title: "Swimming Lessons at Toyenbadet",
        description:
          "Professional swimming instruction in a modern facility. Builds water confidence and safety skills.",
        category: "Swimming",
        iconName: "droplet",
        duration: "1 hour",
        location: "Toyenbadet, Oslo",
      },
    ],
  },
  {
    keywords: ["sport", "football", "climbing", "exercise", "physical"],
    suggestions: [
      {
        title: "Football Training",
        description:
          "Join a local football club for team sports, coordination, and social skills.",
        category: "Sport",
        iconName: "award",
        duration: "1.5 hours",
        location: "Local football club",
      },
      {
        title: "Family Bike Ride",
        description:
          "Explore Oslo's bike paths together. Great exercise combined with navigation skills.",
        category: "Sport",
        iconName: "award",
        duration: "1-3 hours",
      },
    ],
  },
  {
    keywords: ["science", "experiment", "chemistry", "physics", "biology"],
    suggestions: [
      {
        title: "Science Experiments at Home",
        description:
          "Simple experiments with household items: baking soda volcanoes, crystal growing, and water filtration.",
        category: "Science",
        iconName: "zap",
        duration: "1-2 hours",
      },
      {
        title: "Teknisk Museum Visit",
        description:
          "Hands-on science and technology exhibits designed for curious minds.",
        category: "Science",
        iconName: "zap",
        duration: "2-3 hours",
        location: "Teknisk Museum, Oslo",
      },
    ],
  },
  {
    keywords: ["coding", "programming", "computer", "technology"],
    suggestions: [
      {
        title: "Scratch Coding Workshop",
        description:
          "Learn visual programming with Scratch. Create animations, games, and interactive stories.",
        category: "Coding",
        iconName: "terminal",
        duration: "1-2 hours",
      },
    ],
  },
  {
    keywords: ["writing", "story", "creative writing", "journal"],
    suggestions: [
      {
        title: "Story Writing Challenge",
        description:
          "Write a short story together using writing prompts. Develops vocabulary and imagination.",
        category: "Writing",
        iconName: "file-text",
        duration: "1 hour",
      },
    ],
  },
];

function generateSuggestions(goals: EducationGoal[]): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const usedTitles = new Set<string>();

  for (const goal of goals) {
    const allText = [goal.freeText, ...goal.academicTags, ...goal.lifeSkillTags]
      .join(" ")
      .toLowerCase();

    for (const rule of SUGGESTION_RULES) {
      const matched = rule.keywords.some((kw) => allText.includes(kw));
      if (matched) {
        for (const s of rule.suggestions) {
          if (!usedTitles.has(s.title)) {
            usedTitles.add(s.title);
            suggestions.push({
              ...s,
              id: `${goal.childId}-${s.title.replace(/\s/g, "-").toLowerCase()}`,
              matchedGoal: rule.keywords[0],
            });
          }
        }
      }
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// AsyncStorage helpers for goals
// ---------------------------------------------------------------------------

async function loadGoalsFromStorage(
  childIds: number[],
): Promise<EducationGoal[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as EducationGoal[];
    }
  } catch {
    // ignore parse errors
  }
  return childIds.map((id) => ({
    childId: id,
    freeText: "",
    academicTags: [],
    lifeSkillTags: [],
  }));
}

async function saveGoalsToStorage(goals: EducationGoal[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

// ===========================================================================
// Main Component
// ===========================================================================

export default function EducationScreen() {
  const [activeTab, setActiveTab] = useState<EducationTab>("goals");
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.tabContent}>
        {activeTab === "goals" && <GoalsAndAiTab />}
        {activeTab === "reading" && <ReadingListTab />}
        {activeTab === "tasks" && <SchoolTasksTab />}
        {activeTab === "handover" && <HandoverNotesTab />}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Segmented Control
// ---------------------------------------------------------------------------

function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: EducationTab;
  onTabChange: (tab: EducationTab) => void;
}) {
  const { colors } = useTheme();

  const tabs: { key: EducationTab; label: string; icon: string }[] = [
    { key: "goals", label: "Goals & AI", icon: "target" },
    { key: "reading", label: "Reading", icon: "book" },
    { key: "tasks", label: "Tasks", icon: "clipboard" },
    { key: "handover", label: "Notes", icon: "edit-3" },
  ];

  return (
    <View style={[styles.segmentedControl, { backgroundColor: colors.muted }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              ReactNativeHapticFeedback.trigger("selection");
              onTabChange(tab.key);
            }}
            style={[
              styles.segment,
              isActive && { backgroundColor: colors.card },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.mutedForeground },
                isActive && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared UI pieces
// ---------------------------------------------------------------------------

function ProgressBar({
  progress,
  trackColor,
  fillColor,
}: {
  progress: number;
  trackColor: string;
  fillColor: string;
}) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.progressBarTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressBarFill,
          { width: `${clamped}%`, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

function SectionDivider({ color }: { color: string }) {
  return <View style={[styles.sectionDivider, { backgroundColor: color }]} />;
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <View
        style={[styles.emptyIconCircle, { backgroundColor: colors.muted }]}
      >
        <Icon name={icon} size={36} color={colors.border} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
        {title}
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
        {subtitle}
      </Text>
    </View>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.modalHeader}>
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <TouchableOpacity
        onPress={onClose}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Icon name="x" size={22} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function ChildPicker({
  children,
  selectedId,
  onSelect,
}: {
  children: Child[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.childPickerRow}>
      {children.map((child) => {
        const isSelected = child.id === selectedId;
        return (
          <TouchableOpacity
            key={child.id}
            onPress={() => onSelect(child.id)}
            style={[
              styles.childPickerChip,
              {
                backgroundColor: isSelected ? colors.primary : colors.muted,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.childPickerText,
                { color: isSelected ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {child.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tag Picker
// ---------------------------------------------------------------------------

function TagPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const { colors } = useTheme();

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <View style={styles.tagPickerContainer}>
      <Text
        style={[styles.tagPickerLabel, { color: colors.mutedForeground }]}
      >
        {label}
      </Text>
      <View style={styles.tagPickerWrap}>
        {options.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              onPress={() => {
                ReactNativeHapticFeedback.trigger("selection");
                toggle(tag);
              }}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.muted,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  { color: isActive ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {tag}
              </Text>
              {isActive && (
                <Icon
                  name="x"
                  size={12}
                  color="#FFFFFF"
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ===========================================================================
// TAB: Goals & AI
// ===========================================================================

function GoalsAndAiTab() {
  const { colors } = useTheme();
  const { data: children = [], isLoading: childrenLoading, refetch: refetchChildren } = useChildren();
  const createEventMutation = useCreateEvent();

  const [goals, setGoals] = useState<EducationGoal[]>([]);
  const [goalsInitialised, setGoalsInitialised] = useState(false);
  const [expandedChildId, setExpandedChildId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useRefreshOnFocus(["children"]);

  // Load goals from AsyncStorage once children arrive
  useEffect(() => {
    if (children.length > 0 && !goalsInitialised) {
      const childIds = children.map((c) => c.id);
      loadGoalsFromStorage(childIds).then((loaded) => {
        const merged = childIds.map(
          (id) =>
            loaded.find((g) => g.childId === id) || {
              childId: id,
              freeText: "",
              academicTags: [],
              lifeSkillTags: [],
            },
        );
        setGoals(merged);
        setGoalsInitialised(true);
      });
    }
  }, [children, goalsInitialised]);

  const updateGoal = useCallback(
    (childId: number, patch: Partial<EducationGoal>) => {
      setGoals((prev) =>
        prev.map((g) => (g.childId === childId ? { ...g, ...patch } : g)),
      );
    },
    [],
  );

  const handleSaveGoals = useCallback(
    async (childId: number) => {
      ReactNativeHapticFeedback.trigger("notificationSuccess");
      await saveGoalsToStorage(goals);
      Alert.alert("Saved", "Education goals updated successfully.");
      setExpandedChildId(null);
    },
    [goals],
  );

  const suggestions = useMemo(() => generateSuggestions(goals), [goals]);

  const handleAddToCalendar = useCallback(
    (suggestion: AISuggestion) => {
      const today = new Date().toISOString().split("T")[0];
      createEventMutation.mutate(
        {
          title: suggestion.title,
          start_date: today,
          end_date: today,
          start_time: "10:00",
          end_time: "12:00",
          time_zone: "Europe/Oslo",
          parent: "A",
          type: "activity",
          recurrence: null,
          recurrence_interval: 1,
          recurrence_end: null,
          recurrence_days: null,
          description: suggestion.description,
          location: suggestion.location ?? null,
          address: null,
        } as any,
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            Alert.alert(
              "Added to Calendar",
              `"${suggestion.title}" has been added. Check your calendar to adjust the date.`,
            );
          },
          onError: () => {
            Alert.alert("Error", "Failed to create event. Please try again.");
          },
        },
      );
    },
    [createEventMutation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchChildren();
    setRefreshing(false);
  }, [refetchChildren]);

  if (childrenLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    );
  }

  return (
    <ScrollView
      style={styles.scrollFill}
      contentContainerStyle={styles.goalsScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ---- Education Goals Section ---- */}
      <Card style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
        <View style={styles.sectionHeader}>
          <Icon name="target" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Education Goals
          </Text>
        </View>

        {children.length === 0 ? (
          <EmptyState
            icon="award"
            title="No children added yet."
            subtitle="Add your children in Settings to set education goals."
          />
        ) : (
          children.map((child) => {
            const goal = goals.find((g) => g.childId === child.id);
            const isExpanded = expandedChildId === child.id;

            return (
              <View key={child.id} style={styles.childAccordion}>
                <TouchableOpacity
                  onPress={() => {
                    ReactNativeHapticFeedback.trigger("selection");
                    setExpandedChildId(isExpanded ? null : child.id);
                  }}
                  style={[
                    styles.accordionHeader,
                    { backgroundColor: colors.muted },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <View
                      style={[
                        styles.childAvatar,
                        { backgroundColor: colors.primary + "25" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.childAvatarText,
                          { color: colors.primary },
                        ]}
                      >
                        {child.name.charAt(0)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.accordionTitle,
                        { color: colors.foreground },
                      ]}
                    >
                      {child.name}'s Goals
                    </Text>
                  </View>
                  <Icon
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>

                {isExpanded && goal && (
                  <View style={styles.accordionBody}>
                    {/* Free text goals */}
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      What do you want to teach {child.name}?
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          borderColor: colors.border,
                          color: colors.foreground,
                          backgroundColor: colors.background,
                        },
                      ]}
                      multiline
                      numberOfLines={3}
                      placeholder="e.g., Develop a love for reading and become confident in math..."
                      placeholderTextColor={colors.mutedForeground}
                      value={goal.freeText}
                      onChangeText={(text) =>
                        updateGoal(child.id, { freeText: text })
                      }
                    />

                    {/* Academic tags */}
                    <TagPicker
                      label="Academic Focus Areas"
                      options={ACADEMIC_TAG_OPTIONS}
                      selected={goal.academicTags}
                      onChange={(tags) =>
                        updateGoal(child.id, { academicTags: tags })
                      }
                    />

                    {/* Life skills tags */}
                    <TagPicker
                      label="Life Skills to Develop"
                      options={LIFE_SKILL_TAG_OPTIONS}
                      selected={goal.lifeSkillTags}
                      onChange={(tags) =>
                        updateGoal(child.id, { lifeSkillTags: tags })
                      }
                    />

                    {/* Save button */}
                    <TouchableOpacity
                      onPress={() => handleSaveGoals(child.id)}
                      style={[
                        styles.saveButton,
                        { backgroundColor: colors.primary },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Icon name="save" size={16} color="#FFFFFF" />
                      <Text style={styles.saveButtonText}>Save Goals</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Card>

      {/* ---- AI Activity Suggestions Section ---- */}
      <Card style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
        <View style={styles.sectionHeader}>
          <Icon name="zap" size={20} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            AI Activity Suggestions
          </Text>
          <View style={[styles.aiBadge, { backgroundColor: "#FEF3C7" }]}>
            <Text style={styles.aiBadgeText}>Based on your goals</Text>
          </View>
        </View>

        {suggestions.length === 0 ? (
          <EmptyState
            icon="cpu"
            title="No suggestions yet."
            subtitle='Set education goals above with tags like "Math", "Reading", "Nature", or "Cooking" to receive personalised activity suggestions.'
          />
        ) : (
          suggestions.map((suggestion) => {
            const catColor = CATEGORY_COLORS[suggestion.category] ?? {
              bg: "#F3F4F6",
              text: "#374151",
            };
            return (
              <View
                key={suggestion.id}
                style={[
                  styles.suggestionCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.suggestionTopRow}>
                  <View
                    style={[
                      styles.suggestionIconCircle,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Icon
                      name={suggestion.iconName}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: catColor.bg },
                    ]}
                  >
                    <Text
                      style={[styles.categoryBadgeText, { color: catColor.text }]}
                    >
                      {suggestion.category}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.suggestionTitle,
                    { color: colors.foreground },
                  ]}
                >
                  {suggestion.title}
                </Text>
                <Text
                  style={[
                    styles.suggestionDescription,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {suggestion.description}
                </Text>

                <View style={styles.suggestionMeta}>
                  <View style={styles.suggestionMetaItem}>
                    <Icon
                      name="clock"
                      size={12}
                      color={colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.suggestionMetaText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {suggestion.duration}
                    </Text>
                  </View>
                  {suggestion.location && (
                    <View style={styles.suggestionMetaItem}>
                      <Icon
                        name="map-pin"
                        size={12}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.suggestionMetaText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {suggestion.location}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleAddToCalendar(suggestion)}
                  style={[
                    styles.addToCalendarButton,
                    { borderColor: colors.primary },
                  ]}
                  activeOpacity={0.7}
                  disabled={createEventMutation.isPending}
                >
                  <Icon name="calendar" size={14} color={colors.primary} />
                  <Text
                    style={[
                      styles.addToCalendarText,
                      { color: colors.primary },
                    ]}
                  >
                    {createEventMutation.isPending
                      ? "Adding..."
                      : "Add to Calendar"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

// ===========================================================================
// TAB: Reading List
// ===========================================================================

function ReadingListTab() {
  const { colors } = useTheme();
  const { data: items = [], isLoading, refetch } = useReadingList();
  const { data: children = [] } = useChildren();
  const createBookMutation = useCreateReadingListItem();
  const updateBookMutation = useUpdateReadingListItem();

  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    child_id: 0,
    progress: 0,
    assigned_to: "Parent A",
    cover: "",
  });

  useRefreshOnFocus(["readingList"]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const resetBookForm = useCallback(() => {
    setBookForm({
      title: "",
      author: "",
      child_id: 0,
      progress: 0,
      assigned_to: "Parent A",
      cover: "",
    });
  }, []);

  const handleAddBook = useCallback(() => {
    if (!bookForm.child_id) {
      Alert.alert("Validation", "Please select a child.");
      return;
    }
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      Alert.alert("Validation", "Please fill in title and author.");
      return;
    }
    ReactNativeHapticFeedback.trigger("impactMedium");
    createBookMutation.mutate(bookForm as any, {
      onSuccess: () => {
        ReactNativeHapticFeedback.trigger("notificationSuccess");
        setShowAddModal(false);
        resetBookForm();
      },
      onError: () => {
        Alert.alert("Error", "Failed to add book. Please try again.");
      },
    });
  }, [bookForm, createBookMutation, resetBookForm]);

  const handleUpdateProgress = useCallback(
    (item: ReadingListItem) => {
      Alert.prompt(
        "Update Progress",
        `Current progress: ${item.progress}%\nEnter new progress (0-100):`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update",
            onPress: (value: string | undefined) => {
              const newProgress = parseInt(value ?? "0", 10);
              if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
                Alert.alert("Invalid", "Please enter a number between 0 and 100.");
                return;
              }
              updateBookMutation.mutate({
                id: item.id,
                updates: { progress: newProgress },
              });
            },
          },
        ],
        "plain-text",
        String(item.progress),
        "number-pad",
      );
    },
    [updateBookMutation],
  );

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    );
  }

  function findChildName(childId: number): string {
    return children.find((c) => c.id === childId)?.name ?? "Child";
  }

  return (
    <View style={styles.flex1}>
      {/* Header row */}
      <View style={styles.tabHeaderRow}>
        <View style={styles.tabHeaderLeft}>
          <Icon name="book-open" size={18} color={colors.primary} />
          <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>
            Shared Reading List
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            Add Book
          </Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon="book"
            title="No reading list items"
            subtitle="Add books for your children to track their reading progress."
          />
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.bookIconWrapper,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Icon name="book" size={22} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.cardSubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  by {item.author}
                </Text>
                <View style={styles.readingBadgeRow}>
                  <View
                    style={[
                      styles.childNameBadge,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.childNameBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      {findChildName(item.child_id)}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <ProgressBar
                    progress={item.progress}
                    trackColor={colors.border}
                    fillColor={colors.primary}
                  />
                  <Text
                    style={[styles.progressText, { color: colors.primary }]}
                  >
                    {item.progress}%
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleUpdateProgress(item)}
                  style={[
                    styles.updateProgressButton,
                    { borderColor: colors.border },
                  ]}
                >
                  <Icon
                    name="trending-up"
                    size={14}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.updateProgressText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Update Progress
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Book Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <ModalHeader
              title="Add Book"
              onClose={() => setShowAddModal(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Child *
              </Text>
              <ChildPicker
                children={children}
                selectedId={bookForm.child_id}
                onSelect={(id) => setBookForm((f) => ({ ...f, child_id: id }))}
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Title *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g., Harry Potter"
                placeholderTextColor={colors.mutedForeground}
                value={bookForm.title}
                onChangeText={(t) =>
                  setBookForm((f) => ({ ...f, title: t }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Author *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g., J.K. Rowling"
                placeholderTextColor={colors.mutedForeground}
                value={bookForm.author}
                onChangeText={(t) =>
                  setBookForm((f) => ({ ...f, author: t }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Initial Progress (%)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                value={String(bookForm.progress)}
                onChangeText={(t) => {
                  const num = parseInt(t, 10);
                  setBookForm((f) => ({
                    ...f,
                    progress: isNaN(num) ? 0 : Math.min(100, Math.max(0, num)),
                  }));
                }}
              />

              <TouchableOpacity
                onPress={handleAddBook}
                disabled={createBookMutation.isPending}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  createBookMutation.isPending && { opacity: 0.6 },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {createBookMutation.isPending ? "Adding..." : "Add Book"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ===========================================================================
// TAB: School Tasks
// ===========================================================================

function SchoolTasksTab() {
  const { colors } = useTheme();
  const { data: tasks = [], isLoading, refetch } = useSchoolTasks();
  const { data: children = [] } = useChildren();
  const createTaskMutation = useCreateSchoolTask();
  const updateTaskMutation = useUpdateSchoolTask();

  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    due_date: "",
    child_id: 0,
    platform: "",
    description: "",
    status: "pending",
  });

  useRefreshOnFocus(["schoolTasks"]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const resetTaskForm = useCallback(() => {
    setTaskForm({
      title: "",
      due_date: "",
      child_id: 0,
      platform: "",
      description: "",
      status: "pending",
    });
  }, []);

  const handleAddTask = useCallback(() => {
    if (!taskForm.child_id) {
      Alert.alert("Validation", "Please select a child.");
      return;
    }
    if (!taskForm.title.trim()) {
      Alert.alert("Validation", "Please enter a task title.");
      return;
    }
    if (!taskForm.due_date.trim()) {
      Alert.alert("Validation", "Please enter a due date (YYYY-MM-DD).");
      return;
    }
    ReactNativeHapticFeedback.trigger("impactMedium");
    createTaskMutation.mutate(taskForm as any, {
      onSuccess: () => {
        ReactNativeHapticFeedback.trigger("notificationSuccess");
        setShowAddModal(false);
        resetTaskForm();
      },
      onError: () => {
        Alert.alert("Error", "Failed to add task. Please try again.");
      },
    });
  }, [taskForm, createTaskMutation, resetTaskForm]);

  const handleToggleStatus = useCallback(
    (task: SchoolTask) => {
      const nextStatus = NEXT_STATUS[task.status] ?? "pending";
      ReactNativeHapticFeedback.trigger("selection");
      updateTaskMutation.mutate({
        id: task.id,
        updates: { status: nextStatus },
      });
    },
    [updateTaskMutation],
  );

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    );
  }

  return (
    <View style={styles.flex1}>
      {/* Header row */}
      <View style={styles.tabHeaderRow}>
        <View style={styles.tabHeaderLeft}>
          <Icon name="clipboard" size={18} color={colors.primary} />
          <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>
            School Tasks
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addButton, { borderColor: colors.primary }]}
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            Add Task
          </Text>
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon="check-square"
            title="No school tasks"
            subtitle="Track homework and school assignments here."
          />
        </ScrollView>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: task }) => {
            const statusColor =
              TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.pending;

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.taskIconWrapper}>
                  <Icon name="check-square" size={22} color="#A855F7" />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.taskHeader}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.foreground },
                        task.status === "completed" && styles.strikethrough,
                      ]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleToggleStatus(task)}
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor.bg },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: statusColor.text },
                        ]}
                      >
                        {task.status}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[
                      styles.cardSubtitle,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Due: {formatShortDate(task.due_date)}
                  </Text>
                  {task.platform ? (
                    <View style={styles.platformRow}>
                      <Icon
                        name="monitor"
                        size={12}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.platformText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {task.platform}
                      </Text>
                    </View>
                  ) : null}
                  {task.description ? (
                    <Text
                      style={[
                        styles.taskDescription,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add Task Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            <ModalHeader
              title="Add Task"
              onClose={() => setShowAddModal(false)}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Child *
              </Text>
              <ChildPicker
                children={children}
                selectedId={taskForm.child_id}
                onSelect={(id) =>
                  setTaskForm((f) => ({ ...f, child_id: id }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Title *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g., Math homework Ch. 5"
                placeholderTextColor={colors.mutedForeground}
                value={taskForm.title}
                onChangeText={(t) =>
                  setTaskForm((f) => ({ ...f, title: t }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Subject
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g., Mathematics"
                placeholderTextColor={colors.mutedForeground}
                value={taskForm.description}
                onChangeText={(t) =>
                  setTaskForm((f) => ({ ...f, description: t }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Platform
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="e.g., Showbie, Google Classroom"
                placeholderTextColor={colors.mutedForeground}
                value={taskForm.platform}
                onChangeText={(t) =>
                  setTaskForm((f) => ({ ...f, platform: t }))
                }
              />

              <Text
                style={[styles.fieldLabel, { color: colors.mutedForeground }]}
              >
                Due Date * (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  },
                ]}
                placeholder="2026-03-15"
                placeholderTextColor={colors.mutedForeground}
                value={taskForm.due_date}
                onChangeText={(t) =>
                  setTaskForm((f) => ({ ...f, due_date: t }))
                }
              />

              <TouchableOpacity
                onPress={handleAddTask}
                disabled={createTaskMutation.isPending}
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  createTaskMutation.isPending && { opacity: 0.6 },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {createTaskMutation.isPending ? "Adding..." : "Add Task"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ===========================================================================
// TAB: Handover Notes
// ===========================================================================

function HandoverNotesTab() {
  const { colors } = useTheme();
  const { data: notes = [], isLoading, refetch } = useHandoverNotes();
  const { data: children = [] } = useChildren();
  const createNoteMutation = useCreateHandoverNote();

  const [noteText, setNoteText] = useState("");
  const [selectedChildId, setSelectedChildId] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useRefreshOnFocus(["handoverNotes"]);

  // Auto-select first child if none selected
  useEffect(() => {
    if (selectedChildId === 0 && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSendNote = useCallback(() => {
    if (!selectedChildId) {
      Alert.alert("Validation", "Please select a child.");
      return;
    }
    if (!noteText.trim()) {
      Alert.alert("Validation", "Please enter a note.");
      return;
    }
    ReactNativeHapticFeedback.trigger("impactMedium");
    createNoteMutation.mutate(
      {
        child_id: selectedChildId,
        parent: "A",
        message: noteText.trim(),
      } as any,
      {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          setNoteText("");
        },
        onError: () => {
          Alert.alert("Error", "Failed to send note. Please try again.");
        },
      },
    );
  }, [noteText, selectedChildId, createNoteMutation]);

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Header */}
      <View style={styles.tabHeaderRow}>
        <View style={styles.tabHeaderLeft}>
          <Icon name="message-circle" size={18} color={colors.primary} />
          <Text style={[styles.tabHeaderTitle, { color: colors.foreground }]}>
            Handover Notes
          </Text>
        </View>
      </View>

      {/* Notes list */}
      {notes.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <EmptyState
            icon="edit-3"
            title="No handover notes"
            subtitle="Share important notes during custody handovers."
          />
        </ScrollView>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: note }) => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.noteIconWrapper}>
                <Icon name="edit-3" size={22} color="#F59E0B" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.noteHeader}>
                  <Text
                    style={[
                      styles.noteSender,
                      { color: colors.foreground },
                    ]}
                  >
                    {note.parent}
                  </Text>
                  <Text
                    style={[
                      styles.noteDate,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {formatShortDate(note.created_at)}
                  </Text>
                </View>
                <Text style={[styles.noteMessage, { color: colors.foreground }]}>
                  {note.message}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Inline compose bar */}
      <View
        style={[
          styles.composeBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        {children.length > 1 && (
          <View style={styles.composeChildPicker}>
            <ChildPicker
              children={children}
              selectedId={selectedChildId}
              onSelect={setSelectedChildId}
            />
          </View>
        )}
        <View style={styles.composeRow}>
          <TextInput
            style={[
              styles.composeInput,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Type a note..."
            placeholderTextColor={colors.mutedForeground}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendNote}
            disabled={createNoteMutation.isPending || !noteText.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (createNoteMutation.isPending || !noteText.trim()) && {
                opacity: 0.5,
              },
            ]}
            activeOpacity={0.8}
          >
            <Icon name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ===========================================================================
// Styles
// ===========================================================================

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollFill: {
    flex: 1,
  },
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabContent: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },

  // --- Section cards ---
  goalsScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  sectionDivider: {
    height: 1,
    marginVertical: 16,
  },

  // --- Accordion ---
  childAccordion: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
  },
  accordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  childAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvatarText: {
    fontSize: 15,
    fontWeight: "700",
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
  },

  // --- Tags ---
  tagPickerContainer: {
    marginTop: 12,
  },
  tagPickerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagPickerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // --- AI Badge ---
  aiBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },

  // --- Suggestion cards ---
  suggestionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
  },
  suggestionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  suggestionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  suggestionMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  suggestionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  suggestionMetaText: {
    fontSize: 11,
  },
  addToCalendarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  addToCalendarText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // --- Save button ---
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // --- Tab header ---
  tabHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  tabHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tabHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // --- List cards ---
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  bookIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FAF5FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  noteIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // --- Reading ---
  readingBadgeRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  childNameBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  childNameBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 36,
    textAlign: "right",
  },
  updateProgressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  updateProgressText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // --- Tasks ---
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  platformText: {
    fontSize: 12,
  },
  taskDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  // --- Notes ---
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noteSender: {
    fontSize: 14,
    fontWeight: "600",
  },
  noteDate: {
    fontSize: 12,
  },
  noteMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  composeBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  composeChildPicker: {
    marginBottom: 8,
  },
  composeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Empty ---
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  // --- Forms ---
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: "top",
    minHeight: 80,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  childPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  childPickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  childPickerText: {
    fontSize: 13,
    fontWeight: "500",
  },
});

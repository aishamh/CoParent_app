import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";

import {
  useReadingList,
  useSchoolTasks,
  useHandoverNotes,
} from "../../src/hooks/useEducation";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatShortDate } from "../../src/utils/formatDate";
import type {
  ReadingListItem,
  SchoolTask,
  HandoverNote,
} from "../../src/types/schema";

const TEAL = "#0d9488";
const BACKGROUND = "#FDFAF5";

type EducationTab = "reading" | "tasks" | "handover";

const TASK_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  "in-progress": { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
};

function SegmentedControl({
  activeTab,
  onChangeTab,
}: {
  activeTab: EducationTab;
  onChangeTab: (tab: EducationTab) => void;
}) {
  const tabs: { key: EducationTab; label: string }[] = [
    { key: "reading", label: "Reading List" },
    { key: "tasks", label: "School Tasks" },
    { key: "handover", label: "Handover Notes" },
  ];

  return (
    <View style={styles.segmentedControl}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            style={[styles.segment, isActive && styles.segmentActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.segmentText,
                isActive && styles.segmentTextActive,
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

function ProgressBar({ progress }: { progress: number }) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.progressBarTrack}>
      <View
        style={[styles.progressBarFill, { width: `${clampedProgress}%` }]}
      />
    </View>
  );
}

function ReadingListCard({ item }: { item: ReadingListItem }) {
  return (
    <View style={styles.card}>
      <View style={styles.bookIconWrapper}>
        <Feather name="book" size={22} color={TEAL} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardSubtitle}>by {item.author}</Text>
        <View style={styles.progressRow}>
          <ProgressBar progress={item.progress} />
          <Text style={styles.progressText}>{item.progress}%</Text>
        </View>
        <Text style={styles.assignedTo}>
          Assigned to: {item.assigned_to}
        </Text>
      </View>
    </View>
  );
}

function SchoolTaskCard({ task }: { task: SchoolTask }) {
  const statusColor =
    TASK_STATUS_COLORS[task.status] ?? TASK_STATUS_COLORS.pending;

  return (
    <View style={styles.card}>
      <View style={styles.taskIconWrapper}>
        <Feather name="check-square" size={22} color="#A855F7" />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.taskHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>
              {task.status}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Due: {formatShortDate(task.due_date)}
        </Text>
        {task.platform && (
          <Text style={styles.platform}>Platform: {task.platform}</Text>
        )}
        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>
        )}
      </View>
    </View>
  );
}

function HandoverNoteCard({ note }: { note: HandoverNote }) {
  return (
    <View style={styles.card}>
      <View style={styles.noteIconWrapper}>
        <Feather name="edit-3" size={22} color="#F59E0B" />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteSender}>{note.parent}</Text>
          <Text style={styles.noteDate}>
            {formatShortDate(note.created_at)}
          </Text>
        </View>
        <Text style={styles.noteMessage}>{note.message}</Text>
      </View>
    </View>
  );
}

function EmptyTab({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Feather name={icon} size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
  );
}

function ReadingListTab() {
  const { data: items = [], isLoading } = useReadingList();
  useRefreshOnFocus(["readingList"]);

  if (isLoading) {
    return <ActivityIndicator size="large" color={TEAL} style={styles.loader} />;
  }

  if (items.length === 0) {
    return (
      <EmptyTab
        icon="book"
        title="No reading list items"
        subtitle="Add books for your children to track their reading progress."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <ReadingListCard item={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

function SchoolTasksTab() {
  const { data: tasks = [], isLoading } = useSchoolTasks();
  useRefreshOnFocus(["schoolTasks"]);

  if (isLoading) {
    return <ActivityIndicator size="large" color={TEAL} style={styles.loader} />;
  }

  if (tasks.length === 0) {
    return (
      <EmptyTab
        icon="check-square"
        title="No school tasks"
        subtitle="Track homework and school assignments here."
      />
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <SchoolTaskCard task={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

function HandoverNotesTab() {
  const { data: notes = [], isLoading } = useHandoverNotes();
  useRefreshOnFocus(["handoverNotes"]);

  if (isLoading) {
    return <ActivityIndicator size="large" color={TEAL} style={styles.loader} />;
  }

  if (notes.length === 0) {
    return (
      <EmptyTab
        icon="edit-3"
        title="No handover notes"
        subtitle="Share important notes during custody handovers."
      />
    );
  }

  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <HandoverNoteCard note={item} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function EducationScreen() {
  const [activeTab, setActiveTab] = useState<EducationTab>("reading");

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <Stack.Screen options={{ title: "Education" }} />

      <SegmentedControl activeTab={activeTab} onChangeTab={setActiveTab} />

      <View style={styles.tabContent}>
        {activeTab === "reading" && <ReadingListTab />}
        {activeTab === "tasks" && <SchoolTasksTab />}
        {activeTab === "handover" && <HandoverNotesTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  segmentTextActive: {
    color: TEAL,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  bookIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0FDFA",
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
    color: "#111827",
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
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
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: TEAL,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEAL,
    minWidth: 36,
    textAlign: "right",
  },
  assignedTo: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
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
  platform: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  taskDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  noteSender: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  noteDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  noteMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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
  loader: {
    marginTop: 40,
  },
});

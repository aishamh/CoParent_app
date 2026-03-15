import React, { useState, useCallback, useMemo } from "react";
import {
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

import { useChildren } from "../hooks/useChildren";
import {
  useSchoolConnections,
  useCreateSchoolConnection,
  useSchoolHomework,
  useCreateSchoolHomework,
  useUpdateSchoolHomework,
  useSchoolAttendance,
  useSchoolGrades,
  useSchoolSummary,
} from "../hooks/useSchool";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatShortDate } from "../utils/formatDate";
import Card from "../components/ui/Card";
import type { Child, SchoolHomework, SchoolGrade, SchoolAttendance as AttendanceRecord } from "../types/schema";

// ---------------------------------------------------------------------------
// Tab Configuration
// ---------------------------------------------------------------------------

type SchoolTab = "homework" | "grades" | "attendance" | "connections";

interface TabConfig {
  key: SchoolTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { key: "homework", label: "Homework", icon: "edit-3" },
  { key: "grades", label: "Grades", icon: "award" },
  { key: "attendance", label: "Attendance", icon: "check-circle" },
  { key: "connections", label: "Schools", icon: "link" },
];

// ---------------------------------------------------------------------------
// Status Configuration
// ---------------------------------------------------------------------------

const HOMEWORK_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  assigned: { label: "Assigned", color: "#3B82F6", icon: "clipboard" },
  in_progress: { label: "In Progress", color: "#F59E0B", icon: "edit" },
  submitted: { label: "Submitted", color: "#0D9488", icon: "check" },
  graded: { label: "Graded", color: "#8B5CF6", icon: "award" },
  overdue: { label: "Overdue", color: "#EF4444", icon: "alert-circle" },
};

const ATTENDANCE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  present: { label: "Present", color: "#0D9488", icon: "check-circle" },
  absent: { label: "Absent", color: "#EF4444", icon: "x-circle" },
  late: { label: "Late", color: "#F59E0B", icon: "clock" },
  excused: { label: "Excused", color: "#6B7280", icon: "info" },
};

const PLATFORM_LABELS: Record<string, string> = {
  visma_flyt: "Visma Flyt Skole",
  itslearning: "itslearning",
  vigilo: "Vigilo",
  manual: "Manual Entry",
};

const SUBJECT_EMOJIS: Record<string, string> = {
  Matematikk: "📐",
  Norsk: "📖",
  Engelsk: "🇬🇧",
  Naturfag: "🔬",
  Samfunnsfag: "🌍",
  Kroppsøving: "⚽",
  Kunst: "🎨",
  Musikk: "🎵",
  KRLE: "🕊️",
  Mat: "📐",
  Math: "📐",
  Norwegian: "📖",
  English: "🇬🇧",
  Science: "🔬",
};

function getSubjectEmoji(subject: string): string {
  return SUBJECT_EMOJIS[subject] ?? "📚";
}

// ---------------------------------------------------------------------------
// Child Picker
// ---------------------------------------------------------------------------

function ChildPicker({
  children: childList,
  selectedId,
  onSelect,
  colors,
}: {
  children: Child[];
  selectedId: number;
  onSelect: (id: number) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (childList.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={pickerStyles.content}
      style={pickerStyles.container}
    >
      {childList.map((child) => {
        const isSelected = child.id === selectedId;
        return (
          <TouchableOpacity
            key={child.id}
            onPress={() => onSelect(child.id)}
            style={[
              pickerStyles.chip,
              { backgroundColor: isSelected ? colors.primary : colors.muted },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={child.name}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                pickerStyles.chipText,
                { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
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
// Tab Bar
// ---------------------------------------------------------------------------

function TabBar({
  activeTab,
  onSelect,
  colors,
}: {
  activeTab: SchoolTab;
  onSelect: (tab: SchoolTab) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={tabStyles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[
              tabStyles.tab,
              isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={isActive ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                tabStyles.tabText,
                { color: isActive ? colors.primary : colors.mutedForeground },
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
// Summary Banner
// ---------------------------------------------------------------------------

function SummaryBanner({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const { data: summary } = useSchoolSummary();

  if (!summary || summary.connected_schools === 0) return null;

  return (
    <View style={summaryStyles.container}>
      <View style={summaryStyles.row}>
        <View style={[summaryStyles.stat, { backgroundColor: colors.muted }]}>
          <Text style={[summaryStyles.statValue, { color: colors.primary }]}>
            {summary.pending_homework}
          </Text>
          <Text style={[summaryStyles.statLabel, { color: colors.mutedForeground }]}>
            Pending
          </Text>
        </View>
        <View style={[summaryStyles.stat, { backgroundColor: colors.muted }]}>
          <Text
            style={[
              summaryStyles.statValue,
              { color: summary.overdue_homework > 0 ? "#EF4444" : colors.foreground },
            ]}
          >
            {summary.overdue_homework}
          </Text>
          <Text style={[summaryStyles.statLabel, { color: colors.mutedForeground }]}>
            Overdue
          </Text>
        </View>
        <View style={[summaryStyles.stat, { backgroundColor: colors.muted }]}>
          <Text style={[summaryStyles.statValue, { color: colors.foreground }]}>
            {summary.absences_last_30_days}
          </Text>
          <Text style={[summaryStyles.statLabel, { color: colors.mutedForeground }]}>
            Absences
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Homework Tab
// ---------------------------------------------------------------------------

function HomeworkCard({
  item,
  colors,
  onStatusChange,
}: {
  item: SchoolHomework;
  colors: ReturnType<typeof useTheme>["colors"];
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusConfig = HOMEWORK_STATUS_CONFIG[item.status] ?? HOMEWORK_STATUS_CONFIG.assigned;
  const isPastDue = new Date(item.due_date) < new Date() && item.status === "assigned";
  const emoji = getSubjectEmoji(item.subject);

  return (
    <Card style={homeworkStyles.card}>
      <View style={homeworkStyles.header}>
        <Text style={homeworkStyles.emoji}>{emoji}</Text>
        <View style={homeworkStyles.headerText}>
          <Text style={[homeworkStyles.title, { color: colors.foreground }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[homeworkStyles.subject, { color: colors.mutedForeground }]}>
            {item.subject}
          </Text>
        </View>
        <View style={[homeworkStyles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
          <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
          <Text style={[homeworkStyles.statusText, { color: statusConfig.color }]}>
            {isPastDue ? "Overdue" : statusConfig.label}
          </Text>
        </View>
      </View>

      {item.description ? (
        <Text
          style={[homeworkStyles.description, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      ) : null}

      <View style={homeworkStyles.footer}>
        <View style={homeworkStyles.dueRow}>
          <Icon
            name="calendar"
            size={12}
            color={isPastDue ? "#EF4444" : colors.mutedForeground}
          />
          <Text
            style={[
              homeworkStyles.dueText,
              { color: isPastDue ? "#EF4444" : colors.mutedForeground },
            ]}
          >
            Due: {formatShortDate(item.due_date)}
          </Text>
        </View>

        {item.status !== "submitted" && item.status !== "graded" ? (
          <TouchableOpacity
            onPress={() => {
              const nextStatus = item.status === "assigned" ? "in_progress" : "submitted";
              onStatusChange(item.id, nextStatus);
            }}
            style={[homeworkStyles.actionButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={homeworkStyles.actionText}>
              {item.status === "assigned" ? "Start" : "Submit"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {item.grade ? (
          <View style={[homeworkStyles.gradeBadge, { backgroundColor: "#8B5CF620" }]}>
            <Text style={[homeworkStyles.gradeText, { color: "#8B5CF6" }]}>
              {item.grade}{item.max_grade ? `/${item.max_grade}` : ""}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function HomeworkTab({
  childId,
  connectionId,
  colors,
}: {
  childId: number;
  connectionId: string | undefined;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { data: homework = [], isLoading } = useSchoolHomework(childId);
  const updateMutation = useUpdateSchoolHomework();

  useRefreshOnFocus(["schoolHomework"]);

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      ReactNativeHapticFeedback.trigger("impactLight");
      updateMutation.mutate({ id, data: { status: status as any } });
    },
    [updateMutation],
  );

  if (isLoading) {
    return (
      <View style={sharedStyles.centered}>
        <Text style={[sharedStyles.loadingText, { color: colors.mutedForeground }]}>
          Loading homework...
        </Text>
      </View>
    );
  }

  if (homework.length === 0) {
    return (
      <View style={sharedStyles.emptyContainer}>
        <Icon name="edit-3" size={48} color={colors.muted} />
        <Text style={[sharedStyles.emptyTitle, { color: colors.foreground }]}>
          No Homework Yet
        </Text>
        <Text style={[sharedStyles.emptySubtitle, { color: colors.mutedForeground }]}>
          Assignments from connected school platforms will appear here.
          You can also add homework manually.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={homework}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <HomeworkCard item={item} colors={colors} onStatusChange={handleStatusChange} />
      )}
      contentContainerStyle={sharedStyles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Grades Tab
// ---------------------------------------------------------------------------

function GradeCard({
  item,
  colors,
}: {
  item: SchoolGrade;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const emoji = getSubjectEmoji(item.subject);

  return (
    <Card style={gradeStyles.card}>
      <View style={gradeStyles.row}>
        <Text style={gradeStyles.emoji}>{emoji}</Text>
        <View style={gradeStyles.info}>
          <Text style={[gradeStyles.subject, { color: colors.foreground }]}>
            {item.subject}
          </Text>
          {item.term ? (
            <Text style={[gradeStyles.term, { color: colors.mutedForeground }]}>
              {item.term}
            </Text>
          ) : null}
          <Text style={[gradeStyles.date, { color: colors.mutedForeground }]}>
            {formatShortDate(item.date)}
          </Text>
        </View>
        <View style={gradeStyles.gradeCircle}>
          <Text style={[gradeStyles.gradeValue, { color: colors.primary }]}>
            {item.grade}
          </Text>
          {item.max_grade ? (
            <Text style={[gradeStyles.maxGrade, { color: colors.mutedForeground }]}>
              /{item.max_grade}
            </Text>
          ) : null}
        </View>
      </View>
      {item.teacher_comment ? (
        <View style={[gradeStyles.commentBox, { backgroundColor: colors.muted }]}>
          <Icon name="message-circle" size={12} color={colors.mutedForeground} />
          <Text style={[gradeStyles.commentText, { color: colors.mutedForeground }]}>
            {item.teacher_comment}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

function GradesTab({
  childId,
  colors,
}: {
  childId: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { data: grades = [], isLoading } = useSchoolGrades(childId);

  useRefreshOnFocus(["schoolGrades"]);

  if (isLoading) {
    return (
      <View style={sharedStyles.centered}>
        <Text style={[sharedStyles.loadingText, { color: colors.mutedForeground }]}>
          Loading grades...
        </Text>
      </View>
    );
  }

  if (grades.length === 0) {
    return (
      <View style={sharedStyles.emptyContainer}>
        <Icon name="award" size={48} color={colors.muted} />
        <Text style={[sharedStyles.emptyTitle, { color: colors.foreground }]}>
          No Grades Yet
        </Text>
        <Text style={[sharedStyles.emptySubtitle, { color: colors.mutedForeground }]}>
          Grades from school platforms will sync here.
          You can also record grades manually.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={grades}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GradeCard item={item} colors={colors} />}
      contentContainerStyle={sharedStyles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Attendance Tab
// ---------------------------------------------------------------------------

function AttendanceRow({
  item,
  colors,
}: {
  item: AttendanceRecord;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const config = ATTENDANCE_STATUS_CONFIG[item.status] ?? ATTENDANCE_STATUS_CONFIG.present;

  return (
    <View style={[attendanceStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[attendanceStyles.statusDot, { backgroundColor: config.color }]} />
      <View style={attendanceStyles.info}>
        <Text style={[attendanceStyles.date, { color: colors.foreground }]}>
          {formatShortDate(item.date)}
        </Text>
        {item.subject ? (
          <Text style={[attendanceStyles.subject, { color: colors.mutedForeground }]}>
            {item.subject}
          </Text>
        ) : null}
      </View>
      <View style={[attendanceStyles.statusBadge, { backgroundColor: config.color + "15" }]}>
        <Icon name={config.icon} size={12} color={config.color} />
        <Text style={[attendanceStyles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </View>
  );
}

function AttendanceTab({
  childId,
  colors,
}: {
  childId: number;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const { data: attendance = [], isLoading } = useSchoolAttendance(childId);

  useRefreshOnFocus(["schoolAttendance"]);

  if (isLoading) {
    return (
      <View style={sharedStyles.centered}>
        <Text style={[sharedStyles.loadingText, { color: colors.mutedForeground }]}>
          Loading attendance...
        </Text>
      </View>
    );
  }

  if (attendance.length === 0) {
    return (
      <View style={sharedStyles.emptyContainer}>
        <Icon name="check-circle" size={48} color={colors.muted} />
        <Text style={[sharedStyles.emptyTitle, { color: colors.foreground }]}>
          No Attendance Records
        </Text>
        <Text style={[sharedStyles.emptySubtitle, { color: colors.mutedForeground }]}>
          Attendance data from connected school systems will appear here.
        </Text>
      </View>
    );
  }

  const absentCount = attendance.filter((a) => a.status === "absent").length;
  const lateCount = attendance.filter((a) => a.status === "late").length;

  return (
    <View style={attendanceStyles.container}>
      {/* Quick stats */}
      <View style={attendanceStyles.statsRow}>
        <View style={[attendanceStyles.statCard, { backgroundColor: colors.muted }]}>
          <Text style={[attendanceStyles.statValue, { color: "#0D9488" }]}>
            {attendance.length - absentCount - lateCount}
          </Text>
          <Text style={[attendanceStyles.statLabel, { color: colors.mutedForeground }]}>
            Present
          </Text>
        </View>
        <View style={[attendanceStyles.statCard, { backgroundColor: colors.muted }]}>
          <Text style={[attendanceStyles.statValue, { color: "#EF4444" }]}>{absentCount}</Text>
          <Text style={[attendanceStyles.statLabel, { color: colors.mutedForeground }]}>
            Absent
          </Text>
        </View>
        <View style={[attendanceStyles.statCard, { backgroundColor: colors.muted }]}>
          <Text style={[attendanceStyles.statValue, { color: "#F59E0B" }]}>{lateCount}</Text>
          <Text style={[attendanceStyles.statLabel, { color: colors.mutedForeground }]}>
            Late
          </Text>
        </View>
      </View>

      <FlatList
        data={attendance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AttendanceRow item={item} colors={colors} />}
        contentContainerStyle={sharedStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Connections Tab
// ---------------------------------------------------------------------------

function ConnectionsTab({
  childId,
  colors,
  onAddConnection,
}: {
  childId: number;
  colors: ReturnType<typeof useTheme>["colors"];
  onAddConnection: () => void;
}) {
  const { data: connections = [], isLoading } = useSchoolConnections(childId);

  if (isLoading) {
    return (
      <View style={sharedStyles.centered}>
        <Text style={[sharedStyles.loadingText, { color: colors.mutedForeground }]}>
          Loading connections...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={connectionStyles.container}>
      {/* Platform info */}
      <Card style={connectionStyles.infoCard}>
        <View style={connectionStyles.infoHeader}>
          <Icon name="info" size={16} color={colors.primary} />
          <Text style={[connectionStyles.infoTitle, { color: colors.foreground }]}>
            Norwegian School Systems
          </Text>
        </View>
        <Text style={[connectionStyles.infoText, { color: colors.mutedForeground }]}>
          Connect to your child's school platform to automatically sync homework,
          grades, and attendance. Supported platforms:
        </Text>
        <View style={connectionStyles.platformList}>
          {[
            { name: "Visma Flyt Skole", desc: "OneRoster API" },
            { name: "itslearning", desc: "REST API" },
            { name: "Vigilo", desc: "OneRoster API" },
          ].map((p) => (
            <View key={p.name} style={connectionStyles.platformRow}>
              <Icon name="check" size={14} color={colors.primary} />
              <Text style={[connectionStyles.platformName, { color: colors.foreground }]}>
                {p.name}
              </Text>
              <Text style={[connectionStyles.platformDesc, { color: colors.mutedForeground }]}>
                ({p.desc})
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Existing connections */}
      {connections.length > 0 ? (
        <View style={connectionStyles.activeSection}>
          <Text style={[connectionStyles.sectionTitle, { color: colors.foreground }]}>
            Connected Schools
          </Text>
          {connections.map((conn) => (
            <Card key={conn.id} style={connectionStyles.connCard}>
              <View style={connectionStyles.connRow}>
                <View style={[connectionStyles.connIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Icon name="link" size={16} color={colors.primary} />
                </View>
                <View style={connectionStyles.connInfo}>
                  <Text style={[connectionStyles.connName, { color: colors.foreground }]}>
                    {conn.school_name}
                  </Text>
                  <Text style={[connectionStyles.connPlatform, { color: colors.mutedForeground }]}>
                    {PLATFORM_LABELS[conn.platform] ?? conn.platform}
                    {conn.municipality ? ` · ${conn.municipality}` : ""}
                  </Text>
                </View>
                <View style={[connectionStyles.activeBadge, { backgroundColor: "#0D948820" }]}>
                  <View style={connectionStyles.activeDot} />
                  <Text style={connectionStyles.activeText}>Active</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Add connection button */}
      <TouchableOpacity
        onPress={onAddConnection}
        style={[connectionStyles.addButton, { borderColor: colors.primary }]}
        activeOpacity={0.7}
      >
        <Icon name="plus" size={20} color={colors.primary} />
        <Text style={[connectionStyles.addText, { color: colors.primary }]}>
          Connect a School
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Add Connection Modal
// ---------------------------------------------------------------------------

function AddConnectionModal({
  visible,
  childId,
  onClose,
  colors,
}: {
  visible: boolean;
  childId: number;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [schoolName, setSchoolName] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [platform, setPlatform] = useState<string>("manual");

  const createMutation = useCreateSchoolConnection();

  const handleSubmit = useCallback(() => {
    if (!schoolName.trim()) {
      Alert.alert("Error", "School name is required");
      return;
    }

    createMutation.mutate(
      {
        child_id: childId,
        platform: platform as any,
        school_name: schoolName.trim(),
        municipality: municipality.trim() || null,
      },
      {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          setSchoolName("");
          setMunicipality("");
          setPlatform("manual");
          onClose();
        },
      },
    );
  }, [childId, schoolName, municipality, platform, createMutation, onClose]);

  const platforms = [
    { key: "visma_flyt", label: "Visma Flyt Skole" },
    { key: "itslearning", label: "itslearning" },
    { key: "vigilo", label: "Vigilo" },
    { key: "manual", label: "Manual Entry" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[modalStyles.safe, { backgroundColor: colors.background }]}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <Icon name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: colors.foreground }]}>
            Connect School
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            accessibilityLabel="Save"
          >
            <Text style={[modalStyles.saveText, { color: colors.primary }]}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.content}>
          {/* Platform selector */}
          <Text style={[modalStyles.label, { color: colors.foreground }]}>Platform</Text>
          <View style={modalStyles.platformGrid}>
            {platforms.map((p) => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPlatform(p.key)}
                style={[
                  modalStyles.platformChip,
                  { backgroundColor: platform === p.key ? colors.primary : colors.muted },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    modalStyles.platformChipText,
                    { color: platform === p.key ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* School name */}
          <Text style={[modalStyles.label, { color: colors.foreground }]}>School Name</Text>
          <TextInput
            value={schoolName}
            onChangeText={setSchoolName}
            placeholder="e.g., Oslo Skole"
            placeholderTextColor={colors.mutedForeground}
            style={[
              modalStyles.input,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />

          {/* Municipality */}
          <Text style={[modalStyles.label, { color: colors.foreground }]}>
            Municipality (Kommune)
          </Text>
          <TextInput
            value={municipality}
            onChangeText={setMunicipality}
            placeholder="e.g., Oslo"
            placeholderTextColor={colors.mutedForeground}
            style={[
              modalStyles.input,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />

          {platform !== "manual" ? (
            <Card style={modalStyles.noteCard}>
              <View style={modalStyles.noteRow}>
                <Icon name="info" size={14} color={colors.primary} />
                <Text style={[modalStyles.noteText, { color: colors.mutedForeground }]}>
                  API integration with {PLATFORM_LABELS[platform]} requires municipal
                  approval. Data sync will activate once your municipality enables
                  access. Until then, you can add entries manually.
                </Text>
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Add Homework Modal
// ---------------------------------------------------------------------------

function AddHomeworkModal({
  visible,
  childId,
  connectionId,
  onClose,
  colors,
}: {
  visible: boolean;
  childId: number;
  connectionId: string;
  onClose: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const createMutation = useCreateSchoolHomework();

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !subject.trim() || !dueDate.trim()) {
      Alert.alert("Error", "Title, subject, and due date are required");
      return;
    }

    createMutation.mutate(
      {
        child_id: childId,
        connection_id: connectionId,
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || null,
        due_date: dueDate.trim(),
        status: "assigned",
      },
      {
        onSuccess: () => {
          ReactNativeHapticFeedback.trigger("notificationSuccess");
          setTitle("");
          setSubject("");
          setDescription("");
          setDueDate("");
          onClose();
        },
      },
    );
  }, [childId, connectionId, title, subject, description, dueDate, createMutation, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[modalStyles.safe, { backgroundColor: colors.background }]}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <Icon name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[modalStyles.title, { color: colors.foreground }]}>Add Homework</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            accessibilityLabel="Save"
          >
            <Text style={[modalStyles.saveText, { color: colors.primary }]}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.content}>
          <Text style={[modalStyles.label, { color: colors.foreground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Chapter 5 exercises"
            placeholderTextColor={colors.mutedForeground}
            style={[
              modalStyles.input,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />

          <Text style={[modalStyles.label, { color: colors.foreground }]}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g., Matematikk"
            placeholderTextColor={colors.mutedForeground}
            style={[
              modalStyles.input,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />

          <Text style={[modalStyles.label, { color: colors.foreground }]}>
            Due Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-03-15"
            placeholderTextColor={colors.mutedForeground}
            style={[
              modalStyles.input,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />

          <Text style={[modalStyles.label, { color: colors.foreground }]}>
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Additional details..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              modalStyles.input,
              modalStyles.textArea,
              { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SchoolIntegrationScreen() {
  const { colors } = useTheme();
  const { data: childrenData } = useChildren();
  const childList = useMemo(() => childrenData ?? [], [childrenData]);

  const [selectedChildId, setSelectedChildId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<SchoolTab>("homework");
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);

  // Select first child when data arrives
  const effectiveChildId = selectedChildId || childList[0]?.id || 0;

  const { data: connections = [] } = useSchoolConnections(effectiveChildId);
  const firstConnectionId = connections[0]?.id;

  const renderTabContent = useCallback(() => {
    if (effectiveChildId === 0) {
      return (
        <View style={sharedStyles.emptyContainer}>
          <Icon name="users" size={48} color={colors.muted} />
          <Text style={[sharedStyles.emptyTitle, { color: colors.foreground }]}>
            No Children Added
          </Text>
          <Text style={[sharedStyles.emptySubtitle, { color: colors.mutedForeground }]}>
            Add children in your profile to start tracking school activities.
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case "homework":
        return (
          <HomeworkTab
            childId={effectiveChildId}
            connectionId={firstConnectionId}
            colors={colors}
          />
        );
      case "grades":
        return <GradesTab childId={effectiveChildId} colors={colors} />;
      case "attendance":
        return <AttendanceTab childId={effectiveChildId} colors={colors} />;
      case "connections":
        return (
          <ConnectionsTab
            childId={effectiveChildId}
            colors={colors}
            onAddConnection={() => setShowConnectionModal(true)}
          />
        );
      default:
        return null;
    }
  }, [activeTab, effectiveChildId, firstConnectionId, colors]);

  const showFab = activeTab === "homework" && firstConnectionId;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: colors.foreground }]}>School</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Homework, grades & attendance
          </Text>
        </View>
        <View style={[styles.flagBadge, { backgroundColor: colors.muted }]}>
          <Text style={styles.flag}>🇳🇴</Text>
        </View>
      </View>

      {/* Child picker */}
      <ChildPicker
        children={childList}
        selectedId={effectiveChildId}
        onSelect={setSelectedChildId}
        colors={colors}
      />

      {/* Summary banner */}
      <SummaryBanner colors={colors} />

      {/* Tab bar */}
      <TabBar activeTab={activeTab} onSelect={setActiveTab} colors={colors} />

      {/* Tab content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* FAB for adding homework */}
      {showFab ? (
        <TouchableOpacity
          onPress={() => setShowHomeworkModal(true)}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add homework"
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      {/* Modals */}
      <AddConnectionModal
        visible={showConnectionModal}
        childId={effectiveChildId}
        onClose={() => setShowConnectionModal(false)}
        colors={colors}
      />

      {firstConnectionId ? (
        <AddHomeworkModal
          visible={showHomeworkModal}
          childId={effectiveChildId}
          connectionId={firstConnectionId}
          onClose={() => setShowHomeworkModal(false)}
          colors={colors}
        />
      ) : null}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 2 },
  flagBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  flag: { fontSize: 20 },
  tabContent: { flex: 1 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});

const pickerStyles = StyleSheet.create({
  container: { maxHeight: 48 },
  content: { paddingHorizontal: 24, gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 14, fontWeight: "600" },
});

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  tabText: { fontSize: 12, fontWeight: "600" },
});

const summaryStyles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingVertical: 8 },
  row: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
});

const homeworkStyles = StyleSheet.create({
  card: { marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  emoji: { fontSize: 24 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  subject: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  description: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  dueText: { fontSize: 12, fontWeight: "500" },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: { fontSize: 13, fontWeight: "700" },
});

const gradeStyles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  subject: { fontSize: 15, fontWeight: "600" },
  term: { fontSize: 12, marginTop: 2 },
  date: { fontSize: 12, marginTop: 2 },
  gradeCircle: { flexDirection: "row", alignItems: "baseline" },
  gradeValue: { fontSize: 24, fontWeight: "700" },
  maxGrade: { fontSize: 14, fontWeight: "500" },
  commentBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
  },
  commentText: { fontSize: 12, flex: 1, lineHeight: 16 },
});

const attendanceStyles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  date: { fontSize: 14, fontWeight: "500" },
  subject: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
});

const connectionStyles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  infoCard: { gap: 8 },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 15, fontWeight: "600" },
  infoText: { fontSize: 13, lineHeight: 18 },
  platformList: { gap: 6, marginTop: 4 },
  platformRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  platformName: { fontSize: 13, fontWeight: "600" },
  platformDesc: { fontSize: 12 },
  activeSection: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  connCard: { paddingVertical: 12 },
  connRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  connIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  connInfo: { flex: 1 },
  connName: { fontSize: 14, fontWeight: "600" },
  connPlatform: { fontSize: 12, marginTop: 2 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D9488",
  },
  activeText: { fontSize: 11, fontWeight: "600", color: "#0D9488" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    borderStyle: "dashed",
    paddingVertical: 16,
  },
  addText: { fontSize: 15, fontWeight: "600" },
});

const modalStyles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 17, fontWeight: "700" },
  saveText: { fontSize: 16, fontWeight: "600" },
  content: { padding: 20, gap: 4 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  platformChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  platformChipText: { fontSize: 13, fontWeight: "600" },
  noteCard: { marginTop: 16, padding: 12 },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { fontSize: 12, flex: 1, lineHeight: 16 },
});

const sharedStyles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 14 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContent: { padding: 24, paddingBottom: 100 },
});

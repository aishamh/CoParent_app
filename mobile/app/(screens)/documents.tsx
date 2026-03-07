import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useDocuments } from "../../src/hooks/useDocuments";
import { useTheme } from "../../src/theme/useTheme";
import { useRefreshOnFocus } from "../../src/hooks/useRefreshOnFocus";
import { formatShortDate } from "../../src/utils/formatDate";
import type { Document } from "../../src/types/schema";

type CategoryFilter =
  | "all"
  | "medical"
  | "legal"
  | "school"
  | "court"
  | "receipt"
  | "other";

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  "medical",
  "legal",
  "school",
  "court",
  "receipt",
  "other",
];

const CATEGORY_COLORS: Record<string, string> = {
  medical: "#EF4444",
  legal: "#6366F1",
  school: "#A855F7",
  court: "#F97316",
  receipt: "#22C55E",
  other: "#6B7280",
};

const FILE_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  "application/pdf": "file-text",
  "image/jpeg": "image",
  "image/png": "image",
  "application/msword": "file-text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file-text",
};

function getFileIcon(fileType: string): keyof typeof Feather.glyphMap {
  return FILE_ICONS[fileType] ?? "file";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const { colors } = useTheme();

  const apiCategory = categoryFilter === "all" ? undefined : categoryFilter;
  const { data: documents = [], isLoading, isRefetching, refetch } = useDocuments(apiCategory);
  useRefreshOnFocus(["documents"]);

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

  function DocumentCard({ document }: { document: Document }) {
    const categoryColor = CATEGORY_COLORS[document.category] ?? CATEGORY_COLORS.other;
    const icon = getFileIcon(document.file_type);

    return (
      <View
        style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="summary"
      >
        <View style={[styles.docIconWrapper, { backgroundColor: colors.muted }]}>
          <Feather name={icon} size={24} color={categoryColor} />
        </View>
        <View style={styles.docContent}>
          <Text style={[styles.docTitle, { color: colors.foreground }]} numberOfLines={1}>
            {document.title}
          </Text>
          <View style={styles.docMeta}>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18` }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {document.category}
              </Text>
            </View>
            <Text style={[styles.docDetail, { color: colors.mutedForeground }]}>
              {formatShortDate(document.created_at)}
            </Text>
            <Text style={[styles.docDetail, { color: colors.mutedForeground }]}>
              {formatFileSize(document.file_size)}
            </Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.border} />
      </View>
    );
  }

  function EmptyDocuments() {
    return (
      <View style={styles.emptyState}>
        <Feather name="folder" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>No documents</Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Upload documents to keep important files organized.
        </Text>
      </View>
    );
  }

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Upload Document", "Upload feature coming soon.");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={[]}>
      <Stack.Screen options={{ title: "Documents" }} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORY_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            isActive={categoryFilter === filter}
            onPress={() => setCategoryFilter(filter)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : documents.length === 0 ? (
        <EmptyDocuments />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <DocumentCard document={item} />}
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
        accessibilityLabel="Upload document"
      >
        <Feather name="upload" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  docIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docContent: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  docDetail: {
    fontSize: 11,
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

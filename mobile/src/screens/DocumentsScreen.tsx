import React, { useState, useMemo, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import DocumentPicker from "react-native-document-picker";

import {
  useDocuments,
  useUploadDocument,
  useDeleteDocument,
} from "../hooks/useDocuments";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatShortDate } from "../utils/formatDate";
import Card from "../components/ui/Card";
import type { Document } from "../types/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CategoryFilter =
  | "all"
  | "medical"
  | "legal"
  | "school"
  | "court"
  | "receipt"
  | "other";

type SortField = "date" | "name" | "size";
type SortDirection = "asc" | "desc";
type ViewMode = "list" | "grid";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const FILE_ICON_MAP: Record<string, string> = {
  "application/pdf": "file-text",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/msword": "file-text",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "file-text",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "file-text",
  "text/plain": "file-text",
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function getFileIcon(fileType: string): string {
  return FILE_ICON_MAP[fileType] ?? "file";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function countUniqueCategories(documents: Document[]): number {
  return new Set(documents.map((doc) => doc.category)).size;
}

function countRecentUploads(documents: Document[]): number {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return documents.filter(
    (doc) => new Date(doc.created_at).getTime() > sevenDaysAgo,
  ).length;
}

function calculateTotalStorage(documents: Document[]): number {
  return documents.reduce((sum, doc) => sum + doc.file_size, 0);
}

function sortDocuments(
  documents: Document[],
  field: SortField,
  direction: SortDirection,
): Document[] {
  const sorted = [...documents].sort((a, b) => {
    switch (field) {
      case "name":
        return a.title.localeCompare(b.title);
      case "size":
        return a.file_size - b.file_size;
      case "date":
      default:
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  });

  const shouldReverse =
    (field === "date" && direction === "asc") ||
    (field !== "date" && direction === "desc");

  return shouldReverse ? sorted.reverse() : sorted;
}

function filterBySearch(documents: Document[], query: string): Document[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return documents;
  return documents.filter((doc) =>
    doc.title.toLowerCase().includes(trimmed),
  );
}

function buildCategoryCounts(documents: Document[]): Record<string, number> {
  const counts: Record<string, number> = { all: documents.length };
  for (const doc of documents) {
    counts[doc.category] = (counts[doc.category] ?? 0) + 1;
  }
  return counts;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function DocumentsScreen() {
  // -- State -----------------------------------------------------------------
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // -- Theme -----------------------------------------------------------------
  const { colors } = useTheme();

  // -- Data ------------------------------------------------------------------
  const apiCategory = categoryFilter === "all" ? undefined : categoryFilter;
  const {
    data: documents = [],
    isLoading,
    isRefetching,
    refetch,
  } = useDocuments(apiCategory);

  useRefreshOnFocus(["documents"]);

  const { data: allDocuments = [] } = useDocuments();

  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();

  // -- Derived ---------------------------------------------------------------
  const totalStorage = useMemo(
    () => calculateTotalStorage(allDocuments),
    [allDocuments],
  );
  const uniqueCategories = useMemo(
    () => countUniqueCategories(allDocuments),
    [allDocuments],
  );
  const recentUploads = useMemo(
    () => countRecentUploads(allDocuments),
    [allDocuments],
  );
  const categoryCounts = useMemo(
    () => buildCategoryCounts(allDocuments),
    [allDocuments],
  );
  const processedDocuments = useMemo(
    () => sortDocuments(filterBySearch(documents, searchQuery), sortField, sortDirection),
    [documents, searchQuery, sortField, sortDirection],
  );

  // -- Handlers --------------------------------------------------------------

  const handleSortPress = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection(field === "date" ? "desc" : "asc");
      }
    },
    [sortField],
  );

  const handleDelete = useCallback(
    (doc: Document) => {
      ReactNativeHapticFeedback.trigger("impactMedium");
      Alert.alert(
        "Delete Document",
        `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteMutation.mutate(Number(doc.id), {
                onSuccess: () => {
                  ReactNativeHapticFeedback.trigger("notificationSuccess");
                },
                onError: () => {
                  ReactNativeHapticFeedback.trigger("notificationError");
                  Alert.alert("Error", "Could not delete document. Please try again.");
                },
              });
            },
          },
        ],
      );
    },
    [deleteMutation],
  );

  const handleShare = useCallback(async (doc: Document) => {
    ReactNativeHapticFeedback.trigger("impactLight");
    try {
      await Share.share({
        title: doc.title,
        message: `Check out this document: ${doc.title}`,
        url: doc.file_path,
      });
    } catch {
      // User cancelled or share failed silently
    }
  }, []);

  const handleUpload = useCallback(async () => {
    ReactNativeHapticFeedback.trigger("impactLight");

    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const file = result[0];
      if (!file) return;

      uploadMutation.mutate(
        {
          fileUri: file.uri,
          fileName: file.name ?? "untitled",
          fileType: file.type ?? "application/octet-stream",
          metadata: {
            category: categoryFilter === "all" ? undefined : categoryFilter,
          },
        },
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            Alert.alert("Uploaded", "Document uploaded successfully.");
          },
          onError: () => {
            ReactNativeHapticFeedback.trigger("notificationError");
            Alert.alert(
              "Upload Failed",
              "Could not upload document. Please try again.",
            );
          },
        },
      );
    } catch (error) {
      if (DocumentPicker.isCancel(error)) return;
      Alert.alert("Error", "Could not open file picker.");
    }
  }, [uploadMutation, categoryFilter]);

  // -- Sub-components --------------------------------------------------------

  const renderStorageStats = () => (
    <View style={styles.statsRow}>
      <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Icon name="file" size={16} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {allDocuments.length}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          Total Documents
        </Text>
      </Card>

      <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Icon name="hard-drive" size={16} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {formatFileSize(totalStorage)}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          Storage Used
        </Text>
      </Card>

      <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Icon name="tag" size={16} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {uniqueCategories}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          Categories
        </Text>
      </Card>

      <Card style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Icon name="upload-cloud" size={16} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {recentUploads > 0 ? recentUploads : "---"}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          {recentUploads > 0 ? "Recent Uploads" : "No uploads yet"}
        </Text>
      </Card>
    </View>
  );

  const renderSearchBar = () => (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <Icon name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        style={[styles.searchInput, { color: colors.foreground }]}
        placeholder="Search documents..."
        placeholderTextColor={colors.mutedForeground}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Search documents"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={() => setSearchQuery("")}
          accessibilityLabel="Clear search"
        >
          <Icon name="x" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSortAndViewControls = () => {
    const sortArrowIcon = sortDirection === "asc" ? "arrow-up" : "arrow-down";

    return (
      <View style={styles.controlsRow}>
        <View style={styles.sortButtons}>
          {(["date", "name", "size"] as SortField[]).map((field) => {
            const isActive = sortField === field;
            return (
              <TouchableOpacity
                key={field}
                onPress={() => handleSortPress(field)}
                style={[
                  styles.sortButton,
                  { backgroundColor: colors.muted },
                  isActive && { backgroundColor: colors.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${field}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    { color: colors.mutedForeground },
                    isActive && { color: colors.primaryForeground },
                  ]}
                >
                  {capitalizeFirst(field)}
                </Text>
                {isActive && (
                  <Icon
                    name={sortArrowIcon}
                    size={12}
                    color={colors.primaryForeground}
                    style={styles.sortArrow}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => setViewMode("grid")}
            style={[
              styles.viewButton,
              { backgroundColor: colors.muted },
              viewMode === "grid" && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Grid view"
            accessibilityState={{ selected: viewMode === "grid" }}
          >
            <Icon
              name="grid"
              size={16}
              color={
                viewMode === "grid"
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            style={[
              styles.viewButton,
              { backgroundColor: colors.muted },
              viewMode === "list" && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="List view"
            accessibilityState={{ selected: viewMode === "list" }}
          >
            <Icon
              name="list"
              size={16}
              color={
                viewMode === "list"
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCategoryChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
    >
      {CATEGORY_FILTERS.map((filter) => {
        const isActive = categoryFilter === filter;
        const count = categoryCounts[filter] ?? 0;

        return (
          <TouchableOpacity
            key={filter}
            onPress={() => setCategoryFilter(filter)}
            style={[
              styles.chip,
              { backgroundColor: colors.muted },
              isActive && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${capitalizeFirst(filter)}`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.mutedForeground },
                isActive && { color: colors.primaryForeground },
              ]}
            >
              {capitalizeFirst(filter)} ({count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderUploadProgress = () => {
    if (!uploadMutation.isPending) return null;

    return (
      <View
        style={[
          styles.uploadProgressContainer,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.uploadProgressText, { color: colors.foreground }]}>
          Uploading document...
        </Text>
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      {renderStorageStats()}
      {renderSearchBar()}
      {renderSortAndViewControls()}
      {renderCategoryChips()}
      {renderUploadProgress()}
    </>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Icon name="folder" size={48} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
          No documents
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
          Upload documents to keep important files organized.
        </Text>
        <TouchableOpacity
          style={[styles.emptyUploadButton, { backgroundColor: colors.primary }]}
          onPress={handleUpload}
          accessibilityRole="button"
          accessibilityLabel="Upload your first document"
        >
          <Icon name="upload" size={16} color={colors.primaryForeground} />
          <Text
            style={[
              styles.emptyUploadText,
              { color: colors.primaryForeground },
            ]}
          >
            Upload Document
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDocumentListCard = ({ item }: { item: Document }) => {
    const categoryColor =
      CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other;
    const icon = getFileIcon(item.file_type);

    return (
      <View
        style={[
          styles.docCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        accessibilityRole="summary"
        accessibilityLabel={`Document: ${item.title}`}
      >
        <View style={[styles.docIconWrapper, { backgroundColor: colors.muted }]}>
          <Icon name={icon} size={24} color={categoryColor} />
        </View>

        <View style={styles.docContent}>
          <Text
            style={[styles.docTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.docMeta}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: `${categoryColor}18` },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>
            <Text style={[styles.docDetail, { color: colors.mutedForeground }]}>
              {formatFileSize(item.file_size)}
            </Text>
            <Text style={[styles.docDetail, { color: colors.mutedForeground }]}>
              {formatShortDate(item.created_at)}
            </Text>
          </View>
          {item.uploaded_by && (
            <Text
              style={[styles.uploadedByText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              Uploaded by {item.uploaded_by}
            </Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleShare(item)}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            accessibilityRole="button"
            accessibilityLabel={`Share ${item.title}`}
          >
            <Icon name="share-2" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
          >
            <Icon name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDocumentGridCard = ({ item }: { item: Document }) => {
    const categoryColor =
      CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other;
    const icon = getFileIcon(item.file_type);

    return (
      <View
        style={[
          styles.gridCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        accessibilityRole="summary"
        accessibilityLabel={`Document: ${item.title}`}
      >
        <View style={styles.gridCardHeader}>
          <View
            style={[styles.gridIconWrapper, { backgroundColor: colors.muted }]}
          >
            <Icon name={icon} size={28} color={categoryColor} />
          </View>
          <View style={styles.gridActions}>
            <TouchableOpacity
              onPress={() => handleShare(item)}
              style={[
                styles.gridActionButton,
                { backgroundColor: colors.muted },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Share ${item.title}`}
            >
              <Icon name="share-2" size={12} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={[
                styles.gridActionButton,
                { backgroundColor: colors.muted },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
            >
              <Icon name="trash-2" size={12} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={[styles.gridTitle, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${categoryColor}18`, alignSelf: "flex-start" },
          ]}
        >
          <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
            {item.category}
          </Text>
        </View>

        <Text style={[styles.gridDetail, { color: colors.mutedForeground }]}>
          {formatFileSize(item.file_size)}
        </Text>
        <Text style={[styles.gridDetail, { color: colors.mutedForeground }]}>
          {formatShortDate(item.created_at)}
        </Text>
        {item.uploaded_by && (
          <Text
            style={[styles.gridUploadedBy, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            By {item.uploaded_by}
          </Text>
        )}
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: Document }) =>
      viewMode === "grid"
        ? renderDocumentGridCard({ item })
        : renderDocumentListCard({ item }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewMode, colors, handleDelete, handleShare],
  );

  // -- Render ----------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={[]}
    >
      <FlatList
        data={processedDocuments}
        keyExtractor={(item) => String(item.id)}
        key={viewMode}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Upload FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleUpload}
        activeOpacity={0.8}
        disabled={uploadMutation.isPending}
        accessibilityRole="button"
        accessibilityLabel="Upload document"
      >
        {uploadMutation.isPending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Icon name="upload" size={24} color={colors.primaryForeground} />
        )}
      </TouchableOpacity>
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

  // -- Storage stats ---------------------------------------------------------
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },

  // -- Search ----------------------------------------------------------------
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  // -- Sort / View controls --------------------------------------------------
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 12,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 6,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sortArrow: {
    marginLeft: 4,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
  },

  // -- Category chips --------------------------------------------------------
  chipRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // -- Upload progress -------------------------------------------------------
  uploadProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    gap: 10,
  },
  uploadProgressText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // -- List container --------------------------------------------------------
  listContainer: {
    paddingBottom: 80,
  },
  loaderContainer: {
    paddingTop: 60,
    alignItems: "center",
  },

  // -- List card -------------------------------------------------------------
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    marginHorizontal: 24,
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
    flexWrap: "wrap",
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
  uploadedByText: {
    fontSize: 10,
    marginTop: 3,
  },
  cardActions: {
    flexDirection: "column",
    gap: 6,
    marginLeft: 8,
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // -- Grid card -------------------------------------------------------------
  gridRow: {
    paddingHorizontal: 24,
    gap: 10,
  },
  gridCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  gridCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  gridIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  gridActions: {
    flexDirection: "row",
    gap: 4,
  },
  gridActionButton: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  gridDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  gridUploadedBy: {
    fontSize: 10,
    marginTop: 3,
  },

  // -- Empty state -----------------------------------------------------------
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
  emptyUploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyUploadText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // -- FAB -------------------------------------------------------------------
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

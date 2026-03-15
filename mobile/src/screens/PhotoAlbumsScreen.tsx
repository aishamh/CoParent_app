import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  usePhotoAlbums,
  useCreatePhotoAlbum,
  useDeletePhotoAlbum,
} from "../hooks/usePhotos";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { formatShortDate } from "../utils/formatDate";
import type { PhotoAlbum } from "../types/schema";
import type { ScreensStackParamList } from "../navigation/types";

type NavigationProp = NativeStackNavigationProp<ScreensStackParamList>;

// ---------------------------------------------------------------------------
// Create Album Modal
// ---------------------------------------------------------------------------

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  isLoading: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}

function CreateAlbumModal({
  visible,
  onClose,
  onSubmit,
  isLoading,
  colors,
}: CreateAlbumModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setTitle("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            New Album
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
            placeholder="Album name"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            autoFocus
            maxLength={50}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalButton}>
              <Text style={{ color: colors.mutedForeground }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!title.trim() || isLoading}
              style={[
                styles.modalButton,
                styles.modalPrimaryButton,
                { backgroundColor: colors.primary },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalPrimaryText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Album Card
// ---------------------------------------------------------------------------

interface AlbumCardProps {
  album: PhotoAlbum;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
  onDelete: () => void;
}

function AlbumCard({ album, colors, onPress, onDelete }: AlbumCardProps) {
  const handleLongPress = () => {
    ReactNativeHapticFeedback.trigger("impactMedium");
    Alert.alert("Delete Album", `Delete "${album.title}" and all its photos?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.albumCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Album: ${album.title}`}
    >
      {album.cover_photo_url &&
      !album.cover_photo_url.startsWith("data:") ? (
        <Image
          source={{ uri: album.cover_photo_url }}
          style={styles.albumCover}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.albumCoverPlaceholder,
            { backgroundColor: colors.muted },
          ]}
        >
          <Icon name="image" size={32} color={colors.mutedForeground} />
        </View>
      )}

      <View style={styles.albumInfo}>
        <Text
          style={[styles.albumTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {album.title}
        </Text>
        <Text style={[styles.albumDate, { color: colors.mutedForeground }]}>
          {formatShortDate(album.created_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PhotoAlbumsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { data: albums, isLoading, refetch } = usePhotoAlbums();
  const createAlbum = useCreatePhotoAlbum();
  const deleteAlbumMutation = useDeletePhotoAlbum();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useRefreshOnFocus(["photoAlbums"]);

  const handleCreateAlbum = useCallback(
    (title: string) => {
      createAlbum.mutate(
        { title },
        {
          onSuccess: () => {
            ReactNativeHapticFeedback.trigger("notificationSuccess");
            setShowCreateModal(false);
          },
          onError: () => {
            Alert.alert("Error", "Failed to create album. Please try again.");
          },
        },
      );
    },
    [createAlbum],
  );

  const handleDeleteAlbum = useCallback(
    (albumId: string) => {
      deleteAlbumMutation.mutate(albumId, {
        onSuccess: () =>
          ReactNativeHapticFeedback.trigger("notificationSuccess"),
      });
    },
    [deleteAlbumMutation],
  );

  const handleAlbumPress = useCallback(
    (album: PhotoAlbum) => {
      navigation.navigate("PhotoAlbumDetail", {
        albumId: album.id,
        albumTitle: album.title,
      });
    },
    [navigation],
  );

  const renderAlbum = useCallback(
    ({ item }: { item: PhotoAlbum }) => (
      <AlbumCard
        album={item}
        colors={colors}
        onPress={() => handleAlbumPress(item)}
        onDelete={() => handleDeleteAlbum(item.id)}
      />
    ),
    [colors, handleAlbumPress, handleDeleteAlbum],
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="camera" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No Photo Albums Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Create an album to share photos with your co-parent.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={albums ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderAlbum}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB: Create Album */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCreateModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Create new album"
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <CreateAlbumModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAlbum}
        isLoading={createAlbum.isPending}
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
  listContent: { padding: 12, paddingBottom: 80 },
  row: { justifyContent: "space-between" },

  albumCard: {
    width: "48%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  albumCover: { width: "100%", height: 140 },
  albumCoverPlaceholder: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  albumInfo: { padding: 10 },
  albumTitle: { fontSize: 14, fontWeight: "600" },
  albumDate: { fontSize: 11, marginTop: 2 },

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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: { borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalPrimaryButton: { minWidth: 80, alignItems: "center" },
  modalPrimaryText: { color: "#fff", fontWeight: "600" },
});

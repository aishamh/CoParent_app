import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import ReactNativeHapticFeedback from "react-native-haptic-feedback";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { ActionSheetIOS, Platform } from "react-native";

import { useAlbumPhotos, useUploadPhoto, useDeletePhoto } from "../hooks/usePhotos";
import { useTheme } from "../theme/useTheme";
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import type { Photo } from "../types/schema";
import type { ScreensStackParamList } from "../navigation/types";

type DetailRouteProp = RouteProp<ScreensStackParamList, "PhotoAlbumDetail">;

const SCREEN_WIDTH = Dimensions.get("window").width;
const PHOTO_SIZE = (SCREEN_WIDTH - 12 * 4) / 3; // 3 columns with 12px gap

// ---------------------------------------------------------------------------
// Lightbox Modal
// ---------------------------------------------------------------------------

interface LightboxProps {
  photo: Photo | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

function Lightbox({ photo, visible, onClose, onDelete, colors }: LightboxProps) {
  if (!photo) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.lightboxOverlay}>
        <TouchableOpacity
          style={styles.lightboxClose}
          onPress={onClose}
          accessibilityLabel="Close"
        >
          <Icon name="x" size={28} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{ uri: photo.file_url }}
          style={styles.lightboxImage}
          resizeMode="contain"
        />

        {photo.caption ? (
          <Text style={styles.lightboxCaption}>{photo.caption}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.lightboxDelete, { backgroundColor: colors.destructive || "#dc2626" }]}
          onPress={() => {
            Alert.alert("Delete Photo", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  onDelete(photo.id);
                  onClose();
                },
              },
            ]);
          }}
          accessibilityLabel="Delete photo"
        >
          <Icon name="trash-2" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Photo Thumbnail
// ---------------------------------------------------------------------------

interface PhotoThumbnailProps {
  photo: Photo;
  onPress: () => void;
}

function PhotoThumbnail({ photo, onPress }: PhotoThumbnailProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="image"
      accessibilityLabel={photo.caption || "Photo"}
    >
      <Image
        source={{ uri: photo.thumbnail_url || photo.file_url }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PhotoAlbumDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<DetailRouteProp>();
  const { albumId } = route.params;

  const { data: photos, isLoading, refetch } = useAlbumPhotos(albumId);
  const uploadPhotoMutation = useUploadPhoto();
  const deletePhotoMutation = useDeletePhoto(albumId);

  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useRefreshOnFocus(["albumPhotos", albumId]);

  const showPickerOptions = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleCamera();
          else if (buttonIndex === 2) handleLibrary();
        },
      );
    } else {
      handleLibrary();
    }
  }, []);

  const handleCamera = useCallback(() => {
    launchCamera({ mediaType: "photo", quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      performUpload(asset.uri, asset.fileName || "photo.jpg", asset.type || "image/jpeg");
    });
  }, []);

  const handleLibrary = useCallback(() => {
    launchImageLibrary({ mediaType: "photo", quality: 0.8 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      performUpload(asset.uri, asset.fileName || "photo.jpg", asset.type || "image/jpeg");
    });
  }, []);

  const performUpload = useCallback(
    (fileUri: string, fileName: string, fileType: string) => {
      uploadPhotoMutation.mutate(
        { albumId, fileUri, fileName, fileType },
        {
          onSuccess: () =>
            ReactNativeHapticFeedback.trigger("notificationSuccess"),
          onError: () =>
            Alert.alert("Error", "Failed to upload photo. Please try again."),
        },
      );
    },
    [albumId, uploadPhotoMutation],
  );

  const handleDeletePhoto = useCallback(
    (photoId: string) => {
      deletePhotoMutation.mutate(photoId, {
        onSuccess: () =>
          ReactNativeHapticFeedback.trigger("notificationSuccess"),
      });
    },
    [deletePhotoMutation],
  );

  const renderPhoto = useCallback(
    ({ item }: { item: Photo }) => (
      <PhotoThumbnail photo={item} onPress={() => setSelectedPhoto(item)} />
    ),
    [],
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon name="image" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        No Photos Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Tap + to add photos to this album.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {uploadPhotoMutation.isPending && (
        <View style={[styles.uploadBanner, { backgroundColor: colors.primary }]}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.uploadBannerText}>Uploading photo...</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={photos ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoto}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
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

      {/* FAB: Add Photo */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={showPickerOptions}
        accessibilityRole="button"
        accessibilityLabel="Add photo"
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Lightbox
        photo={selectedPhoto}
        visible={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDelete={handleDeletePhoto}
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
  gridContent: { padding: 8, paddingBottom: 80 },

  thumbnail: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 6,
    margin: 4,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
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

  uploadBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
  },
  uploadBannerText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  lightboxOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxImage: { width: "100%", height: "70%" },
  lightboxCaption: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  lightboxDelete: {
    position: "absolute",
    bottom: 60,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});

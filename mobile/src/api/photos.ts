import { fetchApi } from "./client";
import type { PhotoAlbum, Photo } from "../types/schema";

// ============================================================
// Photo Album API
// ============================================================

export async function getPhotoAlbums(): Promise<PhotoAlbum[]> {
  try {
    return await fetchApi<PhotoAlbum[]>("/api/photo-albums");
  } catch {
    return [];
  }
}

export async function getPhotoAlbum(
  albumId: string,
): Promise<PhotoAlbum | null> {
  try {
    return await fetchApi<PhotoAlbum>(`/api/photo-albums/${albumId}`);
  } catch {
    return null;
  }
}

export async function createPhotoAlbum(
  title: string,
  childId?: number,
): Promise<PhotoAlbum | null> {
  try {
    return await fetchApi<PhotoAlbum>("/api/photo-albums", {
      method: "POST",
      body: JSON.stringify({
        title,
        child_id: childId ?? null,
      }),
    });
  } catch {
    return null;
  }
}

export async function deletePhotoAlbum(albumId: string): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/photo-albums/${albumId}`, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Photo API
// ============================================================

export async function getAlbumPhotos(albumId: string): Promise<Photo[]> {
  try {
    return await fetchApi<Photo[]>(`/api/photo-albums/${albumId}/photos`);
  } catch {
    return [];
  }
}

export async function uploadPhoto(
  albumId: string,
  fileUri: string,
  fileName: string,
  fileType: string,
  caption?: string,
): Promise<Photo | null> {
  try {
    const formData = new FormData();
    formData.append("photo", {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);

    if (caption) {
      formData.append("caption", caption);
    }

    return await fetchApi<Photo>(`/api/photo-albums/${albumId}/photos`, {
      method: "POST",
      body: formData,
    });
  } catch {
    return null;
  }
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/photos/${photoId}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Attachment Upload (for message attachments)
// ============================================================

interface AttachmentUploadResult {
  url: string;
  type: "image" | "file";
  filename: string;
  size: number;
}

export async function uploadAttachment(
  fileUri: string,
  fileName: string,
  fileType: string,
): Promise<AttachmentUploadResult | null> {
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);

    return await fetchApi<AttachmentUploadResult>("/api/attachments/upload", {
      method: "POST",
      body: formData,
    });
  } catch {
    return null;
  }
}

import { fetchApi, type PaginatedResponse } from "./client";
import type { Document } from "../types/schema";

export async function getDocuments(
  category?: string,
  childId?: number,
): Promise<Document[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (childId) params.set("childId", String(childId));

    const query = params.toString();
    const path = query ? `/api/documents?${query}` : "/api/documents";
    const response = await fetchApi<PaginatedResponse<Document>>(path);
    return response.data;
  } catch {
    return [];
  }
}

interface DocumentMetadata {
  child_id?: number;
  category?: string;
  description?: string;
}

export async function uploadDocument(
  fileUri: string,
  fileName: string,
  fileType: string,
  metadata: DocumentMetadata,
): Promise<Document | null> {
  try {
    const formData = new FormData();

    // React Native file upload: append file as object with uri, name, type
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as unknown as Blob);

    if (metadata.child_id) {
      formData.append("child_id", String(metadata.child_id));
    }
    if (metadata.category) {
      formData.append("category", metadata.category);
    }
    if (metadata.description) {
      formData.append("description", metadata.description);
    }

    return await fetchApi<Document>("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
  } catch {
    return null;
  }
}

export async function deleteDocument(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/documents/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

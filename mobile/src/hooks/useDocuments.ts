import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
} from "../api/documents";

interface UploadDocumentParams {
  fileUri: string;
  fileName: string;
  fileType: string;
  metadata: {
    child_id?: number;
    category?: string;
    description?: string;
  };
}

export function useDocuments(category?: string, childId?: number) {
  return useQuery({
    queryKey: ["documents", category, childId].filter(Boolean),
    queryFn: () => getDocuments(category, childId),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileUri, fileName, fileType, metadata }: UploadDocumentParams) =>
      uploadDocument(fileUri, fileName, fileType, metadata),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

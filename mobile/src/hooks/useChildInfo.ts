import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChildInfoEntries,
  createChildInfoEntry,
  updateChildInfoEntry,
  deleteChildInfoEntry,
} from "../api/childInfo";

export function useChildInfoEntries(childId: number) {
  return useQuery({
    queryKey: ["childInfo", childId],
    queryFn: () => getChildInfoEntries(childId),
    enabled: childId > 0,
  });
}

interface CreateEntryParams {
  child_id: number;
  category: string;
  label: string;
  value: string;
}

export function useCreateChildInfoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntryParams) => createChildInfoEntry(data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["childInfo", variables.child_id],
      }),
  });
}

interface UpdateEntryParams {
  id: string;
  childId: number;
  data: { label?: string; value?: string; category?: string };
}

export function useUpdateChildInfoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateEntryParams) =>
      updateChildInfoEntry(id, data),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["childInfo", variables.childId],
      }),
  });
}

interface DeleteEntryParams {
  id: string;
  childId: number;
}

export function useDeleteChildInfoEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: DeleteEntryParams) => deleteChildInfoEntry(id),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["childInfo", variables.childId],
      }),
  });
}

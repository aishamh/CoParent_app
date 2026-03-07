import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getReadingList,
  createReadingListItem,
  updateReadingListItem,
  getSchoolTasks,
  createSchoolTask,
  updateSchoolTask,
  getHandoverNotes,
  createHandoverNote,
} from "../api/education";
import type {
  ReadingListItem,
  SchoolTask,
} from "../types/schema";

// --- Reading List ---

export function useReadingList(childId?: number) {
  return useQuery({
    queryKey: childId ? ["readingList", childId] : ["readingList"],
    queryFn: () => getReadingList(childId),
  });
}

export function useCreateReadingListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReadingListItem,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["readingList"] }),
  });
}

export function useUpdateReadingListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<ReadingListItem>;
    }) => updateReadingListItem(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["readingList"] }),
  });
}

// --- School Tasks ---

export function useSchoolTasks(childId?: number) {
  return useQuery({
    queryKey: childId ? ["schoolTasks", childId] : ["schoolTasks"],
    queryFn: () => getSchoolTasks(childId),
  });
}

export function useCreateSchoolTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchoolTask,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["schoolTasks"] }),
  });
}

export function useUpdateSchoolTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<SchoolTask>;
    }) => updateSchoolTask(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["schoolTasks"] }),
  });
}

// --- Handover Notes ---

export function useHandoverNotes(childId?: number) {
  return useQuery({
    queryKey: childId ? ["handoverNotes", childId] : ["handoverNotes"],
    queryFn: () => getHandoverNotes(childId),
  });
}

export function useCreateHandoverNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHandoverNote,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["handoverNotes"] }),
  });
}

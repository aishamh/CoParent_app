import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "../api/journal";
import type { InsertJournalEntry, UpdateJournalEntry } from "../types/schema";

const JOURNAL_KEY = ["journal"] as const;

export function useJournalEntries() {
  return useQuery({
    queryKey: JOURNAL_KEY,
    queryFn: getJournalEntries,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertJournalEntry) => createJournalEntry(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateJournalEntry }) =>
      updateJournalEntry(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJournalEntry(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: JOURNAL_KEY }),
  });
}

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getExportHistory,
  exportMessages,
  exportExpenses,
  exportCalendar,
} from "../api/exports";

export function useExportHistory() {
  return useQuery({
    queryKey: ["exportHistory"],
    queryFn: getExportHistory,
  });
}

export function useExportMessages() {
  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => exportMessages(startDate, endDate),
  });
}

export function useExportExpenses() {
  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => exportExpenses(startDate, endDate),
  });
}

export function useExportCalendar() {
  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => exportCalendar(startDate, endDate),
  });
}

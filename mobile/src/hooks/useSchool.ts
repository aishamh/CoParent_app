import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchoolConnections,
  createSchoolConnection,
  deleteSchoolConnection,
  getSchoolHomework,
  createSchoolHomework,
  updateSchoolHomework,
  deleteSchoolHomework,
  getSchoolAttendance,
  createSchoolAttendance,
  getSchoolGrades,
  createSchoolGrade,
  getSchoolSummary,
} from "../api/school";
import type {
  InsertSchoolConnection,
  InsertSchoolHomework,
  UpdateSchoolHomework,
  InsertSchoolAttendance,
  InsertSchoolGrade,
} from "../types/schema";

// ----------------------------------------------------------
// Query Keys
// ----------------------------------------------------------

const SCHOOL_KEYS = {
  connections: ["schoolConnections"] as const,
  homework: ["schoolHomework"] as const,
  attendance: ["schoolAttendance"] as const,
  grades: ["schoolGrades"] as const,
  summary: ["schoolSummary"] as const,
};

// ----------------------------------------------------------
// Connections
// ----------------------------------------------------------

export function useSchoolConnections(childId?: number) {
  return useQuery({
    queryKey: [...SCHOOL_KEYS.connections, childId],
    queryFn: () => getSchoolConnections(childId),
  });
}

export function useCreateSchoolConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSchoolConnection) => createSchoolConnection(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.connections }),
  });
}

export function useDeleteSchoolConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchoolConnection(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.connections }),
  });
}

// ----------------------------------------------------------
// Homework
// ----------------------------------------------------------

export function useSchoolHomework(childId?: number, status?: string) {
  return useQuery({
    queryKey: [...SCHOOL_KEYS.homework, childId, status],
    queryFn: () => getSchoolHomework(childId, status),
  });
}

export function useCreateSchoolHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSchoolHomework) => createSchoolHomework(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.homework });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.summary });
    },
  });
}

export function useUpdateSchoolHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSchoolHomework }) =>
      updateSchoolHomework(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.homework });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.summary });
    },
  });
}

export function useDeleteSchoolHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchoolHomework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.homework });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.summary });
    },
  });
}

// ----------------------------------------------------------
// Attendance
// ----------------------------------------------------------

export function useSchoolAttendance(
  childId?: number,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: [...SCHOOL_KEYS.attendance, childId, from, to],
    queryFn: () => getSchoolAttendance(childId, from, to),
  });
}

export function useCreateSchoolAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSchoolAttendance) => createSchoolAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.attendance });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.summary });
    },
  });
}

// ----------------------------------------------------------
// Grades
// ----------------------------------------------------------

export function useSchoolGrades(childId?: number, subject?: string) {
  return useQuery({
    queryKey: [...SCHOOL_KEYS.grades, childId, subject],
    queryFn: () => getSchoolGrades(childId, subject),
  });
}

export function useCreateSchoolGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSchoolGrade) => createSchoolGrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.grades });
      queryClient.invalidateQueries({ queryKey: SCHOOL_KEYS.summary });
    },
  });
}

// ----------------------------------------------------------
// Dashboard Summary
// ----------------------------------------------------------

export function useSchoolSummary() {
  return useQuery({
    queryKey: SCHOOL_KEYS.summary,
    queryFn: getSchoolSummary,
  });
}

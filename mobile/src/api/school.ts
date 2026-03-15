import { fetchApi } from "./client";
import type {
  SchoolConnection,
  InsertSchoolConnection,
  SchoolHomework,
  InsertSchoolHomework,
  UpdateSchoolHomework,
  SchoolAttendance,
  InsertSchoolAttendance,
  SchoolGrade,
  InsertSchoolGrade,
} from "../types/schema";

// ----------------------------------------------------------
// School Connections
// ----------------------------------------------------------

export async function getSchoolConnections(
  childId?: number,
): Promise<SchoolConnection[]> {
  try {
    const params = childId ? `?child_id=${childId}` : "";
    return await fetchApi<SchoolConnection[]>(`/api/school/connections${params}`);
  } catch {
    return [];
  }
}

export async function createSchoolConnection(
  data: InsertSchoolConnection,
): Promise<SchoolConnection | null> {
  try {
    return await fetchApi<SchoolConnection>("/api/school/connections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteSchoolConnection(id: string): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/school/connections/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------
// Homework
// ----------------------------------------------------------

export async function getSchoolHomework(
  childId?: number,
  status?: string,
): Promise<SchoolHomework[]> {
  try {
    const params = new URLSearchParams();
    if (childId) params.set("child_id", String(childId));
    if (status) params.set("status", status);
    const query = params.toString();
    const result = await fetchApi<{ data: SchoolHomework[]; total: number }>(
      `/api/school/homework${query ? `?${query}` : ""}`,
    );
    return result.data;
  } catch {
    return [];
  }
}

export async function createSchoolHomework(
  data: InsertSchoolHomework,
): Promise<SchoolHomework | null> {
  try {
    return await fetchApi<SchoolHomework>("/api/school/homework", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function updateSchoolHomework(
  id: string,
  data: UpdateSchoolHomework,
): Promise<SchoolHomework | null> {
  try {
    return await fetchApi<SchoolHomework>(`/api/school/homework/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteSchoolHomework(id: string): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/school/homework/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------
// Attendance
// ----------------------------------------------------------

export async function getSchoolAttendance(
  childId?: number,
  from?: string,
  to?: string,
): Promise<SchoolAttendance[]> {
  try {
    const params = new URLSearchParams();
    if (childId) params.set("child_id", String(childId));
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return await fetchApi<SchoolAttendance[]>(
      `/api/school/attendance${query ? `?${query}` : ""}`,
    );
  } catch {
    return [];
  }
}

export async function createSchoolAttendance(
  data: InsertSchoolAttendance,
): Promise<SchoolAttendance | null> {
  try {
    return await fetchApi<SchoolAttendance>("/api/school/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

// ----------------------------------------------------------
// Grades
// ----------------------------------------------------------

export async function getSchoolGrades(
  childId?: number,
  subject?: string,
): Promise<SchoolGrade[]> {
  try {
    const params = new URLSearchParams();
    if (childId) params.set("child_id", String(childId));
    if (subject) params.set("subject", subject);
    const query = params.toString();
    return await fetchApi<SchoolGrade[]>(
      `/api/school/grades${query ? `?${query}` : ""}`,
    );
  } catch {
    return [];
  }
}

export async function createSchoolGrade(
  data: InsertSchoolGrade,
): Promise<SchoolGrade | null> {
  try {
    return await fetchApi<SchoolGrade>("/api/school/grades", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

// ----------------------------------------------------------
// Dashboard Summary
// ----------------------------------------------------------

export interface SchoolSummary {
  pending_homework: number;
  overdue_homework: number;
  recent_grades: SchoolGrade[];
  absences_last_30_days: number;
  connected_schools: number;
}

export async function getSchoolSummary(): Promise<SchoolSummary | null> {
  try {
    return await fetchApi<SchoolSummary>("/api/school/summary");
  } catch {
    return null;
  }
}

import { type Express } from "express";
import { db } from "../db";
import {
  schoolConnections,
  schoolHomework,
  schoolAttendance,
  schoolGrades,
} from "../tables";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertSchoolConnectionSchema,
  insertSchoolHomeworkSchema,
  updateSchoolHomeworkSchema,
  insertSchoolAttendanceSchema,
  insertSchoolGradeSchema,
} from "../../shared/schema";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function parsePageParams(query: {
  page?: string;
  limit?: string;
}): { offset: number; limit: number } {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "50", 10) || 50));
  return { offset: (page - 1) * limit, limit };
}

// ----------------------------------------------------------
// Route Registration
// ----------------------------------------------------------

export function registerSchoolRoutes(app: Express): void {
  // ========================================================
  // School Connections
  // ========================================================

  // POST /api/school/connections — Connect a child to a school
  app.post("/api/school/connections", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;
      const validated = insertSchoolConnectionSchema.parse(req.body);

      const [connection] = await db
        .insert(schoolConnections)
        .values({
          family_id: familyId,
          child_id: validated.child_id,
          platform: validated.platform,
          school_name: validated.school_name,
          municipality: validated.municipality ?? null,
          connected_by: userId,
        })
        .returning();

      res.status(201).json(connection);
    } catch (error) {
      console.error("[School] Connection create error:", error);
      res.status(400).json({ error: "Failed to create school connection" });
    }
  });

  // GET /api/school/connections — List school connections for the family
  app.get("/api/school/connections", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const childId = req.query.child_id
        ? parseInt(req.query.child_id as string, 10)
        : undefined;

      const conditions = [
        eq(schoolConnections.family_id, familyId),
        eq(schoolConnections.is_active, true),
      ];

      if (childId) {
        conditions.push(eq(schoolConnections.child_id, childId));
      }

      const connections = await db
        .select()
        .from(schoolConnections)
        .where(and(...conditions))
        .orderBy(desc(schoolConnections.created_at));

      res.json(connections);
    } catch (error) {
      console.error("[School] Connection list error:", error);
      res.status(500).json({ error: "Failed to fetch school connections" });
    }
  });

  // DELETE /api/school/connections/:id — Deactivate a school connection
  app.delete("/api/school/connections/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const connectionId = req.params.id;

      const [existing] = await db
        .select()
        .from(schoolConnections)
        .where(eq(schoolConnections.id, connectionId));

      if (!existing || existing.family_id !== familyId) {
        res.status(404).json({ error: "Connection not found" });
        return;
      }

      await db
        .update(schoolConnections)
        .set({ is_active: false, updated_at: new Date().toISOString() })
        .where(eq(schoolConnections.id, connectionId));

      res.status(204).send();
    } catch (error) {
      console.error("[School] Connection delete error:", error);
      res.status(500).json({ error: "Failed to remove school connection" });
    }
  });

  // ========================================================
  // Homework
  // ========================================================

  // POST /api/school/homework — Add homework entry
  app.post("/api/school/homework", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const validated = insertSchoolHomeworkSchema.parse(req.body);

      const [homework] = await db
        .insert(schoolHomework)
        .values({
          family_id: familyId,
          child_id: validated.child_id,
          connection_id: validated.connection_id,
          title: validated.title,
          subject: validated.subject,
          description: validated.description ?? null,
          due_date: validated.due_date,
          status: validated.status ?? "assigned",
          grade: validated.grade ?? null,
          max_grade: validated.max_grade ?? null,
        })
        .returning();

      res.status(201).json(homework);
    } catch (error) {
      console.error("[School] Homework create error:", error);
      res.status(400).json({ error: "Failed to add homework" });
    }
  });

  // GET /api/school/homework — List homework for the family
  app.get("/api/school/homework", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const childId = req.query.child_id
        ? parseInt(req.query.child_id as string, 10)
        : undefined;
      const status = req.query.status as string | undefined;
      const { offset, limit } = parsePageParams(req.query as any);

      const conditions = [eq(schoolHomework.family_id, familyId)];

      if (childId) {
        conditions.push(eq(schoolHomework.child_id, childId));
      }
      if (status) {
        conditions.push(eq(schoolHomework.status, status));
      }

      const whereClause = and(...conditions);

      const [entries, [totalRow]] = await Promise.all([
        db
          .select()
          .from(schoolHomework)
          .where(whereClause)
          .orderBy(desc(schoolHomework.due_date))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(schoolHomework).where(whereClause),
      ]);

      res.json({ data: entries, total: totalRow.total });
    } catch (error) {
      console.error("[School] Homework list error:", error);
      res.status(500).json({ error: "Failed to fetch homework" });
    }
  });

  // PATCH /api/school/homework/:id — Update homework status/grade
  app.patch("/api/school/homework/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const homeworkId = req.params.id;
      const validated = updateSchoolHomeworkSchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(schoolHomework)
        .where(eq(schoolHomework.id, homeworkId));

      if (!existing || existing.family_id !== familyId) {
        res.status(404).json({ error: "Homework not found" });
        return;
      }

      const [updated] = await db
        .update(schoolHomework)
        .set({ ...validated, updated_at: new Date().toISOString() })
        .where(eq(schoolHomework.id, homeworkId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[School] Homework update error:", error);
      res.status(400).json({ error: "Failed to update homework" });
    }
  });

  // DELETE /api/school/homework/:id — Remove homework
  app.delete("/api/school/homework/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const homeworkId = req.params.id;

      const [existing] = await db
        .select()
        .from(schoolHomework)
        .where(eq(schoolHomework.id, homeworkId));

      if (!existing || existing.family_id !== familyId) {
        res.status(404).json({ error: "Homework not found" });
        return;
      }

      await db.delete(schoolHomework).where(eq(schoolHomework.id, homeworkId));
      res.status(204).send();
    } catch (error) {
      console.error("[School] Homework delete error:", error);
      res.status(500).json({ error: "Failed to delete homework" });
    }
  });

  // ========================================================
  // Attendance
  // ========================================================

  // POST /api/school/attendance — Record attendance
  app.post("/api/school/attendance", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const validated = insertSchoolAttendanceSchema.parse(req.body);

      const [record] = await db
        .insert(schoolAttendance)
        .values({
          family_id: familyId,
          child_id: validated.child_id,
          connection_id: validated.connection_id,
          date: validated.date,
          status: validated.status,
          subject: validated.subject ?? null,
          note: validated.note ?? null,
        })
        .returning();

      res.status(201).json(record);
    } catch (error) {
      console.error("[School] Attendance create error:", error);
      res.status(400).json({ error: "Failed to record attendance" });
    }
  });

  // GET /api/school/attendance — List attendance records
  app.get("/api/school/attendance", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const childId = req.query.child_id
        ? parseInt(req.query.child_id as string, 10)
        : undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const conditions = [eq(schoolAttendance.family_id, familyId)];

      if (childId) {
        conditions.push(eq(schoolAttendance.child_id, childId));
      }
      if (from) {
        conditions.push(gte(schoolAttendance.date, from));
      }
      if (to) {
        conditions.push(lte(schoolAttendance.date, to));
      }

      const records = await db
        .select()
        .from(schoolAttendance)
        .where(and(...conditions))
        .orderBy(desc(schoolAttendance.date))
        .limit(100);

      res.json(records);
    } catch (error) {
      console.error("[School] Attendance list error:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  // ========================================================
  // Grades
  // ========================================================

  // POST /api/school/grades — Add a grade
  app.post("/api/school/grades", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const validated = insertSchoolGradeSchema.parse(req.body);

      const [grade] = await db
        .insert(schoolGrades)
        .values({
          family_id: familyId,
          child_id: validated.child_id,
          connection_id: validated.connection_id,
          subject: validated.subject,
          grade: validated.grade,
          max_grade: validated.max_grade ?? null,
          term: validated.term ?? null,
          date: validated.date,
          teacher_comment: validated.teacher_comment ?? null,
        })
        .returning();

      res.status(201).json(grade);
    } catch (error) {
      console.error("[School] Grade create error:", error);
      res.status(400).json({ error: "Failed to add grade" });
    }
  });

  // GET /api/school/grades — List grades
  app.get("/api/school/grades", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const childId = req.query.child_id
        ? parseInt(req.query.child_id as string, 10)
        : undefined;
      const subject = req.query.subject as string | undefined;

      const conditions = [eq(schoolGrades.family_id, familyId)];

      if (childId) {
        conditions.push(eq(schoolGrades.child_id, childId));
      }
      if (subject) {
        conditions.push(eq(schoolGrades.subject, subject));
      }

      const grades = await db
        .select()
        .from(schoolGrades)
        .where(and(...conditions))
        .orderBy(desc(schoolGrades.date))
        .limit(100);

      res.json(grades);
    } catch (error) {
      console.error("[School] Grades list error:", error);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  // ========================================================
  // Dashboard Summary
  // ========================================================

  // GET /api/school/summary — Quick summary for dashboard widget
  app.get("/api/school/summary", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const today = new Date().toISOString().split("T")[0];

      const [
        pendingHomework,
        overdueHomework,
        recentGrades,
        recentAbsences,
        connections,
      ] = await Promise.all([
        db
          .select({ total: count() })
          .from(schoolHomework)
          .where(
            and(
              eq(schoolHomework.family_id, familyId),
              eq(schoolHomework.status, "assigned"),
              gte(schoolHomework.due_date, today),
            ),
          ),
        db
          .select({ total: count() })
          .from(schoolHomework)
          .where(
            and(
              eq(schoolHomework.family_id, familyId),
              eq(schoolHomework.status, "assigned"),
              lte(schoolHomework.due_date, today),
            ),
          ),
        db
          .select()
          .from(schoolGrades)
          .where(eq(schoolGrades.family_id, familyId))
          .orderBy(desc(schoolGrades.created_at))
          .limit(3),
        db
          .select({ total: count() })
          .from(schoolAttendance)
          .where(
            and(
              eq(schoolAttendance.family_id, familyId),
              eq(schoolAttendance.status, "absent"),
              gte(schoolAttendance.date, getThirtyDaysAgo()),
            ),
          ),
        db
          .select({ total: count() })
          .from(schoolConnections)
          .where(
            and(
              eq(schoolConnections.family_id, familyId),
              eq(schoolConnections.is_active, true),
            ),
          ),
      ]);

      res.json({
        pending_homework: pendingHomework[0].total,
        overdue_homework: overdueHomework[0].total,
        recent_grades: recentGrades,
        absences_last_30_days: recentAbsences[0].total,
        connected_schools: connections[0].total,
      });
    } catch (error) {
      console.error("[School] Summary error:", error);
      res.status(500).json({ error: "Failed to fetch school summary" });
    }
  });
}

// ----------------------------------------------------------
// Utility
// ----------------------------------------------------------

function getThirtyDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split("T")[0];
}

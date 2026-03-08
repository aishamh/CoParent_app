import type { CustodyDay, CustodyTemplateType } from "../../shared/schema";

// ============================================================
// Custody Schedule Template Engine
// ============================================================
// Pure functions that generate custody day assignments from
// predefined schedule templates. Each template produces an
// array of CustodyDay objects representing which parent has
// custody on each calendar day.
// ============================================================

export interface CustodyEventBlock {
  parent: "A" | "B";
  startDate: string;
  endDate: string;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

// --- Template Generators ---

function generateWeekOnWeekOff(
  startDate: string,
  daysToGenerate: number
): CustodyDay[] {
  const days: CustodyDay[] = [];
  for (let i = 0; i < daysToGenerate; i++) {
    const weekIndex = Math.floor(i / 7);
    const parent: "A" | "B" = weekIndex % 2 === 0 ? "A" : "B";
    days.push({ date: addDays(startDate, i), parent });
  }
  return days;
}

function generate223(
  startDate: string,
  daysToGenerate: number
): CustodyDay[] {
  // 2-2-3 rotation over a 14-day cycle:
  // Week 1: Mon-Tue = A, Wed-Thu = B, Fri-Sat-Sun = A
  // Week 2: Mon-Tue = B, Wed-Thu = A, Fri-Sat-Sun = B
  const weekOnePattern: Array<"A" | "B"> = ["A", "A", "B", "B", "A", "A", "A"];
  const weekTwoPattern: Array<"A" | "B"> = ["B", "B", "A", "A", "B", "B", "B"];
  const fullCycle = [...weekOnePattern, ...weekTwoPattern];

  const days: CustodyDay[] = [];
  for (let i = 0; i < daysToGenerate; i++) {
    const cycleIndex = i % fullCycle.length;
    days.push({ date: addDays(startDate, i), parent: fullCycle[cycleIndex] });
  }
  return days;
}

function generateAlternatingWeekends(
  startDate: string,
  daysToGenerate: number
): CustodyDay[] {
  const days: CustodyDay[] = [];
  let weekendCount = 0;

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dow = getDayOfWeek(currentDate);
    const isWeekend = dow === 0 || dow === 6;

    if (isWeekend) {
      // Track weekend transitions: Saturday starts a new weekend
      if (dow === 6) {
        weekendCount++;
      }
      const parent: "A" | "B" = weekendCount % 2 === 1 ? "A" : "B";
      days.push({ date: currentDate, parent });
    } else {
      days.push({ date: currentDate, parent: "A" });
    }
  }
  return days;
}

function generateAlternatingWeekendsMidweek(
  startDate: string,
  daysToGenerate: number
): CustodyDay[] {
  const days: CustodyDay[] = [];
  let weekendCount = 0;

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(startDate, i);
    const dow = getDayOfWeek(currentDate);
    const isWeekend = dow === 0 || dow === 6;

    if (isWeekend) {
      if (dow === 6) {
        weekendCount++;
      }
      const parent: "A" | "B" = weekendCount % 2 === 1 ? "A" : "B";
      days.push({ date: currentDate, parent });
    } else if (dow === 3) {
      // Wednesday overnight goes to parent B
      days.push({ date: currentDate, parent: "B" });
    } else {
      days.push({ date: currentDate, parent: "A" });
    }
  }
  return days;
}

function generateCustomPattern(
  startDate: string,
  daysToGenerate: number,
  pattern: number[]
): CustodyDay[] {
  if (pattern.length === 0) {
    return [];
  }

  const days: CustodyDay[] = [];
  for (let i = 0; i < daysToGenerate; i++) {
    const cycleIndex = i % pattern.length;
    const parent: "A" | "B" = pattern[cycleIndex] === 1 ? "A" : "B";
    days.push({ date: addDays(startDate, i), parent });
  }
  return days;
}

// --- Main Generator ---

export function generateCustodyDays(
  templateType: CustodyTemplateType,
  startDate: string,
  daysToGenerate: number,
  customPattern?: number[]
): CustodyDay[] {
  switch (templateType) {
    case "week_on_week_off":
      return generateWeekOnWeekOff(startDate, daysToGenerate);
    case "2_2_3":
      return generate223(startDate, daysToGenerate);
    case "alternating_weekends":
      return generateAlternatingWeekends(startDate, daysToGenerate);
    case "alternating_weekends_midweek":
      return generateAlternatingWeekendsMidweek(startDate, daysToGenerate);
    case "custom":
      return generateCustomPattern(startDate, daysToGenerate, customPattern ?? []);
    default:
      return [];
  }
}

// --- Collapse to Calendar Events ---

export function collapseToCustodyEvents(days: CustodyDay[]): CustodyEventBlock[] {
  if (days.length === 0) {
    return [];
  }

  const blocks: CustodyEventBlock[] = [];
  let currentBlock: CustodyEventBlock = {
    parent: days[0].parent,
    startDate: days[0].date,
    endDate: days[0].date,
  };

  for (let i = 1; i < days.length; i++) {
    const day = days[i];
    if (day.parent === currentBlock.parent) {
      currentBlock.endDate = day.date;
    } else {
      blocks.push({ ...currentBlock });
      currentBlock = {
        parent: day.parent,
        startDate: day.date,
        endDate: day.date,
      };
    }
  }

  blocks.push({ ...currentBlock });
  return blocks;
}

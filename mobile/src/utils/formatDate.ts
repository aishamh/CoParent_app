import {
  format,
  isToday as dateFnsIsToday,
  isYesterday,
  differenceInHours,
  differenceInMinutes,
  parseISO,
} from "date-fns";

function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  return parseISO(input);
}

export function formatShortDate(input: string | Date): string {
  return format(toDate(input), "MMM d, yyyy");
}

export function formatFullDate(input: string | Date): string {
  return format(toDate(input), "EEEE, MMMM d, yyyy");
}

export function formatTime(input: string | Date): string {
  return format(toDate(input), "h:mm a");
}

export function formatRelative(input: string | Date): string {
  const date = toDate(input);
  const now = new Date();

  const minutesAgo = differenceInMinutes(now, date);
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hoursAgo = differenceInHours(now, date);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;

  if (isYesterday(date)) return "Yesterday";

  return formatShortDate(date);
}

export function isToday(input: string | Date): boolean {
  return dateFnsIsToday(toDate(input));
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

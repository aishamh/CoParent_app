export const API_BASE_URL = "https://co-parent-app-mu.vercel.app";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  CHILDREN: "/api/children",
  EVENTS: "/api/events",
  MESSAGES: "/api/messages",
  UNREAD_COUNT: "/api/messages/unread-count",
  EXPENSES: "/api/expenses",
  DOCUMENTS: "/api/documents",
  DOCUMENTS_UPLOAD: "/api/documents/upload",
  ACTIVITIES: "/api/activities",
  OSLO_EVENTS: "/api/oslo-events",
  FRIENDS: "/api/friends",
  SOCIAL_EVENTS: "/api/social-events",
  READING_LIST: "/api/reading-list",
  SCHOOL_TASKS: "/api/school-tasks",
  HANDOVER_NOTES: "/api/handover-notes",
} as const;

export type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];

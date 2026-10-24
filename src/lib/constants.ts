import type { DevRole, EventKind, TeamStatus } from "@/lib/database.types";

export const USC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Other"] as const;

export const ROLES: { value: DevRole; label: string }[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full-stack" },
];

export const TEAM_STATUSES: { value: TeamStatus; label: string }[] = [
  { value: "looking", label: "Looking for a team" },
  { value: "has_team", label: "Already have a team" },
];

export const TEAM_SIZES = [1, 2, 3, 4] as const;

export const LANGUAGES = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Dart",
  "Ruby",
  "PHP",
  "SQL",
  "R",
] as const;

export const EVENT_KIND_LABELS: Record<EventKind, string> = {
  event: "Event",
  workshop: "Workshop",
  meal: "Meal",
  treat: "Treat",
  deadline: "Deadline",
};

/** All schedule times are shown in USC's time zone, regardless of the viewer. */
export const EVENT_TIME_ZONE = "America/Los_Angeles";

export function roleLabel(role: DevRole) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function teamStatusLabel(status: TeamStatus) {
  return TEAM_STATUSES.find((s) => s.value === status)?.label ?? status;
}

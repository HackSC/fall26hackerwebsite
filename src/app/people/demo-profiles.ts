import type { Profile } from "@/lib/database.types";
import type { PeopleFilters } from "@/lib/data";

// UI-only fields. These do not exist in the Supabase profiles table.
export type DirectoryProfile = Profile & {
  uiRoles?: string[];
  cardNote?: string;
  openSpots?: number;
  teamLabel?: string;
  instagram?: string | null;
  phone?: string | null;
};

const demoDate = "2026-10-20T12:00:00.000Z";

// Fictional data for /people?demo=1 only. Nothing is saved to Supabase.
export const demoProfiles: DirectoryProfile[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Tommy",
    usc_year: "Junior",
    major: "Computer Science",
    email: "tommy@example.com",
    discord: "tommy.demo",
    link: null,
    avatar_url: null,
    skills: ["React", "Next.js", "Figma"],
    languages: ["TypeScript", "JavaScript", "Python"],
    role: "frontend",
    looking_for: "A backend developer to build a fun game.",
    team_size_pref: 4,
    team_status: "looking",
    search_text: "tommy frontend design mobile react typescript",
    created_at: demoDate,
    updated_at: demoDate,
    uiRoles: ["Frontend", "Design", "Mobile"],
    cardNote: "Needs backend",
    openSpots: 2,
    teamLabel: "Team of 2 · 2 spots open",
    instagram: "@tommy.demo",
    phone: "(202) 555-0112",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Trojan",
    usc_year: "Sophomore",
    major: "Data Science",
    email: "trojan@example.com",
    discord: "trojan.demo",
    link: null,
    avatar_url: null,
    skills: ["FastAPI", "Machine Learning", "PostgreSQL"],
    languages: ["Python", "SQL"],
    role: "backend",
    looking_for: null,
    team_size_pref: 3,
    team_status: "has_team",
    search_text: "trojan backend ai ml fullstack python data science",
    created_at: demoDate,
    updated_at: demoDate,
    uiRoles: ["Backend", "AI/ML", "Full-stack"],
    cardNote: "Has a team",
    teamLabel: "Already has a team",
    instagram: null,
    phone: null,
  },
];

export function filterDemoProfiles(
  profiles: DirectoryProfile[],
  filters: PeopleFilters,
  selectedRoles: readonly string[],
): DirectoryProfile[] {
  const query = filters.q.trim().toLowerCase();
  const selected = selectedRoles.map((role) => role.toLowerCase());

  const filtered = profiles.filter((p) => {
    if (selected.length > 0) {
      // OR behavior: match at least one selected role.
      const selectedNames = selected.flatMap((role) =>
        role === "ai-ml"
          ? ["ai/ml", "ai-ml"]
          : role === "fullstack"
            ? ["fullstack", "full-stack"]
            : [role]
      );
      const profileRoles = (p.uiRoles ?? [p.role]).map((role) =>
        role.toLowerCase()
      );
      if (!profileRoles.some((role) => selectedNames.includes(role))) {
        return false;
      }
    }

    if (filters.status && p.team_status !== filters.status) return false;

    if (filters.size && String(p.team_size_pref ?? "") !== filters.size) {
      return false;
    }

    if (
      filters.year &&
      p.usc_year.toLowerCase() !== filters.year.toLowerCase()
    ) {
      return false;
    }

    if (
      filters.lang &&
      !p.languages.some((l) => l.toLowerCase() === filters.lang.toLowerCase())
    ) {
      return false;
    }

    if (query) {
      const searchable = [
        p.name,
        p.major,
        p.usc_year,
        ...(p.uiRoles ?? []),
        ...p.languages,
        ...p.skills,
        p.looking_for ?? "",
        p.cardNote ?? "",
      ].join(" ").toLowerCase();

      if (!searchable.includes(query)) return false;
    }

    return true;
  });

  if (filters.sort === "name") {
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filters.sort === "size") {
    return filtered.sort(
      (a, b) => (a.team_size_pref ?? 0) - (b.team_size_pref ?? 0)
    );
  }

  return filtered;
}
import type { Profile } from "@/lib/database.types";

export const dummyProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Tommy Trojan",
  usc_year: "Junior",
  major: "Computer Science",
  email: "tommy@example.com",
  discord: "tommydev",
  link: null,
  skills: ["React", "UI Design", "Next.js"],
  languages: ["TypeScript", "Python"],
  role: "frontend",
  looking_for: "Looking for a designer to build a fun game!",
  team_size_pref: 3,
  team_status: "looking",
  search_text: "tommy trojan frontend typescript react",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

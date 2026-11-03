"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { DevRole, ProfileInsert, TeamStatus } from "@/lib/database.types";
import { ROLES, TEAM_STATUSES, USC_YEARS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";
import { ownAvatarUrl } from "@/lib/utils";

export type ProfileFormState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ProfileInsert, string>>;
};

/** Split a comma-separated field into trimmed, de-duplicated tags. */
function parseTags(values: string[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of values.flatMap((v) => v.split(","))) {
    const tag = raw.trim().slice(0, 40);
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags.slice(0, 25);
}

function normalizeLink(value: string): string | null {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const fieldErrors: ProfileFormState["fieldErrors"] = {};

  const name = text("name");
  const usc_year = text("usc_year");
  const major = text("major");
  const email = text("email");
  const role = text("role") as DevRole;
  const team_status = text("team_status") as TeamStatus;
  const teamSize = text("team_size_pref");
  const linkInput = text("link");
  const link = normalizeLink(linkInput);

  // The browser uploads the photo to Storage first; only accept URLs that point
  // into this user's own folder of the avatars bucket.
  const avatar_url = ownAvatarUrl(text("avatar_url"), supabaseUrl, user.id);

  if (!name) fieldErrors.name = "Name is required.";
  if (!USC_YEARS.includes(usc_year as (typeof USC_YEARS)[number])) fieldErrors.usc_year = "Pick a year.";
  if (!major) fieldErrors.major = "Major is required.";
  if (!/^\S+@\S+\.\S+$/.test(email)) fieldErrors.email = "Enter a valid email.";
  if (!ROLES.some((r) => r.value === role)) fieldErrors.role = "Pick one.";
  if (!TEAM_STATUSES.some((s) => s.value === team_status)) fieldErrors.team_status = "Pick one.";
  if (linkInput && !link) fieldErrors.link = "Enter a valid URL.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Fix the highlighted fields.", fieldErrors };
  }

  const profile: ProfileInsert = {
    id: user.id,
    name: name.slice(0, 100),
    usc_year,
    major: major.slice(0, 100),
    email,
    discord: text("discord").slice(0, 64) || null,
    link,
    skills: parseTags([text("skills")]),
    languages: parseTags([...formData.getAll("languages").map(String), text("other_languages")]),
    role,
    looking_for: text("looking_for").slice(0, 1000) || null,
    team_size_pref: teamSize ? Number(teamSize) : null,
    team_status,
    // Omit when unchanged so an existing photo isn't wiped.
    ...(avatar_url && { avatar_url }),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(profile);
  if (error) return { status: "error", message: error.message };

  revalidatePath("/people");
  revalidatePath("/profile");
  return { status: "saved", message: "Profile saved." };
}

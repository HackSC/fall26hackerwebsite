import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { DevRole, EventRow, Profile, TeamStatus } from "@/lib/database.types";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// ---------------------------------------------------------------------------
// Schedule (public, cached)
// ---------------------------------------------------------------------------

export type ScheduleResult = { events: EventRow[]; error: string | null };

export async function getSchedule(): Promise<ScheduleResult> {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");

  if (!isSupabaseConfigured) return { events: [], error: null };

  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) return { events: [], error: error.message };
  return { events: data, error: null };
}

// ---------------------------------------------------------------------------
// Profiles (per-user, RLS-scoped, never cached on the server)
// ---------------------------------------------------------------------------

export type PeopleSort = "newest" | "name" | "size";

export type PeopleFilters = {
  q: string;
  role: DevRole | "";
  status: TeamStatus | "";
  year: string;
  lang: string;
  size: string;
  sort: PeopleSort;
};

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function searchProfiles(filters: PeopleFilters) {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*");

  if (filters.q) {
    const escaped = filters.q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`);
    query = query.ilike("search_text", `%${escaped}%`);
  }
  if (filters.role) query = query.eq("role", filters.role);
  if (filters.status) query = query.eq("team_status", filters.status);
  if (filters.year) query = query.eq("usc_year", filters.year);
  if (filters.lang) query = query.contains("languages", [filters.lang]);
  if (filters.size) query = query.eq("team_size_pref", Number(filters.size));

  switch (filters.sort) {
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "size":
      query = query.order("team_size_pref", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(200);
  return { profiles: data ?? [], error: error?.message ?? null };
}

// ---------------------------------------------------------------------------
// Organizers and check-in (per-user, RLS-scoped)
// ---------------------------------------------------------------------------

/** One event from the cached schedule. */
export async function getEvent(id: number): Promise<EventRow | null> {
  const { events } = await getSchedule();
  return events.find((e) => e.id === id) ?? null;
}

export async function isOrganizer(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_organizer");
  return data === true;
}

/** RLS returns nothing unless the caller is an organizer. */
export async function getCheckinCode(eventId: number): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("checkin_codes").select("code").eq("event_id", eventId).maybeSingle();
  return data?.code ?? null;
}

export async function getAttendance(eventId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select("created_at, profiles(id, name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return { checkins: data ?? [], error: error?.message ?? null };
}

import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { isOrganizer } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CurrentUser = { id: string; email: string };

/** The signed-in user, verified from the session JWT. Deduped per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return null;
  // The auth client reads the clock, so opt out of prerendering before touching it.
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  return { id: claims.sub, email: claims.email ?? "" };
});

/** Sends signed-out users to login and hides the page from everyone who isn't an organizer. */
export async function requireOrganizer(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!(await isOrganizer())) notFound();
  return user;
}

"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { EVENT_TIME_ZONE } from "@/lib/constants";
import { parseEventForm, type EventFieldErrors } from "@/lib/event-form";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { status: "idle" | "error"; message?: string; fieldErrors?: EventFieldErrors };

export async function saveEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireOrganizer("/admin");

  const parsed = parseEventForm(Object.fromEntries(formData), EVENT_TIME_ZONE);
  if (!parsed.ok) return { status: "error", message: "Fix the highlighted fields.", fieldErrors: parsed.errors };

  const gone: EventFormState = { status: "error", message: "That event doesn't exist anymore." };
  const rawId = formData.get("id");
  const id = rawId ? Number(rawId) : null;
  if (id !== null && !(Number.isSafeInteger(id) && id > 0)) return gone;

  const supabase = await createClient();
  if (id === null) {
    const { error } = await supabase.from("events").insert(parsed.event);
    if (error) return { status: "error", message: error.message };
  } else {
    const { data, error } = await supabase.from("events").update(parsed.event).eq("id", id).select("id");
    if (error) return { status: "error", message: error.message };
    if (!data.length) return gone;
  }

  updateTag("events");
  redirect("/admin");
}

export async function deleteEvent(formData: FormData) {
  await requireOrganizer("/admin");
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", Number(formData.get("id")));
  if (error) throw new Error(`Couldn't delete the event: ${error.message}`);
  updateTag("events");
  redirect("/admin");
}

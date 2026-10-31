"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { CheckinStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type CheckinState = {
  status: "idle" | "done" | "error";
  message?: string;
  needsProfile?: boolean;
};

const ERRORS: Record<Exclude<CheckinStatus, "ok" | "already">, string> = {
  bad_code: "This QR code isn't valid. Ask an organizer.",
  closed: "Check-in for this event isn't open right now.",
  no_profile: "Make your hacker profile first, then scan again.",
  signed_out: "Sign in first.",
};

export async function checkIn(_prev: CheckinState, formData: FormData): Promise<CheckinState> {
  const eventId = Number(formData.get("event_id"));
  const code = String(formData.get("code") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${eventId}/${code}`)}`);
  if (!Number.isSafeInteger(eventId) || !/^[0-9a-f]{32}$/.test(code)) {
    return { status: "error", message: ERRORS.bad_code };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in", { p_event_id: eventId, p_code: code });
  if (error) return { status: "error", message: error.message };

  if (data === "ok") return { status: "done", message: "You're checked in. Have fun!" };
  if (data === "already") return { status: "done", message: "You're already checked in." };
  return { status: "error", message: ERRORS[data], needsProfile: data === "no_profile" };
}

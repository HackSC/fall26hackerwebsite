"use client";

import Link from "next/link";
import { useActionState } from "react";
import { checkIn, type CheckinState } from "./actions";

export function CheckinButton({ eventId, code }: { eventId: number; code: string }) {
  const [state, action, pending] = useActionState<CheckinState, FormData>(checkIn, { status: "idle" });

  if (state.status === "done") {
    return (
      <div role="status" className="rise mt-8 bg-surface p-6">
        <p className="text-lead font-semibold">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="code" value={code} />
      {state.status === "error" && (
        <p role="alert" className="font-semibold text-danger">
          {state.message}{" "}
          {state.needsProfile && <Link href="/profile" className="link">Make your profile</Link>}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Checking in…" : "Check me in"}
      </button>
    </form>
  );
}

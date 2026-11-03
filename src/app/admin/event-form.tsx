"use client";

import { startTransition, useActionState } from "react";
import type { EventRow } from "@/lib/database.types";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";
import { isoToZoned } from "@/lib/event-form";
import { deleteEvent, saveEvent, type EventFormState } from "./actions";

export function EventForm({ event }: { event: EventRow | null }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(saveEvent, { status: "idle" });
  const errors = state.fieldErrors ?? {};
  const invalid = (k: keyof typeof errors) =>
    errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {};
  const errorText = (k: keyof typeof errors) =>
    errors[k] && (
      <p id={`${k}-error`} className="mt-1 text-sm font-semibold text-danger">
        {errors[k]}
      </p>
    );
  const local = (iso: string | null | undefined) => (iso ? isoToZoned(iso, EVENT_TIME_ZONE) : "");

  return (
    <form
      className="mt-6 space-y-5"
      // Submitting through a transition (instead of `<form action>`) stops React
      // from resetting the inputs, so edits survive a validation error.
      onSubmit={(e) => {
        // Let the delete button run its own formAction; preventDefault would cancel it.
        if ((e.nativeEvent as SubmitEvent).submitter?.hasAttribute("data-delete")) return;
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      {event && <input type="hidden" name="id" value={event.id} />}

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input id="title" name="title" required maxLength={200} defaultValue={event?.title} className="input" {...invalid("title")} />
        {errorText("title")}
      </div>

      <div>
        <label htmlFor="kind" className="field-label">Type</label>
        <select id="kind" name="kind" defaultValue={event?.kind ?? "event"} className="input" {...invalid("kind")}>
          {Object.entries(EVENT_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errorText("kind")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="field-label">Starts (LA time)</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={local(event?.starts_at)} className="input" {...invalid("starts_at")} />
          {errorText("starts_at")}
        </div>
        <div>
          <label htmlFor="ends_at" className="field-label">Ends (optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={local(event?.ends_at)} className="input" {...invalid("ends_at")} />
          {errorText("ends_at")}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="field-label">Location</label>
        <input id="location" name="location" maxLength={200} defaultValue={event?.location ?? ""} className="input" />
      </div>

      <div>
        <label htmlFor="description" className="field-label">Description</label>
        <textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={event?.description ?? ""} className="input" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="font-semibold text-danger">{state.message}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
        {event && (
          <button
            type="submit"
            data-delete
            formNoValidate
            formAction={deleteEvent}
            className="btn-quiet text-danger"
            onClick={(e) => {
              if (!confirm(`Delete "${event.title}"? Its check-ins are deleted too.`)) e.preventDefault();
            }}
          >
            Delete event
          </button>
        )}
      </div>
    </form>
  );
}

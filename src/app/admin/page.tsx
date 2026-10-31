import Link from "next/link";
import { Suspense } from "react";
import { requireOrganizer } from "@/lib/auth";
import { getSchedule } from "@/lib/data";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";

const when = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-title">Schedule</h1>
        <Link href="/admin/events/new" className="btn">New event</Link>
      </div>
      <Suspense fallback={<div className="skeleton mt-8 h-96" />}>
        <EventList />
      </Suspense>
    </div>
  );
}

async function EventList() {
  await requireOrganizer("/admin");
  const { events, error } = await getSchedule();
  if (error) return <p role="alert" className="mt-8 font-semibold text-danger">{error}</p>;
  if (events.length === 0) return <p className="mt-8 text-muted">No events yet.</p>;

  return (
    <ul className="mt-8 divide-y divide-border">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-sm text-muted">
              {EVENT_KIND_LABELS[e.kind]} · {when.format(new Date(e.starts_at))}
              {e.location && ` · ${e.location}`}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href={`/admin/events/${e.id}`} className="link">Edit</Link>
            <Link href={`/admin/events/${e.id}/qr`} className="link">Check-in QR</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import QRCode from "qrcode";
import { requireOrganizer } from "@/lib/auth";
import { getAttendance, getCheckinCode, getEvent } from "@/lib/data";
import { EVENT_TIME_ZONE } from "@/lib/constants";

const time = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, hour: "numeric", minute: "2-digit" });

export default function EventQrPage({ params }: PageProps<"/admin/events/[id]/qr">) {
  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">← Schedule</Link>
      <Suspense fallback={<div className="skeleton mt-6 h-[28rem]" />}>
        <EventQr params={params} />
      </Suspense>
    </div>
  );
}

async function EventQr({ params }: Pick<PageProps<"/admin/events/[id]/qr">, "params">) {
  const { id } = await params;
  await requireOrganizer(`/admin/events/${id}/qr`);

  const event = await getEvent(Number(id));
  if (!event) notFound();
  const [code, { checkins, error }] = await Promise.all([getCheckinCode(event.id), getAttendance(event.id)]);
  if (!code) notFound(); // every event gets one from the insert trigger

  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/checkin/${event.id}/${code}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2 });

  return (
    <div className="mt-4 grid gap-10 lg:grid-cols-2">
      <section>
        <h1 className="display text-title">{event.title}</h1>
        <p className="mt-2 text-muted">
          Scan with your phone camera to check in. Works from 30 minutes before the start until 30 minutes after the end (or 90 minutes after the start if there&apos;s no end time).
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL, nothing to optimize */}
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
          alt={`QR code that checks hackers in to ${event.title}`}
          className="mt-6 aspect-square w-full max-w-md bg-white"
        />
        <p className="mt-3 break-all text-xs text-muted">{url}</p>
      </section>

      <section>
        <h2 className="text-lead font-semibold">{checkins.length} checked in</h2>
        <p className="text-sm text-muted">Refresh to update.</p>
        {error && <p role="alert" className="mt-2 font-semibold text-danger">{error}</p>}
        <ul className="mt-4 divide-y divide-border">
          {checkins.map((c) => (
            <li key={c.user_id} className="flex justify-between gap-4 py-2 text-sm">
              <span>{c.profiles?.name}</span>
              <span className="text-muted">{time.format(new Date(c.created_at))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

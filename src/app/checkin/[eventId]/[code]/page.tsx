import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getEvent } from "@/lib/data";
import { CheckinButton } from "../../checkin-button";

export default function CheckinPage({ params }: PageProps<"/checkin/[eventId]/[code]">) {
  return (
    <div className="mx-auto max-w-md pt-6 text-center">
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Checkin params={params} />
      </Suspense>
    </div>
  );
}

async function Checkin({ params }: Pick<PageProps<"/checkin/[eventId]/[code]">, "params">) {
  const { eventId, code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${eventId}/${code}`)}`);

  const event = await getEvent(Number(eventId));
  if (!event) notFound();

  return (
    <>
      <p className="text-sm text-muted">Check in to</p>
      <h1 className="display mt-2 text-title">{event.title}</h1>
      {event.location && <p className="mt-2 text-muted">{event.location}</p>}
      <CheckinButton eventId={event.id} code={code} />
    </>
  );
}

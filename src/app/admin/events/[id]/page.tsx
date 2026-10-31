import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOrganizer } from "@/lib/auth";
import { getEvent } from "@/lib/data";
import { EventForm } from "../../event-form";

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">← Schedule</Link>
      <Suspense fallback={<div className="skeleton mt-6 h-96" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/events/[id]">, "params">) {
  const { id } = await params;
  await requireOrganizer(`/admin/events/${id}`);

  const event = id === "new" ? null : await getEvent(Number(id));
  if (id !== "new" && !event) notFound();

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{event ? "Edit event" : "New event"}</h1>
      <EventForm event={event} />
    </>
  );
}

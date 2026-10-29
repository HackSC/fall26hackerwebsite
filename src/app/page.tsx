import { getSchedule } from "@/lib/data";
import { Dashboard } from "./dashboard";

export default async function Home() {
  const { events, error } = await getSchedule();

  return (
    <>
      {error && (
        <p className="mb-6 rounded-2xl border border-accent/30 bg-card p-4 text-sm text-accent">
          Couldn&apos;t load the schedule: {error}. Did you run the migration in{" "}
          <code>supabase/migrations</code>?
        </p>
      )}
      <Dashboard events={events} />
    </>
  );
}

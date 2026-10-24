import { getSchedule } from "@/lib/data";
import { Dashboard } from "./dashboard";

export default async function Home() {
  const { events, error } = await getSchedule();

  return (
    <>
      {error && (
        <p className="card mb-6 text-sm text-accent">
          Couldn&apos;t load the schedule: {error}. Did you run the migration in{" "}
          <code>supabase/migrations</code>?
        </p>
      )}
      <Dashboard events={events} />
    </>
  );
}

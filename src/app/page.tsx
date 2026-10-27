import { getSchedule } from "@/lib/data";
import { Dashboard } from "./dashboard";

export default async function Home() {
  const { events, error } = await getSchedule();

  return (
    <>
      {error && (
        <p role="alert" className="wrap py-4 font-semibold text-danger">
          Couldn&apos;t load the schedule: {error}. Did you run the migration in <code>supabase/migrations</code>?
        </p>
      )}
      <Dashboard events={events} />
    </>
  );
}

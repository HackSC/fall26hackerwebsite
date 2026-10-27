import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1 text-sm text-muted">
        Visible to other signed-in hackers on the People page so you can form teams.
      </p>
      <Suspense fallback={<div className="card mt-6 h-96 animate-pulse" />}>
        <ProfileEditor />
      </Suspense>
    </div>
  );
}

async function ProfileEditor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const profile = await getProfile(user.id);
  return <ProfileForm profile={profile} userId={user.id} defaultEmail={user.email} />;
}

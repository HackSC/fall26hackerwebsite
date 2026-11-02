import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Edit profile</h1>
        <p className="mt-1 text-xs text-muted">
          Other signed-in hackers see this on the People page, so they know what you build and how to reach you.
        </p>
        <Suspense fallback={<div className="skeleton mt-6 h-96 rounded-card" />}>
          <ProfileEditor />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileEditor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const profile = await getProfile(user.id);
  return <ProfileForm profile={profile} userId={user.id} defaultEmail={user.email} />;
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  return (
    <div className="wrap pt-10 sm:pt-16">
      <div className="max-w-3xl">
        <h1 className="display rise text-title">Your profile</h1>
        <p className="rise mt-4 text-lead text-muted" style={{ "--i": 1 } as React.CSSProperties}>
          Other signed-in hackers see this on the People page, so they know what you build and how to reach you.
        </p>
        <Suspense fallback={<div className="skeleton mt-10 h-96" />}>
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
  return <ProfileForm profile={profile} defaultEmail={user.email} />;
}

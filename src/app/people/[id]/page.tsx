import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { roleLabel, teamStatusLabel } from "@/lib/constants";
import { ContactLinks } from "../contact-links";
import { StatusTag } from "../profile-card";

export default function PersonPage({ params }: PageProps<"/people/[id]">) {
  return (
    <div className="wrap pt-8 sm:pt-12">
      <Link href="/people" className="link">
        <span aria-hidden="true">←</span> All people
      </Link>
      <Suspense fallback={<div className="skeleton mt-8 h-80" />}>
        <Person params={params} />
      </Suspense>
    </div>
  );
}

async function Person({ params }: Pick<PageProps<"/people/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/people/${id}`);

  const p = await getProfile(id);
  if (!p) notFound();

  return (
    <article className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
      <header className="lg:col-span-5">
        <h1 className="display rise text-title break-words">{p.name}</h1>
        <p className="mt-3 text-lead text-muted">
          {p.usc_year} · {p.major}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StatusTag status={p.team_status} />
          {p.id === user.id && (
            <Link href="/profile" className="btn-quiet">
              Edit profile
            </Link>
          )}
        </div>
      </header>

      <dl className="space-y-8 bg-surface p-6 sm:p-8 lg:col-span-7">
        <Detail label="Contact">
          <p className="mb-3 break-words">
            {p.email}
            {p.discord && ` · Discord: ${p.discord}`}
          </p>
          <ContactLinks profile={p} />
        </Detail>

        <Detail label="Focus">{roleLabel(p.role)}</Detail>

        <Detail label="Languages">
          {p.languages.length ? (
            <div className="flex flex-wrap gap-1.5">
              {p.languages.map((l) => (
                <span key={l} className="tag">
                  {l}
                </span>
              ))}
            </div>
          ) : (
            "None listed"
          )}
        </Detail>

        <Detail label="Skills">{p.skills.length ? p.skills.join(", ") : "None listed"}</Detail>

        <Detail label="Team">
          {teamStatusLabel(p.team_status)}
          {p.team_size_pref &&
            `, prefers ${p.team_size_pref === 1 ? "working solo" : `a team of ${p.team_size_pref}`}`}
        </Detail>

        <Detail label="Looking for">
          <p className="whitespace-pre-wrap">{p.looking_for || "Nothing yet"}</p>
        </Detail>
      </dl>
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-1 font-semibold text-muted">{label}</dt>
      <dd className="text-lg">{children}</dd>
    </div>
  );
}

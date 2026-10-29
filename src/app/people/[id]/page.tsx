import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { roleLabel, teamStatusLabel } from "@/lib/constants";
import { ContactLinks } from "../contact-links";

export default function PersonPage({ params }: PageProps<"/people/[id]">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/people" className="text-sm text-muted hover:text-foreground">
        ← All people
      </Link>
      <Suspense fallback={<div className="card mt-4 h-80 animate-pulse" />}>
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
  const initials = p.name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((word) => word[0]?.toUpperCase() ?? "")
  .join("");

  return (
    <article className="card mt-4 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-500">
            {initials}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {p.name}
            </h1>
            <p className="mt-1 text-sm font-medium">
              {roleLabel(p.role)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {p.usc_year} · {p.major}
            </p>
          </div>
        </div>
        {p.id === user.id ? (
          <Link href="/profile" className="btn-ghost">
            Edit profile
          </Link>
        ) : (
          <span
            className={`chip ${p.team_status === "looking" ? "border-accent text-accent" : "text-muted"}`}
          >
            {teamStatusLabel(p.team_status)}
          </span>
        )}
      </header>

      <Detail label="Contact">
        <p className="mb-2 text-sm">
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
              <span key={l} className="chip">
                {l}
              </span>
            ))}
          </div>
        ) : (
          "—"
        )}
      </Detail>

      <Detail label="Skills">{p.skills.length ? p.skills.join(", ") : "—"}</Detail>

      <Detail label="Team">
        {teamStatusLabel(p.team_status)}
        {p.team_size_pref &&
          ` · prefers ${p.team_size_pref === 1 ? "working solo" : `a team of ${p.team_size_pref}`}`}
      </Detail>

      <Detail label="Looking for">
        <p className="whitespace-pre-wrap">{p.looking_for || "—"}</p>
      </Detail>
    </article>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-xs font-medium uppercase tracking-widest text-muted">{label}</h2>
      <div>{children}</div>
    </section>
  );
}

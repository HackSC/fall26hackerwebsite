import Link from "next/link";
import type { Profile, TeamStatus } from "@/lib/database.types";
import { roleLabel, teamStatusLabel } from "@/lib/constants";
import { ContactLinks } from "./contact-links";

export function StatusTag({ status }: { status: TeamStatus }) {
  return (
    <span
      className="tag shrink-0 text-on-tag"
      style={{ background: status === "looking" ? "var(--tag-looking)" : "var(--tag-team)" }}
    >
      {teamStatusLabel(status)}
    </span>
  );
}

export function ProfileCard({ profile: p, isMe }: { profile: Profile; isMe: boolean }) {
  return (
    <article className="flex h-full flex-col bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight">
            <Link href={`/people/${p.id}`} className="underline-offset-4 hover:underline">
              {p.name}
            </Link>
            {isMe && <span className="tag ml-2 bg-gold align-middle text-on-tag">You</span>}
          </h2>
          <p className="text-muted">
            {p.usc_year} · {p.major}
          </p>
        </div>
        <StatusTag status={p.team_status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="tag bg-ink text-ground">{roleLabel(p.role)}</span>
        {p.languages.map((l) => (
          <span key={l} className="tag">
            {l}
          </span>
        ))}
      </div>

      {p.skills.length > 0 && (
        <p className="mt-3 text-muted">
          <span className="font-semibold text-ink">Skills:</span> {p.skills.join(", ")}
        </p>
      )}

      {p.looking_for && <p className="mt-4 line-clamp-3">“{p.looking_for}”</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <ContactLinks profile={p} />
        {p.team_size_pref && (
          <span className="text-sm text-muted">
            Prefers {p.team_size_pref === 1 ? "solo" : `team of ${p.team_size_pref}`}
          </span>
        )}
      </div>
    </article>
  );
}

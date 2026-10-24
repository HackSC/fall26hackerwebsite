import Link from "next/link";
import type { Profile } from "@/lib/database.types";
import { roleLabel, teamStatusLabel } from "@/lib/constants";
import { ContactLinks } from "./contact-links";

export function ProfileCard({ profile: p, isMe }: { profile: Profile; isMe: boolean }) {
  return (
    <article className="card flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/people/${p.id}`} className="text-lg font-semibold hover:text-accent">
            {p.name}
          </Link>
          {isMe && <span className="chip ml-2 border-gold text-xs">You</span>}
          <p className="text-sm text-muted">
            {p.usc_year} · {p.major}
          </p>
        </div>
        <span
          className={`chip shrink-0 ${
            p.team_status === "looking" ? "border-accent text-accent" : "text-muted"
          }`}
        >
          {teamStatusLabel(p.team_status)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip bg-foreground/5 font-medium">{roleLabel(p.role)}</span>
        {p.languages.map((l) => (
          <span key={l} className="chip">
            {l}
          </span>
        ))}
      </div>

      {p.skills.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-foreground">Skills:</span> {p.skills.join(", ")}
        </p>
      )}

      {p.looking_for && <p className="mt-3 line-clamp-3 text-sm">“{p.looking_for}”</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-sm">
        <ContactLinks profile={p} />
        {p.team_size_pref && (
          <span className="text-muted">
            Prefers {p.team_size_pref === 1 ? "solo" : `team of ${p.team_size_pref}`}
          </span>
        )}
      </div>
    </article>
  );
}

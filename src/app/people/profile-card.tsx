import type { Profile } from "@/lib/database.types";
import { roleLabel } from "@/lib/constants";
import { ContactLinks } from "./contact-links";
import { ProfileDetailModal } from "./profile-detail-modal";

export function ProfileCard({ profile: p, isMe }: { profile: Profile; isMe: boolean }) {
  const initials = p.name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((word) => word[0]?.toUpperCase() ?? "")
  .join("");
  return (
    <article className="card flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-placeholder text-sm font-medium text-muted">
        {initials}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <ProfileDetailModal profile={p} isMe={isMe} />
          {isMe && <span className="chip ml-2 bg-lime text-xs">You</span>}
          <p className="mt-1 line-clamp-2 text-xs text-muted">
            {p.usc_year} · {p.major}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="chip border-transparent bg-surface-2 font-medium text-ink">
          {roleLabel(p.role)}
        </span>
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
      <div
        className={`-mx-5 -mb-5 mt-4 px-4 py-3 text-xs ${
          p.team_status === "looking"
            ? "bg-lime text-ink"
            : "bg-surface-2 text-muted"
        }`}
      >
        {p.team_status === "looking" ? (
          <>
            <span className="mr-2 text-coral">●</span>
            Looking for a team
          </>
        ) : (
          "Has a team"
        )}
      </div>
    </article>
  );
}

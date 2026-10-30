"use client";

import { useState } from "react";
import type { Profile } from "@/lib/database.types";

export function ContactLinks({
  profile,
}: {
  profile: Pick<Profile, "email" | "discord" | "link">;
}) {
  const [copied, setCopied] = useState(false);

  async function copyDiscord() {
    if (!profile.discord) return;
    await navigator.clipboard.writeText(profile.discord);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`mailto:${profile.email}`} className="btn-quiet" title={profile.email}>
        Email
      </a>
      {profile.discord && (
        <button
          type="button"
          onClick={copyDiscord}
          className="btn-quiet"
          title="Copy Discord username"
          aria-live="polite"
        >
          {copied ? "Copied" : `Discord: ${profile.discord}`}
        </button>
      )}
      {profile.link && (
        <a
          href={profile.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-quiet"
        >
          Link <span aria-hidden="true">↗</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

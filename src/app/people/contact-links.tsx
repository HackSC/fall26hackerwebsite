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
      <a href={`mailto:${profile.email}`} className="btn-ghost px-3 py-1" title={profile.email}>
        Email
      </a>
      {profile.discord && (
        <button
          type="button"
          onClick={copyDiscord}
          className="btn-ghost px-3 py-1"
          title="Copy Discord username"
        >
          {copied ? "Copied!" : `Discord: ${profile.discord}`}
        </button>
      )}
      {profile.link && (
        <a
          href={profile.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost px-3 py-1"
        >
          Link ↗
        </a>
      )}
    </div>
  );
}

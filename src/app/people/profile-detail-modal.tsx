
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/database.types";
import { roleLabel } from "@/lib/constants";
import { ContactLinks } from "./contact-links";

export function ProfileDetailModal({
  profile: p,
  isMe,
}: {
  profile: Profile;
  isMe: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [discordCopied, setDiscordCopied] = useState(false);
  const initials = p.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="block max-w-full truncate text-left font-display text-base font-medium hover:opacity-70"
      >
        {p.name}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`${p.name}'s profile`}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[85vh] w-[min(92vw,460px)] overflow-y-auto rounded-card bg-card p-6 text-ink shadow-2xl backdrop:bg-black/40"
      >
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            aria-label="Close profile"
            onClick={() => dialogRef.current?.close()}
            className="text-2xl text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-placeholder text-lg text-muted">
            {initials}
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-bold">{p.name}</h2>
            <p className="mt-1 text-sm">{roleLabel(p.role)}</p>
            <p className="mt-1 text-sm text-muted">
              {p.usc_year} · {p.major}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <span className="inline-flex rounded-full bg-lime px-3 py-1 text-xs font-medium text-ink">
            {p.team_status === "looking"
              ? "● Looking for a team"
              : "Has a team"}
          </span>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs text-muted">Tech stack</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...p.languages, ...p.skills])].map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs"
              >
                {skill}
              </span>
            ))}
            {p.languages.length === 0 && p.skills.length === 0 && (
              <span className="text-sm text-muted">—</span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-2 text-xs text-muted">Looking for</p>
            <p className="whitespace-pre-wrap">{p.looking_for || "—"}</p>
          </div>

          <div>
            <p className="mb-2 text-xs text-muted">Team</p>
            <p>
              {p.team_size_pref
                ? `Prefers team of ${p.team_size_pref}`
                : "No size preference"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-medium">Contact</h3>
          <div className="space-y-2 text-sm">
            {p.discord && <p>Discord: {p.discord}</p>}
            {p.email && <p className="break-all">Email: {p.email}</p>}
            <ContactLinks profile={p} />
          </div>
        </div>  
        {p.discord ? (
        <button
            type="button"
            onClick={async () => {
            try {
                await navigator.clipboard.writeText(p.discord!);
                setDiscordCopied(true);
            } catch {
                setDiscordCopied(false);
            }
            }}
            className="mt-6 w-full rounded-control bg-coral px-4 py-3 text-sm font-medium text-ink hover:opacity-90"
        >
            {discordCopied ? "Discord username copied!" : "Copy Discord username"}
        </button>
        ) : (
        <Link
            href={isMe ? "/profile" : `/people/${p.id}`}
            className="mt-6 flex w-full justify-center rounded-control bg-coral px-4 py-3 text-sm font-medium text-ink"
        >
            {isMe ? "Edit profile" : "View full profile"}
        </Link>
        )}
      </dialog>
    </>
  );
}

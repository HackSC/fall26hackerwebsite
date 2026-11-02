
"use client";

import { useRef, useState } from "react";
import { roleLabel } from "@/lib/constants";
import type { DirectoryProfile } from "./demo-profiles";

function Avatar({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#E2E2E6] text-[#9D9DA3] ${
        large ? "h-14 w-14" : "h-10 w-10"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className={large ? "h-7 w-7" : "h-5 w-5"}
      >
        <circle cx="12" cy="8" r="3.5" />
        <path d="M4.5 21v-1.5a7.5 7.5 0 0 1 15 0V21" />
      </svg>
    </span>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
    >
      <rect x="8" y="8" width="11" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function ContactRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value?: string | null;
  copied: boolean;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EBEBEB] py-3 last:border-0">
      <div className="min-w-0">
        <p className="mb-1 text-[11px] text-[#8E8E8E]">
          {label}
        </p>
        <p className="break-all text-sm text-[#252525]">
          {value || "Not provided"}
        </p>
      </div>

      {value && (
        <button
          type="button"
          onClick={() => onCopy(value, label)}
          aria-label={`Copy ${label.toLowerCase()}`}
          title={`Copy ${label}`}
          className="flex shrink-0 items-center gap-1 rounded-md p-2 text-[#676767] hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#B5DD48]"
        >
          {copied ? (
            <span className="text-xs font-medium text-green-700">
              Copied!
            </span>
          ) : (
            <CopyIcon />
          )}
        </button>
      )}
    </div>
  );
}

export function ProfileDetailModal({
  profile: p,
  isMe,
  card = false,
}: {
  profile: DirectoryProfile;
  isMe: boolean;
  card?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedField, setCopiedField] = useState("");

  const roles = p.uiRoles?.join(" · ") || roleLabel(p.role);
  const looking = p.team_status === "looking";

  const cardStatus = looking
    ? p.openSpots != null
      ? `${p.openSpots} ${
          p.openSpots === 1 ? "spot" : "spots"
        } open`
      : "Looking for a team"
    : "Has a team";

  const techStack = [
    ...new Set([...p.languages, ...p.skills]),
  ];

  async function copyContact(
    value: string,
    label: string
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
    } catch {
      setCopiedField("");
    }
  }

  function openProfile() {
    setCopiedField("");
    dialogRef.current?.showModal();
  }

  return (
    <>
      {card ? (
        <button
          type="button"
          onClick={openProfile}
          aria-label={`View ${p.name}'s profile`}
          className="group flex h-[206px] w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white text-left text-[#222222] shadow-sm ring-1 ring-[#F1F1F1] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#B5DD48]"
        >
          <div className="flex min-h-0 w-full flex-1 flex-col px-3 pb-2 pt-3">
            <Avatar />

            <p className="mt-3 w-full truncate text-[13px] font-semibold leading-5">
              {p.name}
              {isMe ? " (You)" : ""}
            </p>

            <p className="w-full truncate text-[11px] font-medium leading-4">
              {roles}
            </p>

            <p className="w-full truncate text-[11px] text-[#85858B]">
              {p.usc_year} · {p.major}
            </p>

            {looking && (
              <p className="mt-auto w-full truncate pt-3 text-[11px] text-[#85858B]">
                {p.cardNote ||
                  p.looking_for ||
                  "Looking for teammates"}
              </p>
            )}
          </div>

          <div
            className={`flex h-9 w-full shrink-0 items-center gap-1.5 px-3 text-[11px] ${
              looking
                ? "bg-[#DFFF70] text-[#2C2C2C]"
                : "bg-[#FAFAFA] text-[#777777]"
            }`}
          >
            {looking && (
              <span
                aria-hidden="true"
                className="text-[12px] text-[#FF5151]"
              >
                ●
              </span>
            )}
            <span className="truncate">{cardStatus}</span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={openProfile}
          className="text-left font-semibold hover:underline"
        >
          {p.name}
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${p.name}'s profile`}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            dialogRef.current?.close();
          }
        }}
        className="fixed inset-0 m-auto max-h-[88vh] w-[min(92vw,440px)] overflow-y-auto rounded-2xl border-0 bg-white p-0 text-[#242424] shadow-2xl backdrop:bg-black/65"
      >
        <div className="p-6">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              aria-label="Close profile"
              onClick={() => dialogRef.current?.close()}
              className="flex h-6 w-6 items-center justify-center rounded text-lg text-[#757575] hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Avatar large />

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold">
                {p.name}
              </h2>

              <p className="text-sm font-medium">
                {roles}
              </p>

              <p className="mt-1 text-xs text-[#828282]">
                {p.usc_year} · {p.major}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ${
                looking
                  ? "bg-[#DFFF70] text-[#202020]"
                  : "bg-[#F1F1F1] text-gray-600"
              }`}
            >
              {looking && (
                <span
                  aria-hidden="true"
                  className="text-[#FF5151]"
                >
                  ●
                </span>
              )}
              {looking
                ? "Looking for a team"
                : "Has a team"}
            </span>
          </div>

          <section className="mt-5">
            <h3 className="mb-2 text-xs text-[#858585]">
              Tech stack
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {techStack.length ? (
                techStack.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#F2F2F6] px-3 py-1 text-[11px] text-[#303030]"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[#858585]">
                  Not provided
                </p>
              )}
            </div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <section className="min-w-0">
              <h3 className="mb-2 text-xs text-[#858585]">
                Looking for
              </h3>

              <p className="whitespace-pre-wrap break-words text-[13px] font-medium">
                {p.looking_for || "—"}
              </p>
            </section>

            <section className="min-w-0">
              <h3 className="mb-2 text-xs text-[#858585]">
                Team
              </h3>

              <p className="break-words text-[13px] font-medium">
                {p.teamLabel ||
                  (p.team_status === "has_team"
                    ? "Already has a team"
                    : p.team_size_pref
                      ? `Prefers team of ${p.team_size_pref}`
                      : "No size preference")}
              </p>
            </section>
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-semibold">
              Contact
            </h3>

            <ContactRow
              label="Discord"
              value={p.discord}
              copied={copiedField === "Discord"}
              onCopy={copyContact}
            />

            <ContactRow
              label="Instagram"
              value={p.instagram}
              copied={copiedField === "Instagram"}
              onCopy={copyContact}
            />

            <ContactRow
              label="Phone"
              value={p.phone}
              copied={copiedField === "Phone"}
              onCopy={copyContact}
            />
          </section>

          <div className="mt-4 rounded-xl bg-[#FF4D4D] px-3 py-3 text-center text-xs font-medium text-white">
            * Feature may be added later if needed.
          </div>
        </div>
      </dialog>
    </>
  );
}

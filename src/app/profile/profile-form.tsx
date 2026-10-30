"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type ReactNode } from "react";
import type { Profile } from "@/lib/database.types";
import { LANGUAGES, ROLES, TEAM_SIZES, TEAM_STATUSES, USC_YEARS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "../avatar";
import { saveProfile, type ProfileFormState } from "./actions";

const AVATAR_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function ProfileForm({
  profile,
  userId,
  defaultEmail,
}: {
  profile: Profile | null;
  userId: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {
    status: "idle",
  });
  const errors = state.fieldErrors ?? {};

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  function pickAvatar(file: File | undefined) {
    setAvatarError(null);
    if (!file) return;
    if (!(file.type in AVATAR_TYPES)) return setAvatarError("Use a PNG, JPG, or WebP image.");
    if (file.size > AVATAR_MAX_BYTES) return setAvatarError("Image must be 2 MB or smaller.");
    if (preview) URL.revokeObjectURL(preview);
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  }

  /** Upload the chosen photo to Storage and return its public URL. */
  async function uploadAvatar(file: File) {
    const supabase = createClient();
    const ext = AVATAR_TYPES[file.type as keyof typeof AVATAR_TYPES];
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
    });
    if (error) throw error;
    // Drop older photos so the folder doesn't grow with every change.
    const { data: old } = await supabase.storage.from("avatars").list(userId);
    const stale = (old ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
    if (stale.length) await supabase.storage.from("avatars").remove(stale);
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const known = new Set<string>(LANGUAGES);
  const otherLanguages = (profile?.languages ?? []).filter((l) => !known.has(l)).join(", ");

  return (
    <form
      // Submitting through a transition (instead of `action={action}`) stops
      // React from resetting the form, so edits survive a validation error.
      onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (avatarFile) {
          setUploading(true);
          try {
            formData.set("avatar_url", await uploadAvatar(avatarFile));
            setAvatarFile(null);
          } catch (err) {
            const reason = err instanceof Error ? err.message : "unknown error";
            setAvatarError(`Couldn't upload your photo: ${reason}`);
            return;
          } finally {
            setUploading(false);
          }
        }
        startTransition(() => action(formData));
      }}
      className="mt-6 space-y-6"
    >
      <Section title="About you">
        <div className="flex items-center gap-4">
          <Avatar
            url={preview ?? profile?.avatar_url}
            name={profile?.name}
            className="size-20 text-2xl"
          />
          <div>
            <label className="btn-ghost cursor-pointer">
              {profile?.avatar_url || preview ? "Change photo" : "Upload photo"}
              <input
                type="file"
                accept={Object.keys(AVATAR_TYPES).join(",")}
                onChange={(e) => pickAvatar(e.target.files?.[0])}
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-xs text-muted">PNG, JPG, or WebP, up to 2 MB. Optional.</p>
            {avatarError && <p className="mt-1 text-sm text-danger">{avatarError}</p>}
          </div>
        </div>
        <Field label="Name" error={errors.name}>
          <input name="name" required defaultValue={profile?.name} className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="USC year" error={errors.usc_year}>
            <select name="usc_year" required defaultValue={profile?.usc_year ?? ""} className="input">
              <option value="" disabled>
                Select…
              </option>
              {USC_YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Major" error={errors.major}>
            <input
              name="major"
              required
              defaultValue={profile?.major}
              placeholder="Computer Science"
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={errors.email}>
            <input
              name="email"
              type="email"
              required
              defaultValue={profile?.email ?? defaultEmail}
              className="input"
            />
          </Field>
          <Field label="Discord username" error={errors.discord}>
            <input
              name="discord"
              defaultValue={profile?.discord ?? ""}
              placeholder="tommytrojan"
              className="input"
            />
          </Field>
        </div>
        <Field label="LinkedIn / GitHub / portfolio" hint="Optional" error={errors.link}>
          <input
            name="link"
            defaultValue={profile?.link ?? ""}
            placeholder="github.com/tommytrojan"
            className="input"
          />
        </Field>
      </Section>

      <Section title="Skills">
        <Field label="I mostly do" error={errors.role}>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <RadioChip
                key={r.value}
                name="role"
                value={r.value}
                label={r.label}
                defaultChecked={profile?.role === r.value}
                required
              />
            ))}
          </div>
        </Field>
        <Field label="Programming languages">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="languages"
                  value={lang}
                  defaultChecked={profile?.languages.includes(lang)}
                  className="peer sr-only"
                />
                <span className="chip py-1 text-sm peer-checked:bg-lime peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-blue">
                  {lang}
                </span>
              </label>
            ))}
          </div>
          <input
            name="other_languages"
            defaultValue={otherLanguages}
            placeholder="Others, comma-separated (e.g. Haskell, Lua)"
            className="input mt-3"
          />
        </Field>
        <Field label="Programming skills" hint="Comma-separated">
          <input
            name="skills"
            defaultValue={profile?.skills.join(", ")}
            placeholder="React, machine learning, UI design, iOS, hardware"
            className="input"
          />
        </Field>
      </Section>

      <Section title="Team">
        <Field label="Team status" error={errors.team_status}>
          <div className="flex flex-wrap gap-2">
            {TEAM_STATUSES.map((s) => (
              <RadioChip
                key={s.value}
                name="team_status"
                value={s.value}
                label={s.label}
                defaultChecked={(profile?.team_status ?? "looking") === s.value}
                required
              />
            ))}
          </div>
        </Field>
        <Field label="Preferred team size">
          <select
            name="team_size_pref"
            defaultValue={profile?.team_size_pref?.toString() ?? ""}
            className="input sm:w-48"
          >
            <option value="">No preference</option>
            {TEAM_SIZES.map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "Solo" : `${n} people`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Looking for" hint="Anything — teammates, roles, project ideas, vibes">
          <textarea
            name="looking_for"
            rows={4}
            maxLength={1000}
            defaultValue={profile?.looking_for ?? ""}
            placeholder="A designer and a backend dev to build something for USC students…"
            className="input"
          />
        </Field>
      </Section>

      <div className="flex items-center gap-4">
        <button type="submit" className="btn" disabled={pending || uploading}>
          {pending || uploading ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </button>
        {state.status === "saved" && (
          <p className="text-sm">
            {state.message}{" "}
            <Link href="/people" className="text-link underline">
              Find teammates →
            </Link>
          </p>
        )}
        {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card space-y-4">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-semibold">{title}</h2>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  // A wrapping <label> would also capture clicks for the chip groups, so the
  // label text is a plain heading and each input is self-labelled.
  return (
    <div>
      <div className="label">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

function RadioChip({
  name,
  value,
  label,
  defaultChecked,
  required,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className="peer sr-only"
      />
      <span className="chip px-3 py-1.5 text-sm peer-checked:bg-lime peer-checked:text-ink peer-focus-visible:ring-2 peer-focus-visible:ring-blue">
        {label}
      </span>
    </label>
  );
}

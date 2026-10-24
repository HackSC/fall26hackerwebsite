"use client";

import Link from "next/link";
import { startTransition, useActionState, type ReactNode } from "react";
import type { Profile } from "@/lib/database.types";
import { LANGUAGES, ROLES, TEAM_SIZES, TEAM_STATUSES, USC_YEARS } from "@/lib/constants";
import { saveProfile, type ProfileFormState } from "./actions";

export function ProfileForm({
  profile,
  defaultEmail,
}: {
  profile: Profile | null;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(saveProfile, {
    status: "idle",
  });
  const errors = state.fieldErrors ?? {};

  const known = new Set<string>(LANGUAGES);
  const otherLanguages = (profile?.languages ?? []).filter((l) => !known.has(l)).join(", ");

  return (
    <form
      // Submitting through a transition (instead of `action={action}`) stops
      // React from resetting the form, so edits survive a validation error.
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-6 space-y-6"
    >
      <Section title="About you">
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
                <span className="chip py-1 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
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
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </button>
        {state.status === "saved" && (
          <p className="text-sm">
            {state.message}{" "}
            <Link href="/people" className="text-accent underline">
              Find teammates →
            </Link>
          </p>
        )}
        {state.status === "error" && <p className="text-sm text-accent">{state.message}</p>}
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
      {error && <p className="mt-1 text-sm text-accent">{error}</p>}
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
      <span className="chip px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40">
        {label}
      </span>
    </label>
  );
}

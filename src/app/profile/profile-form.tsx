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
  // Props every single-input field shares: id for its label, and error wiring.
  const a11y = (name: string) => ({
    id: name,
    name,
    "aria-invalid": errors[name as keyof typeof errors] ? true : undefined,
    "aria-describedby": errors[name as keyof typeof errors] ? `${name}-error` : undefined,
  });

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
      className="mt-12 space-y-14"
    >
      <Section title="About you">
        <Field label="Name" htmlFor="name" error={errors.name}>
          <input {...a11y("name")} required autoComplete="name" defaultValue={profile?.name} className="input" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="USC year" htmlFor="usc_year" error={errors.usc_year}>
            <select {...a11y("usc_year")} required defaultValue={profile?.usc_year ?? ""} className="input">
              <option value="" disabled>
                Select…
              </option>
              {USC_YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Major" htmlFor="major" error={errors.major}>
            <input
              {...a11y("major")}
              required
              defaultValue={profile?.major}
              placeholder="Computer Science"
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              {...a11y("email")}
              type="email"
              required
              autoComplete="email"
              defaultValue={profile?.email ?? defaultEmail}
              className="input"
            />
          </Field>
          <Field label="Discord username" htmlFor="discord" error={errors.discord}>
            <input
              {...a11y("discord")}
              defaultValue={profile?.discord ?? ""}
              placeholder="tommytrojan"
              className="input"
            />
          </Field>
        </div>
        <Field label="LinkedIn, GitHub or portfolio" htmlFor="link" hint="Optional" error={errors.link}>
          <input
            {...a11y("link")}
            defaultValue={profile?.link ?? ""}
            placeholder="github.com/tommytrojan"
            className="input"
          />
        </Field>
      </Section>

      <Section title="Skills">
        <Group label="I mostly do" error={errors.role} errorId="role-error">
          {ROLES.map((r) => (
            <Choice
              key={r.value}
              type="radio"
              name="role"
              value={r.value}
              label={r.label}
              defaultChecked={profile?.role === r.value}
              required
            />
          ))}
        </Group>
        <Group label="Programming languages">
          {LANGUAGES.map((lang) => (
            <Choice
              key={lang}
              type="checkbox"
              name="languages"
              value={lang}
              label={lang}
              defaultChecked={profile?.languages.includes(lang)}
            />
          ))}
        </Group>
        <Field label="Other languages" htmlFor="other_languages" hint="Comma-separated">
          <input
            id="other_languages"
            name="other_languages"
            defaultValue={otherLanguages}
            placeholder="Haskell, Lua"
            className="input"
          />
        </Field>
        <Field label="Programming skills" htmlFor="skills" hint="Comma-separated">
          <input
            id="skills"
            name="skills"
            defaultValue={profile?.skills.join(", ")}
            placeholder="React, machine learning, UI design, iOS, hardware"
            className="input"
          />
        </Field>
      </Section>

      <Section title="Team">
        <Group label="Team status" error={errors.team_status} errorId="team_status-error">
          {TEAM_STATUSES.map((s) => (
            <Choice
              key={s.value}
              type="radio"
              name="team_status"
              value={s.value}
              label={s.label}
              defaultChecked={(profile?.team_status ?? "looking") === s.value}
              required
            />
          ))}
        </Group>
        <Field label="Preferred team size" htmlFor="team_size_pref">
          <select
            id="team_size_pref"
            name="team_size_pref"
            defaultValue={profile?.team_size_pref?.toString() ?? ""}
            className="input sm:w-56"
          >
            <option value="">No preference</option>
            {TEAM_SIZES.map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "Solo" : `${n} people`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Looking for" htmlFor="looking_for" hint="Teammates, roles, project ideas, vibes">
          <textarea
            id="looking_for"
            name="looking_for"
            rows={4}
            maxLength={1000}
            defaultValue={profile?.looking_for ?? ""}
            placeholder="A designer and a backend dev to build something for USC students…"
            className="input"
          />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </button>
        <div role="status" aria-live="polite">
          {state.status === "saved" && (
            <p className="font-semibold">
              {state.message}{" "}
              <Link href="/people" className="link">
                Find teammates <span aria-hidden="true">→</span>
              </Link>
            </p>
          )}
          {state.status === "error" && <p className="font-semibold text-danger">{state.message}</p>}
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="display mb-6 text-3xl sm:text-4xl">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {hint && <span className="ml-2 font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

// A chip group is its own fieldset so screen readers announce the question with each option.
function Group({
  label,
  error,
  errorId,
  children,
}: {
  label: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <fieldset aria-describedby={error ? errorId : undefined}>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
      {error && (
        <p id={errorId} className="mt-1.5 font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function Choice({
  type,
  name,
  value,
  label,
  defaultChecked,
  required,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  return (
    <label>
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className="peer sr-only"
      />
      <span className="choice peer-checked:bg-action peer-checked:text-on-action peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--focus)">
        {label}
      </span>
    </label>
  );
}

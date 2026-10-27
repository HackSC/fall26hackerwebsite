"use client";

import Form from "next/form";
import Link from "next/link";
import type { PeopleFilters } from "@/lib/data";
import { LANGUAGES, ROLES, TEAM_SIZES, TEAM_STATUSES, USC_YEARS } from "@/lib/constants";

// A plain GET form: filters live in the URL, so results are shareable and the
// back button works. Dropdowns apply immediately; search applies on Enter.
export function FilterBar({ filters }: { filters: PeopleFilters }) {
  const active = Object.entries(filters).some(([k, v]) => k !== "sort" && v);

  return (
    <Form
      // Remount when the URL changes so the inputs reflect the current filters.
      key={JSON.stringify(filters)}
      action="/people"
      replace
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) e.currentTarget.requestSubmit();
      }}
      className="mt-10 space-y-3 bg-surface p-4 sm:p-5"
    >
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search names, majors, skills, what people are looking for…"
          aria-label="Search people"
          className="input"
        />
        <button type="submit" className="btn">
          Search
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select name="role" value={filters.role} label="Any role">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
        <Select name="status" value={filters.status} label="Any team status">
          {TEAM_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select name="lang" value={filters.lang} label="Any language">
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </Select>
        <Select name="year" value={filters.year} label="Any year">
          {USC_YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </Select>
        <Select name="size" value={filters.size} label="Any team size">
          {TEAM_SIZES.map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "Solo" : `${n} people`}
            </option>
          ))}
        </Select>
        <select name="sort" defaultValue={filters.sort} aria-label="Sort" className="input">
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="size">Team size</option>
        </select>
      </div>

      {active && (
        <Link href="/people" className="link inline-block">
          Clear filters
        </Link>
      )}
    </Form>
  );
}

function Select({
  name,
  value,
  label,
  children,
}: {
  name: string;
  value: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select name={name} defaultValue={value} aria-label={label} className="input">
      <option value="">{label}</option>
      {children}
    </select>
  );
}

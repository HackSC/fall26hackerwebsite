"use client";

import Form from "next/form";
import Link from "next/link";
import type { PeopleFilters } from "@/lib/data";
import { LANGUAGES, ROLES, TEAM_SIZES, USC_YEARS } from "@/lib/constants";

// A plain GET form: filters live in the URL, so results are shareable and the
// back button works. Dropdowns apply immediately; search applies on Enter.
export function FilterBar({ filters }: { filters: PeopleFilters }) {
  
  return (
    <Form
      // Remount when the URL changes so the inputs reflect the current filters.
      key={JSON.stringify(filters)}
      action="/people"
      replace
      onChange={(e) => {
        if (
          e.target instanceof HTMLSelectElement ||
          (e.target instanceof HTMLInputElement &&
            e.target.type === "checkbox")
          ) { e.currentTarget.requestSubmit(); }
      }}
      className="space-y-5 p-2"
    >
    
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">
        Filters
      </h2>

      <Link href="/people" className="text-sm underline underline-offset-2">
        Clear all
      </Link>
    </div>

    
      {/* Looking for team */}
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            Looking for team
          </span>
          <span className="mt-1 block text-xs text-muted">
            Only show hackers who need teammates
          </span>
        </span>

        <input
          type="checkbox"
          name="status"
          value="looking"
          defaultChecked={filters.status === "looking"}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-placeholder transition-colors peer-checked:bg-coral peer-focus-visible:ring-2 peer-focus-visible:ring-blue after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

      {/* Role */}
      <input type="hidden" name="role" value={filters.role} />

      <div className="space-y-3">
        <p className="text-sm text-muted">Role</p>

        <div className="flex flex-wrap gap-2">
          {ROLES.filter(
            (r) => r.value === "frontend" || r.value === "backend"
          ).map((r) => (
            <Link
              key={r.value}
              href={{
                pathname: "/people",
                query: {
                  ...filters,
                  role: filters.role === r.value ? "" : r.value,
                },
              }}
              aria-current={filters.role === r.value ? "true" : undefined}
              className={`rounded-full border px-3 py-2 text-sm transition ${
                filters.role === r.value
                  ? "border-lime bg-lime text-ink"
                  : "border-border text-foreground hover:border-lime"
              }`}
            >
              {r.label}
            </Link>
          ))}

          {["Design", "Mobile", "AI/ML"].map((role) => (
            <button
              key={role}
              type="button"
              disabled
              title="Role filtering is not supported yet"
              className="cursor-not-allowed rounded-full border border-border px-3 py-2 text-sm text-foreground"
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Ideal team size */}
      <div className="space-y-3">
        <p className="text-sm text-muted">Ideal team size</p>

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink">
            Size
          </span>

          <select
            name="size"
            defaultValue={filters.size}
            aria-label="Ideal team size"
            className="w-full appearance-none rounded-xl border-0 bg-surface-2 py-4 pl-[50%] pr-10 text-sm text-ink outline-none focus:ring-2 focus:ring-lime"
          >
            <option value="">Any</option>
            {TEAM_SIZES.filter((n) => [2, 3, 4].includes(n)).map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">
            ↕
          </span>
        </div>
      </div>
      {/* Existing filters remain below the Figma filters */}
      <div className="space-y-3 border-t border-border pt-5">
        <p className="text-sm font-medium">Additional filters</p>        
        {/*full-stack checker - end*/}
        <div className="flex flex-wrap gap-2">
          {ROLES.filter(
            (r) => r.value !== "frontend" && r.value !== "backend"
          ).map((r) => (
            <Link
              key={r.value}
              href={{
                pathname: "/people",
                query: {
                  ...filters,
                  role: filters.role === r.value ? "" : r.value,
                },
              }}
              className={`rounded-full border px-3 py-2 text-sm ${
                filters.role === r.value
                  ? "border-lime bg-lime text-ink"
                  : "border-border"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search people..."
            aria-label="Search people"
            className="input"
          />
          <button type="submit" className="btn">
            Search
          </button>
        </div>

        <Select name="lang" value={filters.lang} label="Any language">
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>

        <Select name="year" value={filters.year} label="Any year">
          {USC_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>

        <select
          name="sort"
          defaultValue={filters.sort}
          aria-label="Sort"
          className="input"
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="size">Team size</option>
        </select>
      </div>
  
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

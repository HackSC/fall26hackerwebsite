"use client";

import Form from "next/form";
import Link from "next/link";
import type { PeopleFilters } from "@/lib/data";
import { LANGUAGES, ROLES, TEAM_SIZES, USC_YEARS } from "@/lib/constants";

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

      {active && (
        <Link
          href="/people"
          className="text-sm text-accent hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>

      <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-3">
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
            className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors peer-checked:bg-[#990000] peer-focus-visible:ring-2 peer-focus-visible:ring-[#990000] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
          />
        </label>

        <input type="hidden" name="role" value={filters.role} />
        
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted">
          Skills
        </p>

        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (            
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
              className={`rounded-full border px-4 py-2 text-sm transition ${
                filters.role === r.value
                  ? "border-[#990000] bg-[#990000] text-white"
                  : "border-border text-foreground hover:border-[#990000]"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

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
        <input type="hidden" name="size" value={filters.size} />

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted">
            Team size
          </p>

          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.filter((n) => [2, 3, 4].includes(n)).map((n) => (
              <Link
                key={n}
                href={{
                  pathname: "/people",
                  query: {
                    ...filters,
                    size: filters.size === String(n) ? "" : String(n),
                  },
                }}
                aria-current={filters.size === String(n) ? "true" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                  filters.size === String(n)
                    ? "border-[#990000] bg-[#990000] text-white"
                    : "border-border text-foreground hover:border-[#990000]"
                }`}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
        <select name="sort" defaultValue={filters.sort} aria-label="Sort" className="input">
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

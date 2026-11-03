
"use client";

import Form from "next/form";
import Link from "next/link";
import type { PeopleFilters } from "@/lib/data";
import { TEAM_SIZES, USC_YEARS } from "@/lib/constants";

const ROLES = [
  { label: "Frontend", value: "frontend" },
  { label: "Backend", value: "backend" },
  { label: "Design", value: "design" },
  { label: "Mobile", value: "mobile" },
  { label: "AI/ML", value: "ai-ml" },
];

export function FilterBar({
  filters,
  demoMode = false,
  selectedRoles = [],
}: {
  filters: PeopleFilters;
  demoMode?: boolean;
  selectedRoles?: string[];
}) {
  const clearLink = demoMode ? "/people?demo=1" : "/people";

  function roleLink(value: string) {
    const nextRoles = selectedRoles.includes(value)
      ? selectedRoles.filter((role) => role !== value)
      : [...selectedRoles, value];

    return {
      pathname: "/people",
      query: {
        ...(demoMode ? { demo: "1" } : {}),
        role: nextRoles,
        status: filters.status,
        size: filters.size,
        year: filters.year,
      },
    };
  }

  return (
    <Form
      key={`${filters.size}-${filters.year}-${filters.status}-${selectedRoles.join(",")}-${demoMode}`}
      action="/people"
      replace
      onChange={(event) => {
        if (
          event.target instanceof HTMLSelectElement ||
          (event.target instanceof HTMLInputElement &&
            event.target.type === "checkbox")
        ) {
          event.currentTarget.requestSubmit();
        }
      }}
      className="space-y-6 px-1 py-2 text-ink"
    >
      {demoMode && (
        <input type="hidden" name="demo" value="1" />
      )}

      {selectedRoles.map((role) => (
        <input
          key={role}
          type="hidden"
          name="role"
          value={role}
        />
      ))}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Link
          href={clearLink}
          className="text-xs underline underline-offset-2 hover:opacity-70"
        >
          Clear all
        </Link>
      </div>

      {/* Looking for team */}
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            Looking for team
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-muted">
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
          className="relative h-5 w-9 shrink-0 rounded-full bg-placeholder transition peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-link after:absolute after:left-[3px] after:top-[3px] after:h-3.5 after:w-3.5 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-4"
        />
      </label>

      {/* Role multi-select */}
      <div className="space-y-3">
        <p className="text-xs text-muted">Role</p>

        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const active = selectedRoles.includes(role.value);

            const className = `rounded-full border px-3 py-2 text-xs transition ${
              active
                ? "border-lime bg-lime text-ink"
                : "border-border bg-surface/70 text-ink hover:border-lime"
            }`;

            return (
              <Link
                key={role.value}
                href={roleLink(role.value)}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {role.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Ideal team size */}
      <div className="space-y-2">
        <label
          htmlFor="people-size"
          className="block text-xs text-muted"
        >
          Ideal team size
        </label>

        <div className="relative">
          <select
            id="people-size"
            name="size"
            defaultValue={filters.size}
            className="w-full appearance-none rounded-xl border-0 bg-surface-2 px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-link"
          >
            <option value="">Any</option>
            {TEAM_SIZES.filter((size) =>
              [2, 3, 4].includes(size)
            ).map((size) => (
              <option key={size} value={String(size)}>
                {size} people
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            ⌄
          </span>
        </div>
      </div>

      {/* Year / grade */}
      <div className="space-y-2">
        <label
          htmlFor="people-year"
          className="block text-xs text-muted"
        >
          Year / grade
        </label>

        <div className="relative">
          <select
            id="people-year"
            name="year"
            defaultValue={filters.year}
            className="w-full appearance-none rounded-xl border-0 bg-surface-2 px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-link"
          >
            <option value="">Any</option>
            {USC_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            ⌄
          </span>
        </div>
      </div>
    </Form>
  );
}

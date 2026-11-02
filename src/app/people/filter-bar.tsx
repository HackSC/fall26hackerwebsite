
"use client";

import Form from "next/form";
import Link from "next/link";
import type { PeopleFilters } from "@/lib/data";
import { TEAM_SIZES, USC_YEARS } from "@/lib/constants";

const ROLES = [
  { label: "Frontend", value: "frontend", supportedInLive: true },
  { label: "Backend", value: "backend", supportedInLive: true },
  { label: "Design", value: "design", supportedInLive: false },
  { label: "Mobile", value: "mobile", supportedInLive: false },
  { label: "AI/ML", value: "ai-ml", supportedInLive: false },
];

export function FilterBar({
  filters,
  demoMode = false,
  selectedRole = "",
}: {
  filters: PeopleFilters;
  demoMode?: boolean;
  selectedRole?: string;
}) {
  const clearLink = demoMode ? "/people?demo=1" : "/people";

  function roleLink(value: string) {
    return {
      pathname: "/people",
      query: {
        ...(demoMode ? { demo: "1" } : {}),
        role: selectedRole === value ? "" : value,
        status: filters.status,
        size: filters.size,
        year: filters.year,
      },
    };
  }

  return (
    <Form
      key={`${filters.size}-${filters.year}-${selectedRole}-${demoMode}`}
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
      className="space-y-6 px-1 py-2 text-[#252525]"
    >
      {demoMode && <input type="hidden" name="demo" value="1" />}
      <input type="hidden" name="role" value={selectedRole} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Filters</h2>
        <Link
          href={clearLink}
          className="text-xs underline underline-offset-2 hover:opacity-70"
        >
          Clear all
        </Link>
      </div>
      
      {/* Looking for team toggle */}
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium">
            Looking for team
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-gray-500">
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
          className="relative h-5 w-9 shrink-0 rounded-full bg-[#DFDFE3] transition peer-checked:bg-[#DFFF70] peer-focus-visible:ring-2 peer-focus-visible:ring-[#DFFF70] after:absolute after:left-[3px] after:top-[3px] after:h-3.5 after:w-3.5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
        />
      </label>

      <div className="space-y-3">
        <p className="text-xs text-gray-500">Role</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => {
            const enabled = demoMode || role.supportedInLive;
            const active = selectedRole === role.value;

            const className = `rounded-full border px-3 py-2 text-xs transition ${
              active
                ? "border-[#DFFF70] bg-[#DFFF70] text-[#171717]"
                : "border-[#E5E5E5] bg-white/70 text-[#2D2D2D] hover:border-[#C6F14B]"
            }`;

            return enabled ? (
              <Link
                key={role.value}
                href={roleLink(role.value)}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {role.label}
              </Link>
            ) : (
              <span
                key={role.value}
                title="Requires backend role support"
                className={`${className} cursor-not-allowed opacity-50`}
              >
                {role.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="people-size"
          className="block text-xs text-gray-500"
        >
          Ideal team size
        </label>

        <div className="relative">
          <select
            id="people-size"
            name="size"
            defaultValue={filters.size}
            className="w-full appearance-none rounded-xl border-0 bg-[#F1F1F5] px-3 py-3 text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#DFFF70]"
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
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            ⌄
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="people-year"
          className="block text-xs text-gray-500"
        >
          Year / grade
        </label>

        <div className="relative">
          <select
            id="people-year"
            name="year"
            defaultValue={filters.year}
            className="w-full appearance-none rounded-xl border-0 bg-[#F1F1F5] px-3 py-3 text-sm text-[#272727] outline-none focus:ring-2 focus:ring-[#DFFF70]"
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
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            ⌄
          </span>
        </div>
      </div>
    </Form>
  );
}

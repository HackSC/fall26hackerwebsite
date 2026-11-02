import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, TEAM_STATUSES } from "@/lib/constants";
import {
  getProfile,
  searchProfiles,
  type PeopleFilters,
  type PeopleSort,
} from "@/lib/data";
import type { DevRole, Profile, TeamStatus } from "@/lib/database.types";
import { firstParam } from "@/lib/utils";
import { demoProfiles, filterDemoProfiles } from "./demo-profiles";
import { FilterBar } from "./filter-bar";
import { ProfileCard } from "./profile-card";

type SearchParams = Awaited<PageProps<"/people">["searchParams"]>;

const allowedRoleValues = new Set([
  "frontend",
  "backend",
  "design",
  "mobile",
  "ai-ml",
  "fullstack", // old links remain valid, but no Full-stack pill in the UI
]);

function parseSelectedRoles(value: SearchParams["role"]): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values)].filter((role) => allowedRoleValues.has(role));
}

function parseFilters(params: SearchParams): PeopleFilters {
  const role = firstParam(params.role);
  const status = firstParam(params.status);
  const sort = firstParam(params.sort);

  return {
    q: firstParam(params.q).trim().slice(0, 100),
    role: ROLES.some((r) => r.value === role) ? (role as DevRole) : "",
    status: TEAM_STATUSES.some((s) => s.value === status)
      ? (status as TeamStatus)
      : "",
    year: firstParam(params.year),
    lang: firstParam(params.lang),
    size: /^\d$/.test(firstParam(params.size))
      ? firstParam(params.size)
      : "",
    sort: (["newest", "name", "size"] as const).includes(sort as PeopleSort)
      ? (sort as PeopleSort)
      : "newest",
  };
}

async function searchLiveWithRoles(filters: PeopleFilters, selectedRoles: string[]) {
  const supportedRoles = selectedRoles.filter(
    (role): role is DevRole => ROLES.some((r) => r.value === role)
  );

  // A manually-entered URL with only unsupported roles should not show all users.
  if (selectedRoles.length > 0 && supportedRoles.length === 0) {
    return { profiles: [] as Profile[], error: null as string | null };
  }

  if (supportedRoles.length <= 1) {
    return searchProfiles({ ...filters, role: supportedRoles[0] ?? "" });
  }

  // The existing data layer accepts one role. Search each selected role and
  // union results (OR), without changing Supabase schemas or shared data APIs.
  const results = await Promise.all(
    supportedRoles.map((role) => searchProfiles({ ...filters, role }))
  );
  const error = results.find((result) => result.error)?.error ?? null;
  const unique = new Map<string, Profile>();
  for (const result of results) {
    for (const profile of result.profiles) unique.set(profile.id, profile);
  }
  const profiles = [...unique.values()];

  if (filters.sort === "name") {
    profiles.sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === "size") {
    profiles.sort((a, b) =>
      (a.team_size_pref ?? Number.MAX_SAFE_INTEGER) -
      (b.team_size_pref ?? Number.MAX_SAFE_INTEGER)
    );
  } else {
    profiles.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  return { profiles, error };
}

export default function PeoplePage({
  searchParams,
}: PageProps<"/people">) {
  return (
    <Suspense fallback={<div className="card mt-6 h-64 animate-pulse" />}>
      <PeopleResults searchParams={searchParams} />
    </Suspense>
  );
}

async function PeopleResults({
  searchParams,
}: Pick<PageProps<"/people">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="card mt-6 text-center">
        <p>Sign in to see other hackers and their contact info.</p>
        <Link href="/login?next=/people" className="btn mt-4">
          Sign in
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const filters = parseFilters(params);
  const demoMode = firstParam(params.demo) === "1";
  const selectedRoles = parseSelectedRoles(params.role);

  // Demo mode uses fictional data; live mode retains Supabase and auth.
  const [{ profiles, error }, myProfile] = demoMode
    ? ([
        {
          profiles: filterDemoProfiles(demoProfiles, filters, selectedRoles),
          error: null,
        },
        null,
      ] as const)
    : await Promise.all([
        searchLiveWithRoles(filters, selectedRoles),
        getProfile(user.id),
      ]);

  return (
    <div className="min-h-[calc(100vh-6rem)] pb-12">
      {!demoMode && !myProfile && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-gold/60 bg-gold/10">
          <p className="text-sm">
            You don&apos;t have a profile yet, so others can&apos;t find you.
          </p>
          <Link href="/profile" className="btn">
            Create profile
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-7 lg:grid-cols-[210px_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <FilterBar
            filters={filters}
            demoMode={demoMode}
            selectedRoles={selectedRoles}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-[#242424] sm:text-3xl">
              <span className="mr-2 text-[#FF4D4D]">✶</span>
              Nothing great is made alone.
            </h1>
            {!error && (
              <p className="mt-1 text-xs text-gray-500">
                {profiles.length}{" "}
                {demoMode ? "demo profiles" : "matching hackers"} ·{" "}
                {profiles.filter((p) => p.team_status === "looking").length}{" "}
                looking for a team
              </p>
            )}
            {demoMode && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="rounded-full bg-[#DFFF70] px-2 py-1 font-medium text-[#202020]">
                  Demo preview · fictional data
                </span>
                <Link href="/people" className="underline underline-offset-2">
                  Return to live directory
                </Link>
              </div>
            )}
          </div>

          {error ? null : profiles.length === 0 ? (
            <p className="rounded-xl bg-white p-7 text-center text-sm text-gray-500">
              No one matches those filters.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {profiles.map((p) => (
                <li key={p.id} className="min-w-0">
                  <ProfileCard profile={p} isMe={p.id === user.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

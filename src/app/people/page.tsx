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
import type { DevRole, TeamStatus } from "@/lib/database.types";
import { firstParam } from "@/lib/utils";
import { demoProfiles, filterDemoProfiles } from "./demo-profiles";
import { FilterBar } from "./filter-bar";
import { ProfileCard } from "./profile-card";

type SearchParams = Awaited<PageProps<"/people">["searchParams"]>;

function parseFilters(params: SearchParams): PeopleFilters {
  const role = firstParam(params.role);
  const status = firstParam(params.status);
  const sort = firstParam(params.sort);

  return {
    q: firstParam(params.q).trim().slice(0, 100),
    role: ROLES.some((r) => r.value === role)
      ? (role as DevRole)
      : "",
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

export default function PeoplePage({
  searchParams,
}: PageProps<"/people">) {
  return (
    <Suspense
      fallback={<div className="card mt-6 h-64 animate-pulse" />}
    >
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
  const selectedRole = firstParam(params.role);

  // Demo mode does not query the profiles table.
  // Live mode keeps the existing Supabase functions.
  const [{ profiles, error }, myProfile] = demoMode
    ? ([
        {
          profiles: filterDemoProfiles(
            demoProfiles,
            filters,
            selectedRole
          ),
          error: null,
        },
        null,
      ] as const)
    : await Promise.all([
        searchProfiles(filters),
        getProfile(user.id),
      ]);

  return (
    <div
      className="min-h-[calc(100vh-6rem)] pb-12"
      style={{
        backgroundImage:
          "radial-gradient(#e9e6e2 0.7px, transparent 0.7px)",
        backgroundSize: "15px 15px",
      }}
    >
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
            selectedRole={selectedRole}
          />
        </aside>

        <section className="min-w-0">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-tight text-[#242424] sm:text-3xl">
              <span className="mr-2 text-[#FF4D4D]">✶</span>
              Nothing great is made alone.
            </h1>

            {error ? null : (
              <p className="mt-1 text-xs text-gray-500">
                {profiles.length}{" "}
                {demoMode ? "demo profiles" : "matching hackers"} ·{" "}
                {
                  profiles.filter(
                    (p) => p.team_status === "looking"
                  ).length
                }{" "}
                looking for a team
              </p>
            )}

            {demoMode && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="rounded-full bg-[#DFFF70] px-2 py-1 font-medium text-[#202020]">
                  Demo preview · fictional data
                </span>
                <Link
                  href="/people"
                  className="underline underline-offset-2"
                >
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
                  <ProfileCard
                    profile={p}
                    isMe={p.id === user.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
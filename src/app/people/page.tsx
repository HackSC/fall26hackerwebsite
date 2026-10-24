import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, TEAM_STATUSES } from "@/lib/constants";
import { getProfile, searchProfiles, type PeopleFilters, type PeopleSort } from "@/lib/data";
import type { DevRole, TeamStatus } from "@/lib/database.types";
import { firstParam } from "@/lib/utils";
import { FilterBar } from "./filter-bar";
import { ProfileCard } from "./profile-card";

type SearchParams = Awaited<PageProps<"/people">["searchParams"]>;

function parseFilters(params: SearchParams): PeopleFilters {
  const role = firstParam(params.role);
  const status = firstParam(params.status);
  const sort = firstParam(params.sort);
  return {
    q: firstParam(params.q).trim().slice(0, 100),
    role: ROLES.some((r) => r.value === role) ? (role as DevRole) : "",
    status: TEAM_STATUSES.some((s) => s.value === status) ? (status as TeamStatus) : "",
    year: firstParam(params.year),
    lang: firstParam(params.lang),
    size: /^\d$/.test(firstParam(params.size)) ? firstParam(params.size) : "",
    sort: (["newest", "name", "size"] as const).includes(sort as PeopleSort)
      ? (sort as PeopleSort)
      : "newest",
  };
}

export default function PeoplePage({ searchParams }: PageProps<"/people">) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">People</h1>
      <p className="mt-1 text-sm text-muted">
        Find teammates — filter by role, language, and team status, then reach out.
      </p>
      <Suspense fallback={<div className="card mt-6 h-64 animate-pulse" />}>
        <PeopleResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PeopleResults({ searchParams }: Pick<PageProps<"/people">, "searchParams">) {
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

  const filters = parseFilters(await searchParams);
  const [{ profiles, error }, myProfile] = await Promise.all([
    searchProfiles(filters),
    getProfile(user.id),
  ]);

  return (
    <>
      {!myProfile && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-gold/60 bg-gold/10">
          <p className="text-sm">You don&apos;t have a profile yet, so others can&apos;t find you.</p>
          <Link href="/profile" className="btn">
            Create profile
          </Link>
        </div>
      )}

      <FilterBar filters={filters} />

      {error ? (
        <p className="card mt-6 text-sm text-accent">Couldn&apos;t load profiles: {error}</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">
            {profiles.length} {profiles.length === 1 ? "person" : "people"}
          </p>
          {profiles.length === 0 ? (
            <p className="card mt-3 text-center text-muted">No one matches those filters.</p>
          ) : (
            <ul className="mt-3 grid gap-4 md:grid-cols-2">
              {profiles.map((p) => (
                <li key={p.id}>
                  <ProfileCard profile={p} isMe={p.id === user.id} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

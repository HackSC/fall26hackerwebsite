import Image from "next/image";
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
    <div className="wrap pt-10 sm:pt-16">
      <div className="grid items-center gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <h1 className="display rise text-title">Find your team.</h1>
          <p className="rise mt-4 max-w-2xl text-lead text-muted" style={{ "--i": 1 } as React.CSSProperties}>
            Filter by role, language and team status, then reach out.
          </p>
        </div>
        <Image
          src="/images/campus-diorama.webp"
          alt="Illustration: an isometric sunny campus courtyard with a red-brick library, palm trees and students hacking at picnic tables."
          width={1800}
          height={1157}
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="rise h-auto w-full md:col-span-5"
          style={{ "--i": 2 } as React.CSSProperties}
        />
      </div>
      <Suspense fallback={<div className="skeleton mt-10 h-64" />}>
        <PeopleResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PeopleResults({ searchParams }: Pick<PageProps<"/people">, "searchParams">) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mt-12">
        <p className="text-lead font-semibold">Sign in to see other hackers and how to reach them.</p>
        <Link href="/login?next=/people" className="btn mt-6">
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
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 bg-gold p-5 text-on-tag">
          <p className="font-semibold">You don&apos;t have a profile yet, so other hackers can&apos;t find you.</p>
          <Link href="/profile" className="btn">
            Create profile
          </Link>
        </div>
      )}

      <FilterBar filters={filters} />

      {error ? (
        <p role="alert" className="mt-8 font-semibold text-danger">
          Couldn&apos;t load profiles: {error}
        </p>
      ) : (
        <>
          <p className="mt-10 font-semibold text-muted" role="status">
            {profiles.length} {profiles.length === 1 ? "person" : "people"}
          </p>
          {profiles.length === 0 ? (
            <div className="mt-4 flex items-center gap-6 bg-surface p-8">
              <Image src="/images/sticker-palm.webp" alt="" width={459} height={512} className="h-24 w-auto" />
              <div>
                <p className="text-lead font-semibold">No one matches those filters.</p>
                <Link href="/people" className="link mt-3 inline-block">
                  Clear filters
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

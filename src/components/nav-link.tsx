"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

type Props = { href: string; children: React.ReactNode };

const CLASSES =
  "inline-flex min-h-11 items-center text-muted transition-colors duration-150 hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-hibiscus aria-[current=page]:decoration-[3px] aria-[current=page]:underline-offset-[0.4em]";

// The pathname is runtime-only, so prerendering shows the plain link and streams in the active state.
export function NavLink({ href, children }: Props) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={CLASSES}>
          {children}
        </Link>
      }
    >
      <ActiveLink href={href}>{children}</ActiveLink>
    </Suspense>
  );
}

function ActiveLink({ href, children }: Props) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={CLASSES}>
      {children}
    </Link>
  );
}

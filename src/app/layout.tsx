import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/app/auth/actions";
import { HackscLogo, HibiscusMark } from "@/components/brand";
import { NavLink } from "@/components/nav-link";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

// Open-source successor to HK Grotesk, the typeface on HackSC's 2025 site.
const hanken = Hanken_Grotesk({
  variable: "--font-text",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackSC Fall '26",
  description: "Live countdown, schedule, and team formation for HackSC Fall '26 hackers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${hanken.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ground"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-20 bg-ground/90 backdrop-blur-md">
          <nav aria-label="Main" className="wrap flex min-h-16 items-center gap-6 sm:gap-10">
            <Link href="/" aria-label="HackSC Fall '26 home" className="flex shrink-0 items-center gap-3">
              <HibiscusMark className="h-9 w-auto sm:hidden" />
              <HackscLogo className="hidden h-9 w-auto sm:block" />
              <span className="hidden font-semibold text-muted sm:inline">Fall &apos;26</span>
            </Link>
            <div className="flex items-center gap-5 font-semibold sm:gap-7">
              <NavLink href="/">Live</NavLink>
              <NavLink href="/people">People</NavLink>
            </div>
            <div className="ml-auto">
              <Suspense fallback={<div className="skeleton h-11 w-24" />}>
                <AuthStatus />
              </Suspense>
            </div>
          </nav>
        </header>

        {!isSupabaseConfigured && (
          <p role="status" className="bg-gold px-4 py-2 text-center text-sm font-semibold text-on-tag">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to <code>.env.local</code> and
            add your project URL and publishable key.
          </p>
        )}

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}

async function AuthStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="btn">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 font-semibold sm:gap-6">
      <NavLink href="/profile">Profile</NavLink>
      <form action={signOut}>
        <button type="submit" className="btn-quiet">
          Sign out
        </button>
      </form>
    </div>
  );
}

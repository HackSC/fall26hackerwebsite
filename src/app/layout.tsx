import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "@/app/auth/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fall '26 Hackathon",
  description: "Schedule, countdown, and team formation for hackers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="text-accent">Fall &apos;26</span> Hackathon
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <Link href="/people" className="hover:text-foreground">
                People
              </Link>
            </div>
            <div className="ml-auto text-sm">
              <Suspense fallback={null}>
                <AuthStatus />
              </Suspense>
            </div>
          </nav>
        </header>

        {!isSupabaseConfigured && (
          <div className="border-b border-gold/50 bg-gold/15 px-4 py-2 text-center text-sm">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and add your project URL and publishable key.
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
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
    <div className="flex items-center gap-3">
      <Link href="/profile" className="text-muted hover:text-foreground">
        My profile
      </Link>
      <form action={signOut}>
        <button type="submit" className="btn-ghost py-1.5">
          Sign out
        </button>
      </form>
    </div>
  );
}

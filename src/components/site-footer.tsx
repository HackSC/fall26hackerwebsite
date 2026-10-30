import Image from "next/image";
import { IMAGE_CREDITS } from "@/lib/credits";
import { HackscLogo } from "./brand";

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-surface sm:mt-44">
      <div className="wrap grid gap-10 pt-16 pb-12 lg:grid-cols-12 lg:gap-16 lg:pt-24">
        <figure className="lg:col-span-6">
          <Image
            src="/images/hibiscus-plate-1855.jpg"
            alt="Hand-coloured engraving of a red hibiscus flower with green leaves, labelled China-Rose."
            width={1600}
            height={923}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="h-auto w-full"
          />
          <figcaption className="mt-3 text-sm text-muted">
            China-Rose, from The American Flora, 1855. Our hibiscus, 170 years earlier.
          </figcaption>
        </figure>

        <div className="flex flex-col justify-between gap-10 lg:col-span-6">
          <p className="text-lead font-display font-semibold">
            Fall &apos;26 is run by HackSC, USC&apos;s student-run hackathon team. Stuck or lost? Find an
            organizer, or email{" "}
            <a href="mailto:team@hacksc.com" className="link">
              team@hacksc.com
            </a>
            .
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            <li>
              <a href="https://hacksc.com" className="link">
                hacksc.com
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/hackscofficial/" className="link">
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap pb-10">
        <HackscLogo className="h-auto w-full" />
        <ul className="mt-8 space-y-1 text-sm text-muted">
          {IMAGE_CREDITS.map((c) => (
            <li key={c.what}>
              {c.what}: <a href={c.href} className="underline underline-offset-2 hover:text-ink">{c.credit}</a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

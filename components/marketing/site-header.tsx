import Link from "next/link";
import { MINI_APP_HREF, PRICING_PAPER_HREF } from "./links";

export function SiteHeader() {
  return (
    <header className="border-b border-ink/10">
      <div className="flex h-1.5" aria-hidden>
        <div className="w-2/3 bg-gate" />
        <div className="w-1/3 bg-stamp" />
      </div>
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5 py-5 sm:px-8">
        <Link href="/" className="group block">
          <p className="font-mono text-[10px] tracking-[0.28em] text-ink/45 uppercase">
            Travel utility
          </p>
          <p className="mt-1 font-serif text-[28px] leading-none tracking-tight text-ink sm:text-[32px]">
            Late Gate
          </p>
        </Link>
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 pb-1 font-mono text-[11px] tracking-[0.16em] uppercase"
        >
          <a
            href={PRICING_PAPER_HREF}
            className="text-ink/70 underline-offset-4 hover:text-ink hover:underline"
          >
            Paper
          </a>
          <Link
            href={MINI_APP_HREF}
            className="text-ink/70 underline-offset-4 hover:text-ink hover:underline"
          >
            Mini app
          </Link>
        </nav>
      </div>
    </header>
  );
}

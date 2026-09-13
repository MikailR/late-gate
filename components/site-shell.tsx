import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Narrow Day-1 desk wrapper. Kept so quote / refuse / ticket stay reachable
 * after `/` became the marketing homepage. Not a restyle of those screens.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col px-5 py-8">
      <header className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
          Proto desk
        </p>
        <Link
          href="/"
          className="mt-2 block font-serif text-[28px] leading-none text-ink"
        >
          Late Gate
        </Link>
      </header>
      {children}
    </div>
  );
}

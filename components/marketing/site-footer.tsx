import Link from "next/link";
import { MINI_APP_HREF, PRICING_PAPER_HREF } from "./links";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div className="max-w-xl">
          <p className="font-serif text-[22px] leading-none text-ink">Late Gate</p>
          <p className="mt-3 font-serif text-[16px] leading-6 text-ink/65">
            An ETHOnline project. A travel utility for parametric flight-delay
            stubs. The house, or limited partners, may back the book.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-col gap-2 font-mono text-[11px] tracking-[0.14em] text-ink/60 uppercase sm:text-right"
        >
          <a href={PRICING_PAPER_HREF} className="hover:text-ink">
            Pricing paper
          </a>
          <Link href={MINI_APP_HREF} className="hover:text-ink">
            Mini app (coming soon)
          </Link>
        </nav>
      </div>
    </footer>
  );
}

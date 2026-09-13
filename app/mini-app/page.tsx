import type { Metadata } from "next";
import Link from "next/link";
import { PRICING_PAPER_HREF } from "@/components/marketing/links";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Mini app (coming soon)",
  description:
    "The Late Gate mini app is coming soon. Read the pricing paper while the traveler desk is rebuilt.",
};

export default function MiniAppPage() {
  return (
    <div className="lg-ruled min-h-full">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col px-5 py-16 sm:px-8 sm:py-24">
        <p className="font-mono text-[11px] tracking-[0.24em] text-stamp uppercase">
          Coming soon
        </p>
        <h1 className="mt-4 font-serif text-[48px] leading-[0.95] tracking-tight text-ink sm:text-[60px]">
          The mini app is on its way.
        </h1>
        <p className="mt-6 max-w-xl font-serif text-[19px] leading-7 text-ink/75">
          The traveler desk is being rebuilt as a mini app. This page is a
          placeholder so the homepage has a real destination. Pricing, stubs,
          and payouts stay the same.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-[2px] bg-gate px-6 font-mono text-[12px] tracking-[0.16em] text-paper uppercase hover:bg-gate/90"
          >
            Back to Late Gate
          </Link>
          <a
            href={PRICING_PAPER_HREF}
            className="inline-flex h-12 items-center justify-center rounded-[2px] border border-ink/20 px-6 font-mono text-[12px] tracking-[0.16em] text-ink uppercase hover:bg-ink/5"
          >
            Read the pricing paper
          </a>
        </div>
        <p className="mt-8 font-serif text-[15px] leading-6 text-ink/50">
          Need the Day-1 lookup desk while the mini app is unfinished?{" "}
          <Link href="/quote" className="text-ink underline underline-offset-4">
            Open the proto desk
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

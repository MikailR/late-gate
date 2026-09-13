import Link from "next/link";
import { MINI_APP_HREF, PRICING_PAPER_HREF } from "./links";

type CtaRowProps = {
  align?: "start" | "center";
};

export function CtaRow({ align = "start" }: CtaRowProps) {
  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center"
          : "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
      }
    >
      <a
        href={PRICING_PAPER_HREF}
        className="inline-flex h-12 items-center justify-center rounded-[2px] bg-gate px-6 font-mono text-[12px] tracking-[0.16em] text-paper uppercase transition-colors hover:bg-gate/90"
      >
        Read the pricing paper
      </a>
      <Link
        href={MINI_APP_HREF}
        className="inline-flex h-12 items-center justify-center rounded-[2px] border border-ink/20 bg-transparent px-6 font-mono text-[12px] tracking-[0.16em] text-ink uppercase transition-colors hover:bg-ink/5"
      >
        Open mini app
        <span className="ml-3 font-mono text-[10px] tracking-[0.14em] text-ink/45 normal-case">
          Coming soon
        </span>
      </Link>
    </div>
  );
}

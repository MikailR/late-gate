import { CtaRow } from "./cta-row";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-stamp uppercase">
            Parametric delay stubs
          </p>
          <h1 className="mt-4 max-w-[14ch] font-serif text-[48px] leading-[0.95] tracking-tight text-ink sm:text-[64px]">
            If they miss the gate, you don&apos;t miss the money.
          </h1>
          <p className="mt-6 max-w-xl font-serif text-[19px] leading-7 text-ink/75">
            Late Gate is a travel utility. If the aircraft is late past a
            buffer, you get a fixed payout. Takeoff delay or arrival delay.
            Locked price. Limited stubs.
          </p>
          <div className="mt-8">
            <CtaRow />
          </div>
        </div>

        <HeroStubCard />
      </div>
    </section>
  );
}

function HeroStubCard() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div
        aria-hidden
        className="lg-stamp pointer-events-none absolute -top-3 -right-2 z-10 rotate-[-12deg] px-2.5 py-1.5 sm:right-2"
      >
        <p className="font-serif text-[11px] leading-none tracking-[0.22em] uppercase">
          Delay stub
        </p>
        <p className="mt-1 text-center font-mono text-[13px] leading-none tracking-[0.18em]">
          Locked
        </p>
      </div>

      <article className="ticket relative">
        <div className="px-6 pt-6 pb-5">
          <p className="font-mono text-[10px] tracking-[0.24em] text-ink/40 uppercase">
            Gate receipt
          </p>
          <p className="mt-3 font-serif text-[30px] leading-none text-ink">
            Late Gate
          </p>
          <p className="mt-3 font-serif text-[16px] leading-6 text-ink/65">
            A delay cushion on a single seat. One price in. One payout out,
            if the aircraft is late past the buffer.
          </p>
        </div>

        <div className="lg-perf h-4 border-y border-dashed border-ink/15" aria-hidden />

        <dl className="grid grid-cols-2 gap-4 px-6 py-5">
          <div>
            <dt className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
              Takeoff delay
            </dt>
            <dd className="mt-1 font-serif text-[34px] leading-none text-ink">$14</dd>
            <dd className="mt-2 font-serif text-[14px] leading-5 text-ink/60">
              Pays if the aircraft leaves later than the cushion.
            </dd>
          </div>
          <div className="text-right">
            <dt className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
              Arrival delay
            </dt>
            <dd className="mt-1 font-serif text-[34px] leading-none text-ink">$9</dd>
            <dd className="mt-2 font-serif text-[14px] leading-5 text-ink/60">
              Pays if the aircraft reaches the gate later than the cushion.
            </dd>
          </div>
        </dl>

        <div className="border-t border-dashed border-ink/15 px-6 py-5">
          <p className="font-mono text-[10px] tracking-[0.16em] text-ink/40 uppercase">
            Payouts
          </p>
          <p className="mt-2 font-serif text-[22px] leading-none text-ink">
            $100 · $150 · $200
          </p>
          <p className="mt-2 font-serif text-[14px] leading-5 text-ink/55">
            Same table for both stubs. The cushion you pick sets the payout.
          </p>
        </div>
      </article>
    </div>
  );
}

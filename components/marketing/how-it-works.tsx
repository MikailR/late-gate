const STEPS = [
  {
    n: "01",
    title: "Choose a flight and a delay cushion",
    body: "Look up the trip. Pick how late the aircraft must be before the stub pays.",
  },
  {
    n: "02",
    title: "Buy a limited stub",
    body: "Pay one locked price. Only a short book is written on each flight.",
  },
  {
    n: "03",
    title: "Get the payout, or keep flying",
    body: "If the aircraft is late past the buffer, you receive the fixed payout. If it is not, the stub expires.",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-ink/10 bg-paper-hot/40"
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <p className="font-mono text-[11px] tracking-[0.24em] text-ink/45 uppercase">
          How it works
        </p>
        <h2 className="mt-3 max-w-[16ch] font-serif text-[36px] leading-[1.05] text-ink sm:text-[42px]">
          Three steps. One locked price.
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t border-ink/15 pt-5">
              <p className="font-mono text-[11px] tracking-[0.22em] text-gate uppercase">
                {step.n}
              </p>
              <h3 className="mt-3 font-serif text-[24px] leading-7 text-ink">
                {step.title}
              </h3>
              <p className="mt-3 font-serif text-[17px] leading-6 text-ink/65">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

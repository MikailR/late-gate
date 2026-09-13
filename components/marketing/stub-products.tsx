const PRODUCTS = [
  {
    kicker: "Takeoff delay",
    price: "$14",
    body: "Pays if the aircraft leaves the gate later than the cushion you pick.",
  },
  {
    kicker: "Arrival delay",
    price: "$9",
    body: "Pays if the aircraft reaches the gate later than the cushion you pick.",
  },
] as const;

export function StubProducts() {
  return (
    <section id="stubs" className="border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] tracking-[0.24em] text-ink/45 uppercase">
            Two stubs
          </p>
          <h2 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink sm:text-[42px]">
            Takeoff or arrival. Same payout table.
          </h2>
          <p className="mt-4 font-serif text-[18px] leading-7 text-ink/70">
            The product sets the locked price. The delay cushion sets the
            payout. Fair, transparent pricing. No hidden load on the stub.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.kicker} className="paper-card px-6 py-6">
              <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40 uppercase">
                {product.kicker}
              </p>
              <p className="mt-3 font-serif text-[48px] leading-none text-ink">
                {product.price}
              </p>
              <p className="mt-4 font-serif text-[17px] leading-6 text-ink/70">
                {product.body}
              </p>
              <p className="mt-5 font-mono text-[11px] tracking-[0.12em] text-ink/45 uppercase">
                Payouts $100 · $150 · $200
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-5 border-t border-ink/10 pt-8 md:grid-cols-2">
          <div>
            <h3 className="font-serif text-[22px] text-ink">Limited stubs</h3>
            <p className="mt-2 font-serif text-[16px] leading-6 text-ink/65">
              Each flight has a short book. When the stubs are gone, sales
              stop. That keeps the cushion honest.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-[22px] text-ink">Locked price</h3>
            <p className="mt-2 font-serif text-[16px] leading-6 text-ink/65">
              The number on the stub is the number you pay. Not every flight
              is listed. The pricing paper shows how the book is written.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

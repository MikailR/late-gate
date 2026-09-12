import { LookupForm, type DemoChip } from "@/components/lookup-form";
import { SiteShell } from "@/components/site-shell";
import { listFixtures } from "@/lib/flights/fixtures";
import type { HomeDemoKind } from "@/lib/flights/types";

export const dynamic = "force-dynamic";

const HINTS: Record<HomeDemoKind, string> = {
  hot: "Already a mess — should refuse",
  cutoff: "Too close to departure",
  clean: "Healthy estimate — should quote",
};

export default function HomePage() {
  const fixtures = listFixtures();
  const order: HomeDemoKind[] = ["hot", "cutoff", "clean"];
  const demos: DemoChip[] = order.flatMap((kind) => {
    const fixture = fixtures.find((row) => row.kind === kind);
    if (!fixture) return [];
    return [{
      kind,
      label: `${fixture.snapshot.carrier} ${fixture.snapshot.flightNumber} · ${fixture.snapshot.origin}`,
      hint: HINTS[kind],
      flightKey: fixture.flightKey,
      carrier: fixture.snapshot.carrier,
      flightNumber: fixture.snapshot.flightNumber,
      serviceDate: fixture.snapshot.serviceDate,
      origin: fixture.snapshot.origin,
    }];
  });

  return (
    <SiteShell>
      <p className="mb-6 font-serif text-[16px] leading-6 text-ink/70">
        Look up a flight. If we can still write a ticket, you&apos;ll see one
        number to pay and one number you get if the plane misses the gate by
        more than an hour.
      </p>
      <LookupForm demos={demos} />
    </SiteShell>
  );
}

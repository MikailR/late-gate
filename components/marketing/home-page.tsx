import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { StubProducts } from "./stub-products";

export function MarketingHomePage() {
  return (
    <div className="lg-ruled min-h-full">
      <a
        href="#how-it-works"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
      >
        Skip to how it works
      </a>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <StubProducts />
      </main>
      <SiteFooter />
    </div>
  );
}

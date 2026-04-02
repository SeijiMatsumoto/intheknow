import { CTA } from "@/components/landing/cta";
import { ExampleNewsletter } from "@/components/landing/example-newsletter";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { LandingFooter } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/nav";
import { Pricing } from "@/components/landing/pricing";

export default function Home() {

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] dark:hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(255,170,100,0.5),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1000px] hidden dark:block bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(120,119,198,0.5),transparent)]" />
      <LandingNav />
      <Hero />
      <HowItWorks />
      <ExampleNewsletter />
      <Features />
      <Pricing />
      <FAQ />
      <CTA />
      <LandingFooter />
    </div>
  );
}

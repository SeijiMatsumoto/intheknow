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
    <div className="min-h-screen bg-background">
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

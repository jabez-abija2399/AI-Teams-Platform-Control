import {
  LandingCompany,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHeader,
  LandingHero,
  LandingHowItWorks,
  LandingShowcase,
} from '@/components/landing/landing-sections';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingCompany />
        <LandingShowcase />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}

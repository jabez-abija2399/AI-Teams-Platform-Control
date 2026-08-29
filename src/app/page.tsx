import {
  LandingHeader,
  LandingHero,
  LandingSocialProof,
  LandingDepartments,
  LandingPipeline,
  LandingCTA,
  LandingFooter,
} from '@/components/landing/landing-sections';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingSocialProof />
        <LandingDepartments />
        <LandingPipeline />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

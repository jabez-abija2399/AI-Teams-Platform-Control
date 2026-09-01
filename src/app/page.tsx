import {
  LandingHeader,
  LandingHero,
  LandingWorkflowSpine,
  LandingAgents,
  LandingFeatures,
  LandingProof,
  LandingFooter,
} from '@/components/landing/landing-sections';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <LandingWorkflowSpine />
        <LandingAgents />
        <LandingFeatures />
        <LandingProof />
      </main>
      <LandingFooter />
    </div>
  );
}

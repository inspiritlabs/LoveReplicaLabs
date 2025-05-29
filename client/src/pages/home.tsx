import LandingHero from "@/components/landing-hero";
import FeaturesSection from "@/components/features-section";
import DemoWorkspace from "@/components/demo-workspace";

export default function Home() {
  return (
    <div className="min-h-screen">
      <LandingHero />
      <DemoWorkspace />
      <FeaturesSection />
    </div>
  );
}

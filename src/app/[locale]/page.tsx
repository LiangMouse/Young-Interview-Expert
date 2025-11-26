import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { SocialProof } from "@/components/social-proof";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SocialProof />
      </main>
      <Footer />
    </div>
  );
}

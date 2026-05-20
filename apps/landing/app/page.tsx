import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { StatsBar } from '@/components/StatsBar';
import { HowItWorks } from '@/components/HowItWorks';
import { Features } from '@/components/Features';
import { CityGrid } from '@/components/CityGrid';
import { Testimonials } from '@/components/Testimonials';
import { ForOwners } from '@/components/ForOwners';
import { Pricing } from '@/components/Pricing';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text-primary)]">
      <Nav />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <CityGrid />
      <Testimonials />
      <ForOwners />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}

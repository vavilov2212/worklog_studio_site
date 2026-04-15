import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import UseCases from '@/components/UseCases';
import Roadmap from '@/components/Roadmap';
import Download from '@/components/Download';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-surface text-on-surface selection:bg-primary/30">
      <Header />
      <Hero />
      <Features />
      <UseCases />
      <Roadmap />
      <Download />
      <Footer />
    </main>
  );
}

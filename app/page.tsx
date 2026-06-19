import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AskAISection from '@/components/chat/AskAISection';
import Features from '@/components/Features';
import Roadmap from '@/components/Roadmap';
import Download from '@/components/Download';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg text-ink selection:bg-accent/30">
      <Header />
      <Hero />
      <AskAISection />
      <Features />
      <Roadmap />
      <Download />
      <Footer />
    </main>
  );
}

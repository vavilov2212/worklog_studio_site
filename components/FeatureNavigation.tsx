'use client';

import { motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
}

export default function FeatureNavigation({ activeFeature, features }: { activeFeature: number, features: Feature[] }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-ink/90 backdrop-blur-md p-1.5 rounded-full border border-border shadow-2xl">
      {features.map((feature, i) => (
        <div 
          key={feature.id} 
          className="p-2 md:px-4 md:py-2 cursor-pointer group flex items-center gap-2"
          onClick={() => {
            const element = document.getElementById(`feature-${i}`);
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
            activeFeature === i ? 'bg-white scale-125' : 'bg-slate group-hover:bg-white'
          }`} />
          <span className="hidden md:block text-xs font-semibold text-slate group-hover:text-white transition-colors">
            {feature.title}
          </span>
        </div>
      ))}
      <div className="w-px h-6 bg-slate/20 mx-1"></div>
      <button 
        onClick={scrollToTop}
        className="p-3 rounded-full text-slate hover:text-white transition-colors"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}

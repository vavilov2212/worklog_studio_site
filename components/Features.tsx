'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { siteConfig } from '@/lib/config';
import FeatureVisual from './FeatureVisual';
import FeatureNavigation from './FeatureNavigation';

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  // Use scroll progress to control visibility and activation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Animate navigation visibility based on scroll progress
  const navOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], [0, 1, 1, 0]);
  const navY = useTransform(scrollYProgress, [0.1, 0.2, 0.8, 0.9], [20, 0, 0, 20]);

  return (
    <section id="features" ref={containerRef} className="relative max-w-7xl mx-auto px-8 py-32">
      <div className="text-center mb-32">
        <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase mb-6 border border-accent/20">
          Core Features
        </span>
        <h2 className="text-4xl md:text-6xl font-extrabold font-sans tracking-tighter text-ink mb-6">
          Engineered for <span className="text-accent">Flow State</span>
        </h2>
        <p className="text-lg md:text-xl text-slate max-w-2xl mx-auto font-sans">
          Everything you need to track your deep work, without the friction of traditional time trackers.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-16 relative">
        <div className="w-full lg:w-5/12 pb-[30vh]">
          {siteConfig.features.map((feature, index) => (
            <FeatureItem 
              key={feature.id} 
              feature={feature} 
              index={index} 
              setActiveFeature={setActiveFeature}
              activeFeature={activeFeature}
            />
          ))}
        </div>

        <div className="hidden lg:block w-full lg:w-7/12 relative">
          <div className="sticky top-32 h-[70vh] rounded-3xl overflow-hidden glass-panel border border-border shadow-2xl">
            <FeatureVisual activeFeature={activeFeature} />
          </div>
        </div>
      </div>

      <motion.div
        style={{ opacity: navOpacity, y: navY }}
        className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto">
          <FeatureNavigation activeFeature={activeFeature} features={siteConfig.features} />
        </div>
      </motion.div>
    </section>
  );
}

function FeatureItem({ feature, index, setActiveFeature, activeFeature }: { feature: any, index: number, setActiveFeature: (i: number) => void, activeFeature: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  // Update active feature when this item is in the center
  useEffect(() => {
    return scrollYProgress.on("change", (pos) => {
      if (pos > 0.4 && pos < 0.6) {
        setActiveFeature(index);
      }
    });
  }, [scrollYProgress, setActiveFeature, index]);

  return (
    <div id={`feature-${index}`} ref={ref} className="min-h-[70vh] lg:min-h-[70vh] flex flex-col justify-center py-12 lg:py-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-accent font-mono text-[10px] sm:text-xs tracking-widest leading-none font-black opacity-80">0{index + 1}</div>
        <div className="h-px bg-accent/20 flex-1"></div>
      </div>
      <h3 className="text-3xl md:text-4xl font-extrabold font-sans mb-6 text-ink tracking-tight">{feature.title}</h3>
      
      {/* Mobile/Tablet Visual */}
      <div className="lg:hidden w-full h-[350px] mb-8 rounded-2xl overflow-hidden glass-panel border border-border/50 shadow-xl">
        <FeatureVisual activeFeature={index} />
      </div>

      <p className="text-lg text-slate leading-relaxed lg:max-w-md">{feature.description}</p>
    </div>
  );
}

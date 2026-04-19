'use client';

import { motion } from 'motion/react';
import { siteConfig } from '@/lib/config';
import FeatureVisual from './FeatureVisual';

export default function Features() {
  return (
    <section id="features" className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-20 lg:pt-24 lg:pb-32">
      <div className="text-center mb-16 lg:mb-24">
        <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase mb-6 border border-accent/20">
          Core Features
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-sans tracking-tighter text-ink mb-6">
          Engineered for <span className="text-accent">Flow State</span>
        </h2>
        <p className="text-lg md:text-xl text-slate max-w-2xl mx-auto font-sans">
          Everything you need to track your deep work, without the friction of traditional time trackers.
        </p>
      </div>

      <div className="flex flex-col gap-16 lg:gap-32">
        {siteConfig.features.map((feature, index) => (
          <FeatureItem key={feature.id} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}

function FeatureItem({ feature, index }: { feature: any, index: number }) {
  // Alternate layout for desktop: text left/image right, then image left/text right
  const isReverse = index % 2 === 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col lg:items-center gap-8 lg:gap-16 ${isReverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
    >
      {/* Text Content */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-accent font-mono text-[10px] sm:text-xs tracking-widest leading-none font-black opacity-80">0{index + 1}</div>
          <div className="h-px bg-accent/20 w-12"></div>
        </div>
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-sans mb-6 text-ink tracking-tight">{feature.title}</h3>
        <p className="text-lg text-slate leading-relaxed">{feature.description}</p>
      </div>

      {/* Visual Content */}
      <div className="w-full lg:w-7/12">
        <div className="w-full min-h-[400px] h-auto lg:h-[550px] rounded-[2rem] overflow-hidden glass-panel border border-border shadow-xl relative">
          <FeatureVisual activeFeature={index} />
        </div>
      </div>
    </motion.div>
  );
}

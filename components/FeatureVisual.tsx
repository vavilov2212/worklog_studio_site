'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { siteConfig } from '@/lib/config';

export default function FeatureVisual({ activeFeature }: { activeFeature: number }) {
  const feature = siteConfig.features[activeFeature];

  return (
    <div className="absolute inset-0 w-full h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full h-full relative"
        >
          <Image
            src={feature.visual}
            alt={feature.title}
            fill
            className="object-cover opacity-60 mix-blend-screen"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-surface/80 to-transparent"></div>
          
          {/* Mock UI Overlay based on feature */}
          <div className="absolute inset-0 flex items-center justify-center p-12">
             <div className="w-full max-w-md bg-surface-container-high/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                    <div className="w-6 h-6 bg-primary rounded-md animate-pulse"></div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-headline text-lg">{feature.title}</h4>
                    <p className="text-xs text-primary-dim uppercase tracking-widest mt-1">System Active</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: feature.id === 'tracking' ? '85%' : feature.id === 'analytics' ? '60%' : '100%' }}
                       transition={{ duration: 1, delay: 0.2 }}
                       className="h-full bg-gradient-to-r from-primary to-tertiary shadow-[0_0_15px_rgba(159,167,255,0.5)]"
                     ></motion.div>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-on-surface-variant">
                     <span>{feature.id === 'tracking' ? 'Session: 01:24:00' : feature.id === 'analytics' ? 'Flow State: High' : 'Sync: Complete'}</span>
                     <span className="text-primary">100%</span>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

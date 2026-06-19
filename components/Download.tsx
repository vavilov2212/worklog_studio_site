'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Apple, Download, Monitor } from 'lucide-react';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function DownloadSection() {
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');

  useEffect(() => {
    setOs(detectOS());
  }, []);

  const { primaryOS, primaryUrl, secondaryOS, secondaryUrl } = getPlatformLinks(os, release);
  const primaryLabel = primaryOS === 'mac' ? 'Download for Mac' : primaryOS === 'windows' ? 'Download for Windows' : 'Download';
  const secondaryLabel = secondaryOS === 'mac' ? 'Also get it for Mac' : secondaryOS === 'windows' ? 'Also get it for Windows' : null;

  return (
    <section id="download" className="max-w-6xl mx-auto px-6 md:px-8 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-accent rounded-[32px] md:rounded-[48px] px-6 py-10 sm:p-12 md:p-16 lg:p-24 text-center relative overflow-hidden shadow-2xl shadow-accent/30"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-10 border border-white/30">
             <Download className="w-6 h-6 md:w-10 md:h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-8 tracking-tighter leading-[1.1] md:leading-none max-w-3xl">
            Upgrade your flow. <br/>
            <span className="opacity-60">Ready for macOS & Windows.</span>
          </h2>
          <p className="text-base md:text-xl text-white/80 font-medium mb-8 md:mb-12 max-w-xl">
            Get the native desktop experience designed for maximum productivity and zero distractions.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <a
              href={primaryUrl}
              className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 bg-white text-accent font-black rounded-xl md:rounded-2xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-xl active:scale-95"
            >
              {primaryOS === 'windows' ? (
                <Monitor className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Apple className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              )}
              {primaryLabel}
            </a>
            {secondaryUrl && secondaryLabel && (
              <a
                href={secondaryUrl}
                className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 bg-white/10 text-white border border-white/20 font-black rounded-xl md:rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-95"
              >
                {secondaryOS === 'windows' ? (
                  <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Apple className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                )}
                {secondaryLabel}
              </a>
            )}
          </div>
          <p className="mt-6 md:mt-8 text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 font-black">
            Native Desktop App • Performance Optimized
          </p>
        </div>
      </motion.div>
    </section>
  );
}

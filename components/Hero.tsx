'use client';

import { motion } from 'motion/react';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-8 pt-40 pb-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-start-2 md:col-span-10 text-center lg:text-left lg:col-span-5"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-border text-slate text-xs font-bold tracking-widest uppercase mb-6 border border-border">
            v1.0 Ready
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold font-sans tracking-tighter text-ink leading-[1.1] mb-6">
            Track your work. <br/>
            <span className="text-accent">Understand your flow.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate font-sans leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0">
            The minimal desktop time logger designed for deep focus. High-precision analytics without the overhead of heavy management tools.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <button className="px-8 py-4 bg-ink text-white font-bold rounded-lg hover:bg-ink/90 transition-all flex items-center gap-2">
              <Download className="w-5 h-5" />
              Download for macOS
            </button>
            <button className="px-8 py-4 bg-border text-slate font-medium rounded-lg cursor-not-allowed opacity-60">
              Windows Coming Soon
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-12 lg:col-span-7 mt-12 lg:mt-0 relative"
        >
          <div className="relative glass-panel rounded-2xl overflow-hidden shadow-2xl border border-border">
            <Image 
              src="https://picsum.photos/seed/worklog-hero/1200/800?blur=2" 
              alt="Worklog Studio Interface" 
              width={1200} 
              height={800} 
              className="w-full h-auto opacity-90"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-8 left-8 right-8">
               <div className="bg-white/90 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                         <div className="w-5 h-5 bg-accent rounded-sm" />
                      </div>
                      <div>
                        <h3 className="font-bold text-ink font-sans">Refactoring Auth Middleware</h3>
                        <p className="text-xs text-slate">Active Session • 02:45:12</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <div className="text-2xl font-bold text-ink font-mono">98%</div>
                       <div className="text-[10px] uppercase tracking-widest text-accent">Focus Score</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-accent"></div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

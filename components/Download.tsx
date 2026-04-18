'use client';
import { motion } from 'motion/react';
import { Apple, Download, Monitor } from 'lucide-react';

export default function DownloadSection() {
  return (
    <section id="download" className="max-w-6xl mx-auto px-8 py-32">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-accent rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-accent/30"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-10 border border-white/30">
             <Download className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none max-w-3xl">
            Upgrade your flow. <br/>
            <span className="opacity-60">Ready for macOS Sonoma.</span>
          </h2>
          <p className="text-xl text-white/80 font-medium mb-12 max-w-xl">
            Get the native desktop experience designed for maximum productivity and zero distractions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <a 
              href="https://github.com/vavilov2212/worklog_studio/releases/latest/download/worklogStudio.dmg"
              className="px-10 py-5 bg-white text-accent font-black rounded-2xl hover:bg-white/90 transition-all flex items-center gap-3 shadow-xl active:scale-95"
            >
              <Apple className="w-6 h-6 fill-current" />
              Download for Mac
            </a>
            <button className="px-10 py-5 bg-accent-foreground/10 text-white/50 border border-white/20 font-black rounded-2xl cursor-not-allowed flex items-center gap-3">
              <Monitor className="w-6 h-6" />
              Windows Next
            </button>
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-widest text-white/40 font-black">
            Native Desktop App • Performance Optimized
          </p>
        </div>
      </motion.div>
    </section>
  );
}

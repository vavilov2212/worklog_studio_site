'use client';

import { motion } from 'motion/react';
import { Download, Search, Play, Square, Briefcase, Plus, Monitor, ChevronDown, Copy, Circle } from 'lucide-react';

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-8 pt-48 pb-32 relative overflow-hidden bg-bg">
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase mb-8 border border-accent/20">
            <Circle className="w-2 h-2 fill-current animate-pulse" />
            Live v1.2 Ready
          </div>
          <h1 className="text-6xl md:text-8xl font-black font-sans tracking-tight text-ink leading-[0.95] mb-8">
            The heart of <br/>
            <span className="text-accent underline decoration-accent/20 underline-offset-8">your flow.</span>
          </h1>
          <p className="text-xl text-slate font-sans leading-relaxed mb-10 max-w-lg">
            A minimal, distraction-free desktop logger that helps you understand where your time actually goes. Designed for professionals who live in deep work.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-10 py-5 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center gap-3 shadow-xl shadow-accent/20 active:scale-95">
              <Download className="w-6 h-6" />
              Get Worklog for Mac
            </button>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-slate font-bold mb-1">Coming Next</span>
              <div className="flex gap-4 opacity-40">
                <p className="text-sm font-bold text-ink hover:opacity-100 transition-opacity cursor-pointer">Windows</p>
                <p className="text-sm font-bold text-ink hover:opacity-100 transition-opacity cursor-pointer">Linux</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 relative perspective-1000 hidden lg:block"
        >
          {/* Top Bar Mirroring the Screenshot */}
          <div className="absolute -top-12 left-0 right-0 h-10 bg-[#334155]/10 backdrop-blur-sm rounded-t-xl flex items-center justify-between px-4 border border-border/50">
             <div className="flex items-center gap-2">
                <Circle className="w-3 h-3 text-slate/40" />
                <span className="text-[10px] font-bold text-slate/60 uppercase tracking-widest">Study AI - Take a GAP test</span>
             </div>
             <div className="flex items-center gap-4 text-slate/40 scale-75">
                <Copy className="w-4 h-4" />
                <Monitor className="w-4 h-4" />
             </div>
          </div>

          <div className="relative bg-white rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-border">
            {/* Widget Title Bar */}
            <div className="bg-white border-b border-border py-4 px-6 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink text-sm">Worklog Studio</h3>
                  <ChevronDown className="w-4 h-4 text-slate" />
               </div>
               <div className="flex items-center gap-4 text-slate">
                  <Plus className="w-4 h-4" />
                  <Monitor className="w-4 h-4" />
               </div>
            </div>

            <div className="p-6 space-y-6 bg-[#f8fafc]">
               {/* Search Bar */}
               <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search or start a task..." 
                    readOnly
                    className="w-full h-14 pl-6 pr-12 rounded-2xl bg-white border-2 border-accent/20 text-slate font-medium placeholder:text-slate/40 transition-all focus:border-accent"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 bg-accent/5 rounded-lg">
                    <Search className="w-5 h-5 text-accent" />
                  </div>
               </div>

               {/* Active Session Card */}
               <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                  <div className="mb-4">
                     <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-black">Active Session</span>
                     <h4 className="text-3xl font-extrabold text-ink mt-2">Take a GAP test</h4>
                     <p className="text-slate font-medium">Study AI</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-8">
                     <div className="text-5xl font-mono font-bold tracking-tighter text-ink">00:00:33</div>
                     <button className="w-16 h-16 bg-stop rounded-2xl flex items-center justify-center shadow-lg shadow-stop/20 hover:scale-110 active:scale-95 transition-all">
                        <Square className="w-6 h-6 text-white fill-current" />
                     </button>
                  </div>
               </div>

               {/* Recent Activity */}
               <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] uppercase tracking-[0.2em] text-slate font-black">Recent Activity</span>
                     <button className="text-[10px] uppercase tracking-widest text-accent font-black hover:underline">View All</button>
                  </div>
                  
                  <div className="flex items-center gap-4 group">
                     <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                        <Briefcase className="w-5 h-5 text-white" />
                     </div>
                     <div>
                        <h5 className="font-bold text-ink text-sm">Take a GAP test</h5>
                        <p className="text-xs text-slate font-medium">Study AI</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Widget Footer */}
            <div className="bg-[#eff6ff] border-t border-accent/10 px-8 py-5 flex items-center justify-center">
               <p className="text-xs font-bold text-accent font-mono">
                  Today 06h 15m <span className="mx-2 opacity-30">|</span> Total 24h 30m
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


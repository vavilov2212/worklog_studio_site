'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Square, Play, Plus, Monitor, ChevronDown, Copy, Circle } from 'lucide-react';
import { Logo } from './Logo';

import { useTimer } from './TimerContext';

export default function Hero() {
  const { isRunning, time, toggleTimer, formatTime } = useTimer();
  const [isMounted, setIsMounted] = useState(false);
  const [version, setVersion] = useState('v1.2');

  // Initialize random starting time after mount to avoid hydration mismatch
  useEffect(() => {
    const initHero = async () => {
      setIsMounted(true);
      
      // Fetch latest version from GitHub
      try {
        const response = await fetch('https://api.github.com/repos/vavilov2212/worklog_studio/releases/latest');
        if (response.ok) {
          const data = await response.json();
          if (data.tag_name) {
            setVersion(data.tag_name);
          }
        }
      } catch (error) {
        // Fallback is already set in state
        console.error('Failed to fetch version:', error);
      }
    };
    
    // Using requestAnimationFrame to move state update out of synchronous effect body
    requestAnimationFrame(initHero);
  }, []);

  const handleToggleTimer = () => {
    toggleTimer();
  };

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 pt-24 md:pt-48 pb-12 md:pb-24 relative overflow-hidden bg-bg">
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]"></div>
      
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full text-center lg:text-left order-1"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] md:text-xs font-bold tracking-wider uppercase mb-6 md:mb-8 border border-accent/20">
            <Circle className="w-2 h-2 fill-current animate-pulse" />
            Live {version} Ready
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-sans tracking-tight text-ink leading-[1.1] lg:leading-[0.95] mb-6 md:mb-8">
            The heart of <br className="hidden sm:block"/>
            <span className="text-accent underline decoration-accent/20 underline-offset-8">your flow.</span>
          </h1>
          <p className="text-base md:text-xl text-slate font-sans leading-relaxed mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0">
            A minimal, distraction-free desktop logger that helps you understand where your time actually goes. Designed for professionals who live in deep work.
          </p>

          <div className="hidden lg:flex flex-wrap gap-4 items-center">
            <a 
              href="https://github.com/vavilov2212/worklog_studio/releases/latest/download/worklogStudio.dmg"
              className="px-10 py-5 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center gap-3 shadow-xl shadow-accent/20 active:scale-95"
            >
              <Download className="w-6 h-6" />
              Get Worklog for Mac
            </a>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] uppercase tracking-widest text-slate font-bold mb-1">Coming Next</span>
              <div className="flex gap-4 opacity-40">
                <p className="text-sm font-bold text-ink cursor-default select-none">Windows</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 w-full lg:perspective-1000 order-2 lg:order-2"
        >
          <div className="relative bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-border select-none lg:rotate-y-[-5deg]">
            {/* Widget Title Bar */}
            <div className="bg-white border-b border-border py-3 md:py-4 px-4 md:px-6 flex items-center justify-between pointer-events-none">
               <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink text-xs md:text-sm">Worklog Studio</h3>
               </div>
               <div className="flex items-center gap-4 text-slate">
                  <Plus className="w-3 md:w-4 h-3 md:h-4" />
                  <Monitor className="w-3 md:w-4 h-3 md:h-4" />
               </div>
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-[#f8fafc]">
               {/* Search Bar - Non Interactive */}
               <div className="relative pointer-events-none">
                  <div className="w-full h-10 md:h-14 pl-4 md:pl-6 pr-10 md:pr-12 rounded-xl md:rounded-2xl bg-white border-2 border-accent/10 flex items-center">
                    <span className="text-slate/40 text-xs md:text-sm font-medium">Search or start a task...</span>
                  </div>
                  <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-1 md:p-1.5 bg-accent/5 rounded-lg">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  </div>
               </div>

               {/* Active Session Card */}
               <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border shadow-sm">
                  <div className="mb-4 text-center sm:text-left">
                     <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-accent font-black">Active Session</span>
                     <h4 className="text-2xl md:text-3xl font-extrabold text-ink mt-2">Take a GAP test</h4>
                     <p className="text-slate text-sm md:text-base font-medium">Study AI</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0 mt-6 md:mt-8">
                     <div suppressHydrationWarning className="text-4xl md:text-5xl font-mono font-bold tracking-tighter text-ink">{formatTime(time)}</div>
                     <button 
                       onClick={handleToggleTimer}
                       className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer ${isRunning ? 'bg-stop shadow-stop/20' : 'bg-accent shadow-accent/20'}`}
                     >
                        {isRunning ? (
                          <Square className="w-5 h-5 md:w-6 md:h-6 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-current ml-1" />
                        )}
                     </button>
                  </div>
               </div>

               {/* Recent Activity - Non Interactive */}
               <div className="bg-white/50 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 border border-border/50 pointer-events-none hidden sm:block">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-slate font-black">Recent Activity</span>
                     <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-accent font-black">View All</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <Logo className="w-10 h-10 md:w-12 md:h-12" iconOnly />
                     <div>
                        <h5 className="font-bold text-ink text-xs md:text-sm">Take a GAP test</h5>
                        <p className="text-[10px] md:text-xs text-slate font-medium">Study AI</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Widget Footer - Non Interactive */}
            <div className="bg-[#eff6ff] border-t border-accent/10 md:px-8 py-3 md:py-5 flex items-center justify-center pointer-events-none">
               <p className="text-[10px] md:text-xs font-bold text-accent font-mono">
                  Today 06h 15m <span className="mx-1 md:mx-2 opacity-30">|</span> Total 24h 30m
               </p>
            </div>
          </div>
        </motion.div>

        {/* Mobile CTA Block - Order 3 */}
        <div className="lg:hidden w-full space-y-6 order-3">
          <a 
            href="https://github.com/vavilov2212/worklog_studio/releases/latest/download/worklogStudio.dmg"
            className="w-full py-5 bg-accent text-white font-bold rounded-2xl hover:bg-accent/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20 active:scale-95"
          >
            <Download className="w-6 h-6" />
            Download for Mac
          </a>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-slate font-black mb-2 opacity-50">Available for Desktop</span>
            <div className="flex gap-6 opacity-40 grayscale group cursor-default">
              <span className="text-[11px] font-black text-ink">macOS</span>
              <span className="text-[11px] font-black text-ink">Windows Soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


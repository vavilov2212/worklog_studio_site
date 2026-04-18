'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Square, Play, Plus, Monitor, ChevronDown, Copy, Circle } from 'lucide-react';
import { Logo } from './Logo';

export default function Hero() {
  const [isRunning, setIsRunning] = useState(true);
  const [time, setTime] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [version, setVersion] = useState('v1.2');

  // Initialize random starting time after mount to avoid hydration mismatch
  useEffect(() => {
    const initHero = async () => {
      setIsMounted(true);
      
      // Timer initialization
      const randomMinutes = Math.floor(Math.random() * 60);
      const randomSeconds = Math.floor(Math.random() * 60);
      setTime(randomMinutes * 60 + randomSeconds);

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

  // Timer interval
  useEffect(() => {
    if (!isMounted) return;
    
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isMounted]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      setTime(0);
    } else {
      setIsRunning(true);
    }
  };

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
            Live {version} Ready
          </div>
          <h1 className="text-6xl md:text-8xl font-black font-sans tracking-tight text-ink leading-[0.95] mb-8">
            The heart of <br/>
            <span className="text-accent underline decoration-accent/20 underline-offset-8">your flow.</span>
          </h1>
          <p className="text-xl text-slate font-sans leading-relaxed mb-10 max-w-lg">
            A minimal, distraction-free desktop logger that helps you understand where your time actually goes. Designed for professionals who live in deep work.
          </p>
          <div className="flex flex-wrap gap-4">
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
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 relative perspective-1000 hidden lg:block"
        >
          <div className="relative bg-white rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-border select-none">
            {/* Widget Title Bar */}
            <div className="bg-white border-b border-border py-4 px-6 flex items-center justify-between pointer-events-none">
               <div className="flex items-center gap-2">
                  <h3 className="font-bold text-ink text-sm">Worklog Studio</h3>
               </div>
               <div className="flex items-center gap-4 text-slate">
                  <Plus className="w-4 h-4" />
                  <Monitor className="w-4 h-4" />
               </div>
            </div>

            <div className="p-6 space-y-6 bg-[#f8fafc]">
               {/* Search Bar - Non Interactive */}
               <div className="relative pointer-events-none">
                  <input 
                    type="text" 
                    placeholder="Search or start a task..." 
                    readOnly
                    tabIndex={-1}
                    className="w-full h-14 pl-6 pr-12 rounded-2xl bg-white border-2 border-accent/10 text-slate font-medium placeholder:text-slate/40 outline-none"
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
                     <div suppressHydrationWarning className="text-5xl font-mono font-bold tracking-tighter text-ink">{formatTime(time)}</div>
                     <button 
                       onClick={handleToggleTimer}
                       className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 hover:scale-105 cursor-pointer ${isRunning ? 'bg-stop shadow-stop/20' : 'bg-accent shadow-accent/20'}`}
                     >
                        {isRunning ? (
                          <Square className="w-6 h-6 text-white fill-current" />
                        ) : (
                          <Play className="w-6 h-6 text-white fill-current ml-1" />
                        )}
                     </button>
                  </div>
               </div>

               {/* Recent Activity - Non Interactive */}
               <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-border/50 pointer-events-none">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] uppercase tracking-[0.2em] text-slate font-black">Recent Activity</span>
                     <span className="text-[10px] uppercase tracking-widest text-accent font-black">View All</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <Logo className="w-12 h-12" iconOnly />
                     <div>
                        <h5 className="font-bold text-ink text-sm">Take a GAP test</h5>
                        <p className="text-xs text-slate font-medium">Study AI</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Widget Footer - Non Interactive */}
            <div className="bg-[#eff6ff] border-t border-accent/10 px-8 py-5 flex items-center justify-center pointer-events-none">
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


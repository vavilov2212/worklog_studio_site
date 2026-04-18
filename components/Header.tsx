'use client';

import { motion } from 'motion/react';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl duration-300 ease-out border-b border-border"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink leading-tight tracking-tight">Worklog Studio</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-accent font-bold">Professional Tracking</p>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-10 font-sans tracking-tight text-sm font-medium">
          <Link href="#features" className="text-slate hover:text-ink transition-colors">Features</Link>
          <Link href="#use-cases" className="text-slate hover:text-ink transition-colors">Use Cases</Link>
          <Link href="#roadmap" className="text-slate hover:text-ink transition-colors">Roadmap</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="bg-accent text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/10">
            Get Started
          </button>
        </div>
      </div>
    </motion.header>
  );
}

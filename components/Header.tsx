'use client';

import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl duration-300 ease-out border-b border-border"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-ink font-sans">
          <div className="w-6 h-6 bg-ink rounded-md"></div>
          <span>Worklog Studio</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 font-sans tracking-tight text-sm font-medium">
          <Link href="#features" className="text-slate hover:text-ink transition-colors">Features</Link>
          <Link href="#use-cases" className="text-slate hover:text-ink transition-colors">Use Cases</Link>
          <Link href="#roadmap" className="text-slate hover:text-ink transition-colors">Roadmap</Link>
          <Link href="#docs" className="text-slate hover:text-ink transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="bg-ink text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-ink/90 transition-colors">
            Join Beta
          </button>
        </div>
      </div>
    </motion.header>
  );
}

'use client';

import { motion } from 'motion/react';
import { Logo } from './Logo';
import Link from 'next/link';
import { Github, Download } from 'lucide-react';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl duration-300 ease-out border-b border-border"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-10 font-sans tracking-tight text-sm font-medium">
          <Link href="#features" className="text-slate hover:text-ink transition-colors">Features</Link>
          <Link href="#roadmap" className="text-slate hover:text-ink transition-colors">Roadmap</Link>
        </nav>
        <div className="flex items-center gap-4 md:gap-6">
          <a 
            href="https://github.com/vavilov2212/worklog_studio/releases/latest/download/worklogStudio.dmg"
            className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors p-2 sm:p-0"
            title="Download for Mac"
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline-block">Download for Mac</span>
          </a>
          <a 
            href="https://github.com/vavilov2212/worklog_studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate hover:text-ink transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.header>
  );
}

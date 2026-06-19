'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import Link from 'next/link';
import { Github, Download } from 'lucide-react';
import AskAIHeaderPill from './chat/AskAIHeaderPill';
import ChatOverlay from './chat/ChatOverlay';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function Header() {
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');

  useEffect(() => {
    requestAnimationFrame(() => {
      setOs(detectOS());
    });
  }, []);

  const { primaryOS, primaryUrl } = getPlatformLinks(os, release);
  const label = primaryOS === 'mac' ? 'Download for Mac' : primaryOS === 'windows' ? 'Download for Windows' : 'Download';

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
          <AskAIHeaderPill />
          <a
            href={primaryUrl}
            className="flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors p-2 sm:p-0"
            title={label}
          >
            <Download className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline-block whitespace-nowrap">{label}</span>
          </a>
          <a
            href="https://github.com/vavilov2212/wl-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate hover:text-ink transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
      <ChatOverlay />
    </motion.header>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import Link from 'next/link';
import { Github, Download, Menu, X } from 'lucide-react';
import AskAIHeaderPill from './chat/AskAIHeaderPill';
import ChatOverlay from './chat/ChatOverlay';
import { useRelease } from './ReleaseContext';
import { detectOS, type DetectedOS } from '@/lib/detectOS';
import { getPlatformLinks } from '@/lib/release';

export default function Header() {
  const release = useRelease();
  const [os, setOs] = useState<DetectedOS>('other');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setOs(detectOS());
    });
  }, []);

  const { primaryOS, primaryUrl } = getPlatformLinks(os, release);
  const label = primaryOS === 'mac' ? 'Download for Mac' : primaryOS === 'windows' ? 'Download for Windows' : 'Download';
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
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
              className="hidden md:flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors"
              title={label}
            >
              <Download className="w-4 h-4" />
              <span className="whitespace-nowrap">{label}</span>
            </a>
            <a
              href="https://github.com/vavilov2212/wl-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block p-2 text-slate hover:text-ink transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="md:hidden p-2 text-slate hover:text-ink transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-border bg-white"
            >
              <div className="flex flex-col px-6 py-4 gap-4 font-sans text-sm font-medium">
                <Link href="#features" onClick={closeMenu} className="text-slate hover:text-ink transition-colors">Features</Link>
                <Link href="#roadmap" onClick={closeMenu} className="text-slate hover:text-ink transition-colors">Roadmap</Link>
                <a href={primaryUrl} onClick={closeMenu} className="flex items-center gap-2 text-accent font-bold">
                  <Download className="w-4 h-4" />
                  {label}
                </a>
                <a
                  href="https://github.com/vavilov2212/wl-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMenu}
                  className="flex items-center gap-2 text-slate hover:text-ink transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
      <ChatOverlay />
    </>
  );
}

import Link from 'next/link';
import { Logo } from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-subtle pt-24 pb-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
        <div className="md:col-span-5">
          <Link href="/">
            <Logo />
          </Link>
          <p className="text-slate text-lg leading-relaxed max-w-sm mb-8 mt-6">
            The minimal desktop time logger designed for professionals who live in deep work.
          </p>
        </div>
        
        <div className="md:col-span-2 md:col-start-7 text-sm font-medium">
          <h4 className="text-ink font-black text-xs uppercase tracking-widest mb-8">Product</h4>
          <ul className="space-y-4 text-slate">
            <li><Link href="#features" className="hover:text-accent transition-colors">Features</Link></li>
            <li><Link href="#roadmap" className="hover:text-accent transition-colors">Roadmap</Link></li>
          </ul>
        </div>
        
        <div className="md:col-span-2 text-sm font-medium">
          <h4 className="text-ink font-black text-xs uppercase tracking-widest mb-8">Resources</h4>
          <ul className="space-y-4 text-slate">
            <li><a href="https://github.com/vavilov2212/worklog_studio/releases" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Changelog</a></li>
          </ul>
        </div>

        <div className="md:col-span-2 text-sm font-medium">
          <h4 className="text-ink font-black text-xs uppercase tracking-widest mb-8">Connect</h4>
          <ul className="space-y-4 text-slate">
            <li><a href="https://github.com/vavilov2212/worklog_studio" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate font-bold uppercase tracking-widest">
        <p>© {new Date().getFullYear()} Roman Vavilov</p>
        <div className="flex gap-8">
          <a href="https://github.com/vavilov2212/worklog_studio/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">License</a>
        </div>
      </div>
    </footer>
  );
}

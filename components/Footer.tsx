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
          <div className="flex gap-4">
             <div className="bg-white p-3 rounded-lg border border-border shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-slate font-black mb-1">Coming Next</p>
                <p className="text-sm font-bold text-ink">iOS & Mobile App</p>
             </div>
          </div>
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
            <li><Link href="#" className="hover:text-accent transition-colors">Docs</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">API Reference</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">Changelog</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2 text-sm font-medium">
          <h4 className="text-ink font-black text-xs uppercase tracking-widest mb-8">Connect</h4>
          <ul className="space-y-4 text-slate">
            <li><Link href="#" className="hover:text-accent transition-colors">Twitter</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">GitHub</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">Discord</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate font-bold uppercase tracking-widest">
        <p>© 2024 Worklog Studio. Designed for native performance.</p>
        <div className="flex gap-8">
          <Link href="#" className="hover:text-accent transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-accent transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}

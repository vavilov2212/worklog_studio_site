import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg pt-20 pb-10 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter text-ink font-sans mb-4">
            <div className="w-6 h-6 bg-ink rounded-md"></div>
            <span>Worklog Studio</span>
          </Link>
          <p className="text-slate max-w-sm leading-relaxed">
            The minimal desktop time logger designed for deep focus and high-precision analytics.
          </p>
        </div>
        <div>
          <h4 className="text-ink font-bold mb-6 font-sans">Product</h4>
          <ul className="space-y-3 text-slate text-sm">
            <li><Link href="#features" className="hover:text-accent transition-colors">Features</Link></li>
            <li><Link href="#use-cases" className="hover:text-accent transition-colors">Use Cases</Link></li>
            <li><Link href="#roadmap" className="hover:text-accent transition-colors">Roadmap</Link></li>
            <li><Link href="#pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-ink font-bold mb-6 font-sans">Resources</h4>
          <ul className="space-y-3 text-slate text-sm">
            <li><Link href="#docs" className="hover:text-accent transition-colors">Documentation</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">Twitter</Link></li>
            <li><Link href="#" className="hover:text-accent transition-colors">GitHub</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate font-mono">
        <p>© 2024 Worklog Studio. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-ink transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-ink transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

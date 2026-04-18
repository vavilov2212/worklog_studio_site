'use client';
import { motion } from 'motion/react';

const items = [
  { phase: "Q1 2026", title: "macOS App", status: "Released", active: true },
  { phase: "Q2 2026", title: "Advanced Analytics", status: "In Progress", active: true },
  { phase: "Q4 2026", title: "Windows Support", status: "Planned", active: false },
  { phase: "2027", title: "Team Collaboration", status: "Planned", active: false }
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="max-w-7xl mx-auto px-8 py-32 border-t border-border">
      <div className="mb-16">
        <h2 className="text-3xl md:text-5xl font-bold font-sans text-ink mb-6">The Roadmap</h2>
        <p className="text-slate max-w-2xl text-lg">We&apos;re building the future of time tracking in public. Here is what&apos;s coming next.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`p-6 sm:p-8 rounded-2xl border flex flex-col h-full min-h-[200px] transition-all hover:translate-y-[-4px] ${item.active ? 'border-accent/30 bg-accent/5' : 'border-border bg-white shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-[10px] font-mono text-accent tracking-tighter uppercase font-black opacity-80">{item.phase}</div>
              <div className="text-[10px] font-mono text-slate/40 font-bold">0{i + 1}</div>
            </div>
            <h3 className={`text-lg sm:text-xl font-black mb-3 font-sans leading-tight ${item.active ? 'text-ink' : 'text-slate'}`}>{item.title}</h3>
            <div className="mt-auto pt-4">
              <div className={`text-[10px] uppercase tracking-widest font-black ${item.status === 'Released' ? 'text-green-600' : item.status === 'In Progress' ? 'text-accent' : 'text-slate/60'}`}>
                {item.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

'use client';
import { motion } from 'motion/react';

const items = [
  { phase: "Q1 2024", title: "macOS Native App", status: "Released", active: true },
  { phase: "Q2 2024", title: "Advanced Analytics", status: "In Progress", active: true },
  { phase: "Q3 2024", title: "Windows Support", status: "Planned", active: false },
  { phase: "Q4 2024", title: "Team Collaboration", status: "Planned", active: false }
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="max-w-7xl mx-auto px-8 py-32 border-t border-border">
      <div className="mb-16">
        <h2 className="text-3xl md:text-5xl font-bold font-sans text-ink mb-6">The Roadmap</h2>
        <p className="text-slate max-w-2xl text-lg">We&apos;re building the future of time tracking in public. Here is what&apos;s coming next.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={`p-8 rounded-2xl border ${item.active ? 'border-accent/30 bg-accent/5' : 'border-border bg-white'}`}
          >
            <div className="text-xs font-mono text-accent mb-4 tracking-widest uppercase">{item.phase}</div>
            <h3 className={`text-xl font-bold mb-3 font-sans ${item.active ? 'text-ink' : 'text-slate'}`}>{item.title}</h3>
            <div className={`text-xs uppercase tracking-wider font-bold ${item.status === 'Released' ? 'text-green-600' : item.status === 'In Progress' ? 'text-accent' : 'text-slate'}`}>
              {item.status}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

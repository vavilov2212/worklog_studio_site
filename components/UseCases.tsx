'use client';
import { motion } from 'motion/react';
import { Code2, PenTool, Briefcase } from 'lucide-react';

const cases = [
  { icon: Code2, title: "Engineers", desc: "Track deep coding sessions without breaking your flow state. Auto-detects your IDE." },
  { icon: PenTool, title: "Designers", desc: "Log hours across multiple creative tools automatically. Never lose a billable minute." },
  { icon: Briefcase, title: "Founders", desc: "Understand where your time actually goes each week with high-level executive summaries." }
];

export default function UseCases() {
  return (
    <section id="use-cases" className="max-w-7xl mx-auto px-8 py-32 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold font-sans text-ink mb-6">Built for Deep Workers</h2>
        <p className="text-slate max-w-2xl mx-auto text-lg">Whether you&apos;re writing code, designing interfaces, or building a company, Worklog Studio adapts to your workflow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cases.map((c, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white p-8 rounded-2xl hover:bg-border/50 transition-colors border border-border"
          >
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent border border-accent/20">
              <c.icon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-ink mb-3 font-sans">{c.title}</h3>
            <p className="text-slate leading-relaxed">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

'use client';
import { motion } from 'motion/react';
import { Apple } from 'lucide-react';

export default function Download() {
  return (
    <section className="max-w-5xl mx-auto px-8 py-32">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-white rounded-3xl p-12 md:p-20 text-center relative overflow-hidden border border-border"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold font-sans text-ink mb-6 tracking-tight">Ready to find your flow?</h2>
          <p className="text-xl text-slate mb-10 max-w-2xl mx-auto">Join thousands of deep workers who have already upgraded their productivity.</p>
          
          <button className="px-8 py-4 bg-ink text-white font-bold rounded-lg hover:bg-ink/90 transition-colors inline-flex items-center gap-3">
            <Apple className="w-6 h-6" />
            Download for macOS
          </button>
          <p className="mt-6 text-sm text-slate font-mono">Requires macOS 12.0 or later.</p>
        </div>
      </motion.div>
    </section>
  );
}

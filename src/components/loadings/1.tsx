'use client';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function CoolDark() {
  return (
    <motion.div 
      initial={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[9999] flex flex-col items-center justify-center touch-none overflow-hidden bg-slate-900"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="mb-4 p-4 bg-slate-800 rounded-full"
      >
        <TrendingUp className="text-green-400 w-12 h-12" />
      </motion.div>
      <div className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Analyzing</div>
    </motion.div>
  );
}
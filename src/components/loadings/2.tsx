'use client';
import { motion } from 'framer-motion';
import { Coins, Sparkles } from 'lucide-react';

export default function HappyCoins() {
  return (
    <motion.div 
      initial={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[9999] flex flex-col items-center justify-center touch-none overflow-hidden bg-white"
    >
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
        className="mb-4 relative"
      >
        <Coins className="text-yellow-500 w-16 h-16 drop-shadow-md" />
        <motion.div 
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="text-yellow-300 w-6 h-6" />
        </motion.div>
      </motion.div>
      <div className="text-gray-400 font-bold text-sm tracking-widest">Counting coins...</div>
    </motion.div>
  );
}
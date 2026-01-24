'use client';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export default function BlueWallet() {
  return (
    <motion.div 
      initial={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed top-0 left-0 w-[100vw] h-[100vh] z-[9999] flex flex-col items-center justify-center touch-none overflow-hidden bg-blue-500"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="mb-4"
      >
        <Wallet className="text-white w-16 h-16" />
      </motion.div>
      <div className="text-white font-bold text-lg animate-pulse tracking-widest">LOADING...</div>
    </motion.div>
  );
}
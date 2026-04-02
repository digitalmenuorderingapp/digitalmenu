'use client';

import { motion } from 'framer-motion';

export const BrandLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="relative">
        {/* Animated Rings */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-8 rounded-full border-4 border-indigo-100"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-16 rounded-full border-2 border-indigo-50"
        />

        {/* Text Animation */}
        <div className="relative flex items-center justify-center space-x-1">
          {["D", "i", "g", "i", "M", "e", "n", "u"].map((letter, index) => (
            <motion.span
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 2
              }}
              className="text-4xl md:text-6xl font-black text-indigo-600 tracking-tighter"
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-12 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-full bg-gradient-to-r from-transparent via-indigo-600 to-transparent"
        />
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
      >
        Initializing Operational Truth
      </motion.p>
    </div>
  );
};

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUtensils,
  FaShoppingCart,
  FaClipboardList,
  FaUser,
} from 'react-icons/fa';

interface BottomNavProps {
  cartCount?: number;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

const navItems = [
  {
    id: 'menu',
    label: 'Menu',
    icon: FaUtensils,
  },
  {
    id: 'cart',
    label: 'Cart',
    icon: FaShoppingCart,
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: FaClipboardList,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: FaUser,
  },
];

export default function BottomNav({ cartCount = 0, onTabChange, activeTab }: BottomNavProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
      <nav className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] px-3 py-2 flex items-center gap-10 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className="relative p-3.5 flex items-center justify-center transition-all group"
              aria-label={item.label}
            >
              {/* Active Background Glow */}
              {isActive && (
                <motion.div
                  layoutId="activeTabCustomer"
                  className="absolute inset-0 bg-indigo-600 rounded-full shadow-[0_10px_20px_rgba(79,70,229,0.3)]"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                />
              )}

              <div className="relative z-10">
                <Icon 
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'text-white scale-110' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                />

                {/* Cart Badge */}
                {item.id === 'cart' && cartCount > 0 && (
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-colors ${
                        isActive 
                          ? 'bg-white text-indigo-600 border-indigo-600' 
                          : 'bg-rose-500 text-white border-white animate-bounce-short'
                      }`}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>

              {/* Tooltip or Label could be added here if needed, but usually mobile navs are icon-only in this style */}
            </button>
          );
        })}
      </nav>
      
      <style jsx global>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short {
          animation: bounce-short 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

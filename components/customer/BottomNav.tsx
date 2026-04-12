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
  notificationCount?: number;
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

export default function BottomNav({ cartCount = 0, notificationCount = 0, onTabChange, activeTab }: BottomNavProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-[100] flex justify-center pointer-events-none">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.1 }}
        className="glass-card border-white/40 shadow-2xl rounded-[3rem] px-5 py-2 flex items-center gap-8 pointer-events-auto"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className="relative p-1 flex items-center justify-center transition-all group"
              aria-label={item.label}
            >
              {/* Active Glow Effect */}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-full"
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.8 }}
                />
              )}

              {/* Active Marker Dot */}
              {isActive && (
                <motion.div
                  layoutId="activeTabDot"
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.8)]"
                />
              )}

              <div className={`relative z-10 p-3.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-slate-900 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}>
                <Icon className={`w-5 h-5`} />

                {/* Cart Badge */}
                {item.id === 'cart' && cartCount > 0 && (
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className={`absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-xl flex items-center justify-center text-[10px] font-black border-2 shadow-lg transition-colors ${isActive
                        ? 'bg-indigo-500 text-white border-slate-900'
                        : 'bg-slate-900 text-white border-white'
                        }`}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  </AnimatePresence>
                )}

              </div>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}

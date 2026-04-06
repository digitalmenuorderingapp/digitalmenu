'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaCrown, 
  FaWhatsapp, 
  FaEnvelope, 
  FaCopy, 
  FaCheck,
  FaArrowRight
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
}

export default function SubscriptionModal({ isOpen }: SubscriptionModalProps) {
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    if (user?.shortId) {
      navigator.clipboard.writeText(user.shortId);
      setCopied(true);
      toast.success('Restaurant ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Top Decorative Banner */}
          <div className="h-32 bg-red-600 relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150" />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 5 }}
            >
              <FaExclamationTriangle className="text-white text-5xl" />
            </motion.div>
          </div>

          <div className="p-8 pt-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
                {user?.subscription?.status === 'inactive' ? 'Access Restricted' : 'Subscription Expired'}
              </h2>
              <p className="text-gray-500 font-medium leading-relaxed">
                {user?.subscription?.status === 'inactive' 
                  ? 'Your account has been deactivated. Please contact the superadmin for reactivation.'
                  : 'Your trial or plan has ended. To continue using DigitalMenu, please renew your subscription.'}
              </p>
            </div>

            {/* Price Card */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 mb-8 relative group overflow-hidden">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-200/50 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Premium Plan</p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black text-gray-900">₹500</span>
                    <span className="text-gray-500 font-bold ml-1">/year</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-amber-500">
                  <FaCrown className="text-2xl" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {['Unlimited Orders', 'Priority Support', 'Digital QR Menu', 'Sales Analytics'].map((feat, i) => (
                  <div key={feat} className="flex items-center text-amber-800 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center mr-2 text-[10px]">✓</span>
                    {feat}
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurant ID Section */}
            <div className="mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
                Your Restaurant ID
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-mono font-black text-xl text-indigo-600 tracking-widest shadow-inner">
                  {user?.shortId || 'N/A'}
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-4 bg-white border-2 border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md"
                >
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 px-1 font-medium">
                Please provide this ID when contacting us for activation.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open('https://wa.me/919563401099', '_blank')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-green-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 hover:bg-green-600 transition-all"
              >
                <FaWhatsapp className="text-2xl" />
                <span>{user?.subscription?.status === 'inactive' ? 'Contact via WhatsApp' : 'Pay via WhatsApp'}</span>
                <FaArrowRight className="text-sm opacity-50" />
              </motion.button>

              <button
                onClick={() => window.location.href = `mailto:digitalmenu.orderingapp@zohomail.in?subject=Subscription Renewal - ID: ${user?.shortId}`}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                <FaEnvelope className="text-gray-400" />
                <span>Contact via Email</span>
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">
              Activation typically takes less than 10 minutes
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

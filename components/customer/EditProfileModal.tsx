'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaPhone, FaTimes, FaPlus, FaMinus, FaArrowRight } from 'react-icons/fa';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  mobileNumber: string;
  numberOfPersons: number;
  onSave: (updates: { customerName: string; mobileNumber: string; numberOfPersons: number }) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  customerName,
  mobileNumber,
  numberOfPersons,
  onSave
}: EditProfileModalProps) {
  const [editName, setEditName] = useState(customerName);
  const [editMobile, setEditMobile] = useState(mobileNumber);
  const [editPersons, setEditPersons] = useState(numberOfPersons);

  // Update local state when props change
  useEffect(() => {
    setEditName(customerName);
    setEditMobile(mobileNumber);
    setEditPersons(numberOfPersons);
  }, [customerName, mobileNumber, numberOfPersons]);

  const handleSave = () => {
    onSave({
      customerName: editName,
      mobileNumber: editMobile,
      numberOfPersons: editPersons
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-[2rem] z-[101] shadow-2xl p-6 max-h-[90vh] overflow-y-auto will-change-transform border-t border-white/10"
          >
            {/* Header */}
            <div className="text-center mb-6 relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30">
                <span className="text-3xl">👋</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-1">Welcome!</h3>
              <p className="text-sm text-slate-400 font-medium">Start your dining journey</p>
              <button
                onClick={onClose}
                className="absolute top-0 right-0 w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700/50"
              >
                <FaTimes className="text-slate-300" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Full Name */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Your Full Name *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <FaUser className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-14 pr-5 py-4 focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all font-medium text-lg text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Group Size */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Group Size *</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setEditPersons(Math.max(1, editPersons - 1))}
                    className="w-14 h-14 bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl flex items-center justify-center text-white hover:bg-slate-700 hover:border-slate-600 transition-all active:scale-95"
                  >
                    <FaMinus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 rounded-2xl py-4">
                    <span className="text-3xl font-black text-white">{editPersons}</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Guests</p>
                  </div>
                  <button
                    onClick={() => setEditPersons(Math.min(8, editPersons + 1))}
                    className="w-14 h-14 bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl flex items-center justify-center text-white hover:bg-slate-700 hover:border-slate-600 transition-all active:scale-95"
                  >
                    <FaPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mobile Sync */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Sync (Optional)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <FaPhone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10 digit number"
                    maxLength={10}
                    className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-14 pr-5 py-4 focus:border-indigo-500 focus:bg-slate-800 outline-none transition-all font-medium text-lg text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-[0.25em] hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <span>Start Experience</span>
                  <FaArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-6"></div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

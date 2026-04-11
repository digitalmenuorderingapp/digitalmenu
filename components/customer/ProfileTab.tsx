'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEdit, FaSignOutAlt, FaTrash, FaUsers, FaClock, FaFingerprint, FaCheck, FaTimes, FaUtensils, FaPhone } from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface ProfileTabProps {
  session: any;
  onUpdateSession?: (updates: { customerName?: string; mobileNumber?: string; numberOfPersons?: number }) => void;
}

export default function ProfileTab({ session, onUpdateSession }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(session.customerName || '');
  const [mobileNumber, setMobileNumber] = useState(session.mobileNumber || '');
  const [numberOfPersons, setNumberOfPersons] = useState<number>(session.numberOfPersons || 1);

  const handleSaveProfile = async () => {
    if (onUpdateSession) {
      onUpdateSession({ customerName, mobileNumber, numberOfPersons });
    }
    
    // Update database for active orders
    try {
      if (session.deviceId) {
        await api.put('/order/device/profile', {
          deviceId: session.deviceId,
          customerName: customerName || session.customerName,
          customerPhone: mobileNumber || session.mobileNumber,
          numberOfPersons: numberOfPersons || session.numberOfPersons
        });
        toast.success('Profile updated and synced to orders');
      }
    } catch (error) {
      console.error('Failed to sync profile to orders:', error);
    }
    
    setIsEditing(false);
  };

  const handleClearProfile = () => {
    if (onUpdateSession) {
      onUpdateSession({ customerName: '', mobileNumber: '', numberOfPersons: 1 });
    }
    setCustomerName('');
    setMobileNumber('');
    setNumberOfPersons(1);
  };

  const tableCapacity = session.tableCapacity || 8;
  const personOptions = Array.from({ length: tableCapacity }, (_, i) => i + 1);

  // Auto-adjust if current persons exceeds table capacity
  if (numberOfPersons > tableCapacity) {
    setNumberOfPersons(tableCapacity);
  }

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <div className="relative min-h-screen pb-40">
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient" />

      {/* 🔮 1. Premium Hero Profile Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pb-20 pt-12 px-8 rounded-b-[4rem] shadow-2xl overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-[100px] animate-pulse-glow"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-32 -mb-32 blur-[100px]"></div>

         <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
            {/* Large Stylized Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-28 h-28 bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-white/20 mb-8 relative group"
            >
               <span className="text-5xl font-black text-white tracking-[0.1em]">{getInitials(customerName || session.customerName)}</span>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl border-4 border-[#0F172A] flex items-center justify-center shadow-lg">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-[0_0_8px_white]"></div>
               </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black text-white tracking-tighter leading-none mb-3 drop-shadow-sm uppercase"
            >
              {customerName || session.customerName || 'Explorer'}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-2 glass-button rounded-2xl flex items-center space-x-3 shadow-2xl"
            >
               {session.logo ? (
                 <img 
                   src={session.logo} 
                   alt="Logo" 
                   className="w-5 h-5 rounded-lg object-cover border border-white/20 shadow-md"
                 />
               ) : (
                 <FaUtensils className="text-indigo-400 w-4 h-4" />
               )}
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">
                 Member • {session.restaurantName || 'Restaurant'}
               </span>
            </motion.div>
         </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="space-y-8 pb-24">
          {/* 💎 2. Dynamic Status Cards */}
          <div className="grid grid-cols-2 gap-6">
             <div className="glass-card rounded-[2.5rem] p-6 flex flex-col items-center text-center border-white/60 hover:shadow-2xl transition-all">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                   <FaUsers className="text-indigo-600 w-5 h-5" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Seats Reserved</p>
                <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{session.numberOfPersons || 1}</p>
             </div>
             {session.tableNumber && (
               <div className="glass-card rounded-[2.5rem] p-6 flex flex-col items-center text-center border-white/60 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                     <FaUtensils className="text-purple-600 w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Table</p>
                  <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">#{session.tableNumber}</p>
               </div>
             )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card rounded-[3rem] border-white/80 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="p-8">
                   <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Profile</h2>
                        <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1.5" />
                      </div>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-indigo-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                         <FaEdit className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="space-y-8">
                      <div className="flex items-center gap-5 group">
                         <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaUser className="text-slate-400 group-hover:text-white w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Full Name</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">{customerName || session.customerName || 'Explorer'}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-5 group">
                         <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaPhone className="text-slate-400 group-hover:text-white w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Contact Sync</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">{mobileNumber || session.mobileNumber || 'Not Linked'}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-5 group">
                         <div className="w-14 h-14 rounded-2xl glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaFingerprint className="text-slate-400 group-hover:text-white w-5 h-5" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Device Identity</p>
                            <p className="font-mono text-xs text-slate-500 truncate bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{session.deviceId || 'Gen-Unique-ID'}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 rounded-[3rem] shadow-2xl p-10 text-white relative overflow-hidden border-indigo-500/20"
              >
                  {/* Decorative background for edit mode */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-[80px] -ml-24 -mb-24" />

                  <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight mb-10">Refine Profile</h2>
                    
                    <div className="space-y-10">
                       <div className="space-y-3">
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Display Name</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all font-black text-lg text-white placeholder:text-slate-700"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Mobile Sync</label>
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10 digit number"
                            maxLength={10}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all font-black text-lg text-white placeholder:text-slate-700"
                          />
                       </div>

                       <div className="space-y-5">
                          <div className="flex items-center justify-between px-1">
                             <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Adjust Seats (Max {tableCapacity})</label>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            {personOptions.map((num) => (
                              <button
                                key={num}
                                onClick={() => setNumberOfPersons(num)}
                                className={`h-16 rounded-2xl font-black text-xl transition-all border-2 ${
                                  numberOfPersons === num
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/40 scale-105'
                                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                       </div>

                       <div className="flex gap-4 pt-6">
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 bg-white text-slate-900 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.25em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-white/5 active:scale-[0.98]"
                          >
                            <FaCheck className="w-4 h-4" />
                            Update Profile
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="w-20 h-20 glass-button rounded-[2rem] flex items-center justify-center hover:bg-white/20 transition-all border-white/10 flex-shrink-0"
                          >
                            <FaTimes className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⚡ 3. Management Actions */}
          <div className="pt-6 space-y-6">
             <button
                onClick={handleClearProfile}
                className="w-full group focus:outline-none"
             >
                <div className="flex items-center justify-between p-6 glass-card rounded-[2.5rem] border-white/40 shadow-xl group-hover:bg-red-50/20 group-hover:border-red-100 transition-all group-active:scale-[0.98]">
                   <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-rose-100 transition-colors">
                         <FaTrash className="text-rose-500 w-5 h-5" />
                      </div>
                      <div className="text-left">
                         <p className="font-black text-slate-900 uppercase tracking-tight">Clear Device Data</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 opacity-60">Reset local identity cache</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-300 group-hover:text-rose-500 transition-colors">
                      <FaSignOutAlt className="rotate-180" />
                   </div>
                </div>
             </button>

             <button
                className="w-full group focus:outline-none"
             >
                <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2.5rem] shadow-2xl hover:bg-black transition-all group-active:scale-[0.98] border border-white/10">
                   <div className="flex items-center space-x-5">
                      <div className="w-14 h-14 glass-button rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                         <FaSignOutAlt className="text-white w-5 h-5" />
                      </div>
                      <div className="text-left">
                         <p className="font-black text-white uppercase tracking-tight">Exit Table Session</p>
                         <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1 opacity-60">Close current table access</p>
                      </div>
                   </div>
                </div>
             </button>
          </div>
        </div>
      </main>
    </div>
  );
}

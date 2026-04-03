'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEdit, FaSignOutAlt, FaTrash, FaUsers, FaClock, FaFingerprint, FaCheck, FaTimes, FaUtensils, FaPhone } from 'react-icons/fa';

interface ProfileTabProps {
  session: any;
  onUpdateSession?: (updates: { customerName?: string; mobileNumber?: string; numberOfPersons?: number }) => void;
}

export default function ProfileTab({ session, onUpdateSession }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(session.customerName || '');
  const [mobileNumber, setMobileNumber] = useState(session.mobileNumber || '');
  const [numberOfPersons, setNumberOfPersons] = useState<number>(session.numberOfPersons || 1);

  const handleSaveProfile = () => {
    if (onUpdateSession) {
      onUpdateSession({ customerName, mobileNumber, numberOfPersons });
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 🔮 1. Premium Hero Profile Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-900 pb-20 pt-10 px-6 rounded-b-[3.5rem] shadow-2xl overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>

         <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
            {/* Large Stylized Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/10 mb-6 relative group"
            >
               <span className="text-4xl font-black text-white tracking-widest">{getInitials(customerName || session.customerName)}</span>
               <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-2xl border-4 border-slate-900 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
               </div>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-black text-white tracking-tight leading-none mb-2"
            >
              {customerName || session.customerName || 'Explorer'}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              className="px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center space-x-2.5 shadow-lg"
            >
               {session.logo ? (
                 <img 
                   src={session.logo} 
                   alt="Logo" 
                   className="w-4 h-4 rounded-md object-cover border border-white/20 shadow-sm"
                 />
               ) : (
                 <FaUtensils className="text-indigo-400 w-3 h-3" />
               )}
               <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                 Dine-In • {session.restaurantName || 'Restaurant'}
               </span>
            </motion.div>
         </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="space-y-6">
          {/* 💎 2. Dynamic Status Cards */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mb-3">
                   <FaUsers className="text-indigo-600 w-4 h-4" />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Seats</p>
                <p className="text-xl font-black text-gray-900 leading-none">{session.numberOfPersons || 1}</p>
             </div>
             {session.tableNumber && (
               <div className="bg-white rounded-3xl p-5 shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
                     <FaUtensils className="text-purple-600 w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Table</p>
                  <p className="text-xl font-black text-gray-900 leading-none">#{session.tableNumber}</p>
               </div>
             )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Personal Profile</h2>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors"
                      >
                         <FaEdit />
                      </button>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <FaUser className="text-gray-400 group-hover:text-indigo-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Full Name</p>
                            <p className="font-black text-gray-900">{customerName || session.customerName || 'Not Shared'}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <FaPhone className="text-gray-400 group-hover:text-indigo-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Mobile Number</p>
                            <p className="font-black text-gray-900">{mobileNumber || session.mobileNumber || 'Not Shared'}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <FaFingerprint className="text-gray-400 group-hover:text-indigo-400" />
                         </div>
                         <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Device Identifier</p>
                            <p className="font-mono text-xs text-gray-500 truncate">{session.deviceId || 'Gen-Unique-ID'}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
                            <FaClock className="text-gray-400 group-hover:text-indigo-400" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Session Started</p>
                            <p className="font-black text-gray-900 text-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden"
              >
                 <div className="relative z-10">
                    <h2 className="text-2xl font-black tracking-tight mb-8">Refine Profile</h2>
                    
                    <div className="space-y-8">
                       <div>
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Display Name</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="How should we address you?"
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 focus:ring-0 transition-all font-bold text-white placeholder:text-gray-600"
                          />
                       </div>

                       <div>
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Mobile Number</label>
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10 digit mobile number"
                            maxLength={10}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 focus:border-indigo-500 focus:ring-0 transition-all font-bold text-white placeholder:text-gray-600"
                          />
                       </div>

                       <div>
                          <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span>Adjust Seats</span>
                            <span className="text-white">Max {tableCapacity} Available</span>
                          </label>
                          <div className="grid grid-cols-4 gap-3">
                            {personOptions.map((num) => (
                              <button
                                key={num}
                                onClick={() => setNumberOfPersons(num)}
                                className={`h-14 rounded-2xl font-black text-lg transition-all ${
                                  numberOfPersons === num
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 scale-105'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 bg-white text-gray-900 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                          >
                            <FaCheck />
                            Confirm Changes
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all"
                          >
                            <FaTimes />
                          </button>
                       </div>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⚡ 3. Management Actions */}
          <div className="pt-6 space-y-4">
             <button
                onClick={handleClearProfile}
                className="w-full relative group transition-all"
             >
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm group-hover:bg-gray-50 transition-colors">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                         <FaTrash className="text-red-500" />
                      </div>
                      <div className="text-left">
                         <p className="font-black text-gray-900">Reset Local Data</p>
                         <p className="text-[10px] text-gray-400 font-medium tracking-tight">Wipe cookies and identity caches</p>
                      </div>
                   </div>
                </div>
             </button>

             <button
                className="w-full relative group transition-all"
             >
                <div className="flex items-center justify-between p-6 bg-gray-900 rounded-3xl shadow-xl hover:bg-gray-800 transition-colors">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                         <FaSignOutAlt className="text-white" />
                      </div>
                      <div className="text-left text-white">
                         <p className="font-black">Exit Session</p>
                         <p className="text-[10px] text-gray-500 font-medium tracking-tight">Safely leave this table's session</p>
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

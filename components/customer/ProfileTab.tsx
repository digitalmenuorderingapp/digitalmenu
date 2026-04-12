'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEdit, FaSignOutAlt, FaTrash, FaUsers, FaClock, FaFingerprint, FaCheck, FaTimes, FaUtensils, FaPhone } from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';
import EditProfileModal from './EditProfileModal';

interface ProfileTabProps {
  session: any;
  onUpdateSession?: (updates: { customerName?: string; mobileNumber?: string; numberOfPersons?: number }) => void;
}

export default function ProfileTab({ session, onUpdateSession }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
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

      <main className="max-w-4xl mx-auto px-4 pt-4 relative z-20">
        <div className="space-y-4 pb-24">
          {/* 💎 2. Dynamic Status Cards */}
          <div className="grid grid-cols-2 gap-3">
             <div className="glass-card rounded-xl p-3 flex flex-col items-center text-center border-white/60 hover:shadow-2xl transition-all">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mb-2 shadow-inner">
                   <FaUsers className="text-indigo-600 w-4 h-4" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Seats Reserved</p>
                <p className="text-lg font-black text-slate-900 leading-none tracking-tight">{session.numberOfPersons || 1}</p>
             </div>
             {session.tableNumber && (
               <div className="glass-card rounded-xl p-3 flex flex-col items-center text-center border-white/60 hover:shadow-2xl transition-all">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-2 shadow-inner">
                     <FaUtensils className="text-purple-600 w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Table</p>
                  <p className="text-lg font-black text-slate-900 leading-none tracking-tight">#{session.tableNumber}</p>
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
                className="glass-card rounded-xl border-white/80 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12" />
                
                <div className="p-4">
                   <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Personal Profile</h2>
                        <div className="h-0.5 w-8 bg-indigo-600 rounded-full mt-1" />
                      </div>
                      <button 
                        onClick={() => setIsEditProfileOpen(true)}
                        className="w-8 h-8 glass rounded-lg flex items-center justify-center text-indigo-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                      >
                         <FaEdit className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="space-y-3">
                      <div className="flex items-center gap-3 group">
                         <div className="w-10 h-10 rounded-lg glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaUser className="text-slate-400 group-hover:text-white w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Full Name</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{customerName || session.customerName || 'Explorer'}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-3 group">
                         <div className="w-10 h-10 rounded-lg glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaPhone className="text-slate-400 group-hover:text-white w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Contact Sync</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{mobileNumber || session.mobileNumber || 'Not Linked'}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3 group">
                         <div className="w-10 h-10 rounded-lg glass-button flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            <FaFingerprint className="text-slate-400 group-hover:text-white w-4 h-4" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Device Identity</p>
                            <p className="font-mono text-[10px] text-slate-500 truncate bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{session.deviceId || 'Gen-Unique-ID'}</p>
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
                className="bg-slate-950 rounded-xl shadow-2xl p-4 text-white relative overflow-hidden border-indigo-500/20"
              >
                  {/* Decorative background for edit mode */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[60px] -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 rounded-full blur-[48px] -ml-12 -mb-12" />

                  <div className="relative z-10">
                    <h2 className="text-xl font-black tracking-tight mb-4">Refine Profile</h2>
                    
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Display Name</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all font-black text-sm text-white placeholder:text-slate-700"
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest px-1">Mobile Sync</label>
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10 digit number"
                            maxLength={10}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 focus:bg-white/10 outline-none transition-all font-black text-sm text-white placeholder:text-slate-700"
                          />
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                             <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">Adjust Seats (Max {tableCapacity})</label>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {personOptions.map((num) => (
                              <button
                                key={num}
                                onClick={() => setNumberOfPersons(num)}
                                className={`h-12 rounded-xl font-black text-lg transition-all border-2 ${
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

                       <div className="flex gap-3 pt-3">
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 bg-white text-slate-900 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.25em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/5 active:scale-[0.98]"
                          >
                            <FaCheck className="w-3 h-3" />
                            Update Profile
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="w-12 h-12 glass-button rounded-xl flex items-center justify-center hover:bg-white/20 transition-all border-white/10 flex-shrink-0"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ⚡ 3. Management Actions */}
          <div className="pt-3 space-y-3">
             <button
                onClick={handleClearProfile}
                className="w-full group focus:outline-none"
             >
                <div className="flex items-center justify-between p-3 glass-card rounded-xl border-white/40 shadow-xl group-hover:bg-red-50/20 group-hover:border-red-100 transition-all group-active:scale-[0.98]">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center shadow-inner group-hover:bg-rose-100 transition-colors">
                         <FaTrash className="text-rose-500 w-4 h-4" />
                      </div>
                      <div className="text-left">
                         <p className="font-black text-slate-900 uppercase tracking-tight text-sm">Clear Device Data</p>
                         <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5 opacity-60">Reset local identity cache</p>
                      </div>
                   </div>
                   <div className="w-8 h-8 glass rounded-lg flex items-center justify-center text-slate-300 group-hover:text-rose-500 transition-colors">
                      <FaSignOutAlt className="rotate-180 w-3 h-3" />
                   </div>
                </div>
             </button>

             <button
                className="w-full group focus:outline-none"
             >
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl shadow-2xl hover:bg-black transition-all group-active:scale-[0.98] border border-white/10">
                   <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 glass-button rounded-lg flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                         <FaSignOutAlt className="text-white w-4 h-4" />
                      </div>
                      <div className="text-left">
                         <p className="font-black text-white uppercase tracking-tight text-sm">Exit Table Session</p>
                         <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5 opacity-60">Close current table access</p>
                      </div>
                   </div>
                </div>
             </button>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        customerName={customerName}
        mobileNumber={mobileNumber}
        numberOfPersons={numberOfPersons}
        onSave={async (updates) => {
          if (onUpdateSession) {
            onUpdateSession(updates);
          }
          
          // Update local state
          setCustomerName(updates.customerName);
          setMobileNumber(updates.mobileNumber);
          setNumberOfPersons(updates.numberOfPersons);

          // Update database for active orders
          try {
            if (session.deviceId) {
              await api.put('/order/device/profile', {
                deviceId: session.deviceId,
                customerName: updates.customerName,
                customerPhone: updates.mobileNumber,
                numberOfPersons: updates.numberOfPersons
              });
              toast.success('Profile updated and synced to orders');
            }
          } catch (error) {
            console.error('Failed to sync profile to orders:', error);
          }
        }}
      />
    </div>
  );
}

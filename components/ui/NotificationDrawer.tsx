'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaClipboardList, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id?: string) => void;
  onClearAll: () => void;
  unreadCount: number;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll,
  unreadCount
}: NotificationDrawerProps) {
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': return <FaBell className="text-blue-500" />;
      case 'ORDER_ACCEPTED': return <FaClipboardList className="text-green-500" />;
      case 'ORDER_REJECTED': return <FaTimes className="text-red-500" />;
      case 'ORDER_CANCELLED': return <FaTrash className="text-gray-500" />;
      case 'PAYMENT_VERIFIED': return <FaCheckCircle className="text-emerald-500" />;
      case 'PAYMENT_RETRY': return <FaExclamationCircle className="text-orange-500" />;
      default: return <FaInfoCircle className="text-indigo-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': return 'bg-blue-50';
      case 'ORDER_ACCEPTED': return 'bg-green-50';
      case 'ORDER_REJECTED': return 'bg-red-50';
      case 'PAYMENT_VERIFIED': return 'bg-emerald-50';
      default: return 'bg-indigo-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white/80 backdrop-blur-xl border-l border-white/20 shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time Activity</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onMarkAsRead()}
                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Mark all as read
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <div className="w-16 h-16 bg-gray-100 rounded-3xl mb-4 flex items-center justify-center">
                    <FaBell className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      notif.isRead 
                        ? 'bg-white/40 border-gray-100 opacity-70 grayscale-[0.5]' 
                        : `${getBgColor(notif.type)} border-white/50 shadow-sm relative overflow-hidden`
                    }`}
                    onClick={() => {
                      if (!notif.isRead) onMarkAsRead(notif._id);
                      // Additional logic: navigate to order if orderId exists
                      onClose();
                    }}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full m-3" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        notif.isRead ? 'bg-gray-100' : 'bg-white'
                      }`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black text-gray-900 mb-0.5 truncate ${!notif.isRead ? 'pr-4' : ''}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                          {notif.metadata?.orderNumber && (
                            <span className="text-[10px] font-black bg-white/50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100">
                              #{notif.metadata.orderNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
              <button 
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="w-full py-3.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FaTrash className="w-3 h-3" />
                Clear All Notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

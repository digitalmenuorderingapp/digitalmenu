'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaMoneyBillWave, 
  FaCreditCard,
  FaBan
} from 'react-icons/fa';
import Button from './Button';

export type ActionType = 'VERIFY_PAYMENT' | 'REJECT_ORDER' | 'MARK_UNPAID' | 'COLLECT_PAYMENT' | 'REQUEST_RETRY';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload?: any) => Promise<void>;
  type: ActionType;
  orderNumber?: string;
  amount?: number;
  submittedUtr?: string;
}

const REJECT_REASONS = [
  'Item Out of Stock',
  'Kitchen Too Busy',
  'Restaurant Closing Soon',
  'Invalid Table Number',
  'Other (Specify below)'
];

const UNPAID_REASONS = [
  'Customer Left Without Paying',
  'Payment Failed Digitally',
  'Incomplete Cash Payment',
  'Disputed Amount',
  'Other (Specify below)'
];

const ActionModal = ({ isOpen, onClose, onConfirm, type, orderNumber, amount, submittedUtr }: ActionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [method, setMethod] = useState<'CASH' | 'ONLINE'>('CASH');

  // Set initial UTR if available from customer submission
  React.useEffect(() => {
    if (isOpen && submittedUtr && type === 'VERIFY_PAYMENT') {
      setUtr(submittedUtr);
    } else if (isOpen && !submittedUtr) {
      setUtr('');
    }
  }, [isOpen, submittedUtr, type]);

  const getTitle = () => {
    switch (type) {
      case 'VERIFY_PAYMENT': return 'Verify Online Payment';
      case 'REJECT_ORDER': return 'Reject Order';
      case 'MARK_UNPAID': return 'Mark as Unpaid';
      case 'COLLECT_PAYMENT': return 'Collect Payment';
      case 'REQUEST_RETRY': return 'Request Payment Retry';
      default: return 'Confirm Action';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'VERIFY_PAYMENT': return <FaCheck className="text-green-600" />;
      case 'REJECT_ORDER': return <FaBan className="text-red-600" />;
      case 'MARK_UNPAID': return <FaExclamationTriangle className="text-amber-600" />;
      case 'COLLECT_PAYMENT': return <FaMoneyBillWave className="text-indigo-600" />;
      case 'REQUEST_RETRY': return <FaRedo className="text-amber-600" />;
      default: return <FaInfoCircle className="text-blue-600" />;
    }
  };

  const handleConfirm = async (overrideAction?: string) => {
    setLoading(true);
    try {
      const payload: any = {
        actionOverride: type === 'REQUEST_RETRY' ? 'REQUEST_RETRY' : overrideAction // Used to distinguish between APPROVE and RETRY in VERIFY_PAYMENT
      };
      
      if (type === 'VERIFY_PAYMENT') {
        payload.utr = utr;
      } else if (type === 'COLLECT_PAYMENT') {
        payload.method = method;
        if (method === 'ONLINE') payload.utr = utr;
      } else if (type === 'REJECT_ORDER' || type === 'MARK_UNPAID') {
        payload.reason = reason === 'Other (Specify below)' ? customReason : reason;
      }

      await onConfirm(payload);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 flex items-center justify-between border-b ${
              type === 'REJECT_ORDER' || type === 'MARK_UNPAID' ? 'bg-red-50 border-red-100' :
              type === 'VERIFY_PAYMENT' ? 'bg-green-50 border-green-100' :
              'bg-indigo-50 border-indigo-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">
                  {getIcon()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{getTitle()}</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Order #{orderNumber}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Context Info */}
              {amount && (
                <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center border border-gray-100">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                  <span className="text-xl font-black text-indigo-600">₹{amount}</span>
                </div>
              )}

              {/* Action Specific Fields */}
              {type === 'VERIFY_PAYMENT' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Optional UTR (Last 6 Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                  />
                  <p className="text-[10px] text-gray-400 font-medium italic ml-1">For your reference during reconciliation.</p>
                </div>
              )}

              {type === 'COLLECT_PAYMENT' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setMethod('CASH')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          method === 'CASH' 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <FaMoneyBillWave className="text-2xl" />
                        <span className="font-black text-sm uppercase">Cash</span>
                      </button>
                      <button
                        onClick={() => setMethod('ONLINE')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          method === 'ONLINE' 
                            ? 'bg-blue-50 border-blue-600 text-blue-600' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <FaCreditCard className="text-2xl" />
                        <span className="font-black text-sm uppercase">Online</span>
                      </button>
                    </div>
                  </div>

                  {method === 'ONLINE' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Optional UTR (Last 6 Digits)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {(type === 'REJECT_ORDER' || type === 'MARK_UNPAID') && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Reason for {type === 'REJECT_ORDER' ? 'Rejection' : 'Unpaid status'}</label>
                    <div className="space-y-2">
                      {(type === 'REJECT_ORDER' ? REJECT_REASONS : UNPAID_REASONS).map((r) => (
                        <button
                          key={r}
                          onClick={() => setReason(r)}
                          className={`w-full text-left p-3 rounded-xl border font-bold text-sm transition-all ${
                            reason === r 
                              ? 'bg-red-50 border-red-200 text-red-600' 
                              : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-white hover:border-gray-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {reason === 'Other (Specify below)' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        placeholder="Type your reason here..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[100px]"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {type === 'REQUEST_RETRY' && (
                <div className="space-y-4 bg-amber-50 rounded-2xl p-5 border border-amber-100">
                  <div className="flex items-center gap-3 text-amber-600 mb-2">
                    <FaExclamationTriangle className="text-xl" />
                    <span className="font-black uppercase tracking-widest text-xs">Action Required</span>
                  </div>
                  <p className="text-sm font-bold text-amber-900 leading-relaxed">
                    This will ask the customer to check their payment status and re-enter their UTR. The "Applied" status will be reset, and the customer will be notified to try again.
                  </p>
                  {submittedUtr && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Customer Submitted UTR</p>
                      <p className="font-mono text-sm font-black text-amber-800 tracking-widest">{submittedUtr}</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className={`p-6 bg-gray-50 flex gap-3 border-t border-gray-100 ${type === 'VERIFY_PAYMENT' ? 'flex-col sm:flex-row' : ''}`}>
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              
              {type === 'VERIFY_PAYMENT' && (
                <Button
                  variant="amber"
                  fullWidth
                  onClick={() => handleConfirm('REQUEST_RETRY')}
                  isLoading={loading}
                  disabled={loading}
                >
                  Request Retry
                </Button>
              )}

              <Button
                variant={type === 'REJECT_ORDER' || type === 'MARK_UNPAID' || type === 'REQUEST_RETRY' ? 'danger' : 'primary'}
                fullWidth
                onClick={() => handleConfirm(type === 'VERIFY_PAYMENT' ? 'VERIFY_PAYMENT' : undefined)}
                isLoading={loading}
                disabled={
                  loading ||
                  ((type === 'REJECT_ORDER' || type === 'MARK_UNPAID') && !reason) ||
                  ((type === 'REJECT_ORDER' || type === 'MARK_UNPAID') && reason === 'Other (Specify below)' && !customReason)
                }
              >
                {type === 'VERIFY_PAYMENT' ? 'Approve Payment' : 
                 type === 'REQUEST_RETRY' ? 'Ask Customer to Retry' : 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ActionModal;

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

export type ActionType = 'VERIFY_PAYMENT' | 'REJECT_ORDER' | 'MARK_UNPAID' | 'COLLECT_PAYMENT' | 'COMPLETE_REFUND';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload?: any) => Promise<void>;
  type: ActionType;
  orderNumber?: string;
  amount?: number;
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

const ActionModal = ({ isOpen, onClose, onConfirm, type, orderNumber, amount }: ActionModalProps) => {
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [method, setMethod] = useState<'CASH' | 'ONLINE'>('CASH');

  const getTitle = () => {
    switch (type) {
      case 'VERIFY_PAYMENT': return 'Verify Online Payment';
      case 'REJECT_ORDER': return 'Reject Order';
      case 'MARK_UNPAID': return 'Mark as Unpaid';
      case 'COLLECT_PAYMENT': return 'Collect Payment';
      case 'COMPLETE_REFUND': return 'Complete Refund';
      default: return 'Confirm Action';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'VERIFY_PAYMENT': return <FaCheck className="text-green-600" />;
      case 'REJECT_ORDER': return <FaBan className="text-red-600" />;
      case 'MARK_UNPAID': return <FaExclamationTriangle className="text-amber-600" />;
      case 'COLLECT_PAYMENT': return <FaMoneyBillWave className="text-indigo-600" />;
      case 'COMPLETE_REFUND': return <FaUndo className="text-purple-600" />;
      default: return <FaInfoCircle className="text-blue-600" />;
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      
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

              {type === 'COMPLETE_REFUND' && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <p className="text-purple-900 text-sm font-bold">
                    This will mark the refund as <strong>Completed</strong> in your records. Please ensure you have already initiated the refund through your payment gateway or handed over the cash.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 flex gap-3 border-t border-gray-100">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant={type === 'REJECT_ORDER' || type === 'MARK_UNPAID' ? 'danger' : 'primary'}
                fullWidth
                onClick={handleConfirm}
                isLoading={loading}
                disabled={
                  ((type === 'REJECT_ORDER' || type === 'MARK_UNPAID') && !reason) ||
                  ((type === 'REJECT_ORDER' || type === 'MARK_UNPAID') && reason === 'Other (Specify below)' && !customReason)
                }
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Add standard icon
const FaUndo = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M212.333 224.333H12c-6.627 0-12-5.373-12-12V12C0 5.373 5.373 0 12 0h48c6.627 0 12 5.373 12 12v78.112C117.773 39.279 184.26 7.47 258.175 8.33c133.456 1.551 245.316 110.177 253.308 243.344C520.155 396.657 400.916 512 256 512c-69.176 0-131.789-28.093-177.309-73.475-4.809-4.793-4.912-12.607-.226-17.527l34.02-35.657c4.46-4.675 11.751-4.975 16.592-.664C161.42 414.28 206.012 432 256 432c101.442 0 184-82.558 184-184 0-101.442-82.558-184-184-184-48.87 0-93.029 19.349-125.667 50.667h82c6.627 0 12 5.373 12 12v48c0 6.627-5.373 12-12 12z"></path></svg>
);

export default ActionModal;

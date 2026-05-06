'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaClock,
  FaUsers,
  FaHashtag,
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaComment,
  FaStar,
  FaExclamationCircle,
  FaSpinner,
  FaUtensils,
  FaCheck,
  FaTimes,
  FaArrowRight,
  FaPhone,
  FaRedo,
  FaExclamationTriangle,
  FaPrint
} from 'react-icons/fa';
import Button from './Button';

import ActionModal, { ActionType } from './ActionModal';

// Helper function to check if order is paid
export const isOrderPaid = (order: Order) => {
  return order.paymentStatus?.toUpperCase() === 'VERIFIED';
};

// Helper function to check if max retry limit reached
export const isMaxRetryReached = (order: Order) => {
  const retryCount = order.paymentVerificationRequestbycustomer?.retrycount || order.retryCount || 0;
  console.log('retry count:', retryCount);
  return retryCount >= 3;
};

// Helper function to get payment status display
export const getPaymentStatusDisplay = (order: Order) => {
  const paid = isOrderPaid(order);

  if (order.paymentStatus?.toUpperCase() === 'UNPAID') {
    return { text: 'Unpaid (Rejected)', color: 'text-red-600', bgColor: 'bg-red-50' };
  }


  if (paid) {
    return {
      text: order.collectedVia?.toUpperCase() === 'CASH' ? 'Cash Collected' : 'Online Verified',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  }

  if (order.paymentStatus?.toUpperCase() === 'RETRY') {
    return {
      text: `Retry (${order.retryCount || 0}/3)`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    };
  }

  if (order.paymentStatus?.toUpperCase() === 'PENDING' &&
    (order.paymentMethod?.toUpperCase() === 'ONLINE' ||
      order.collectedVia?.toUpperCase() === 'ONLINE' ||
      order.paymentVerificationRequestbycustomer?.applied)) {
    return {
      text: 'Pending',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    };
  }

  if (order.paymentStatus?.toUpperCase() === 'UNPAID' || order.paymentDueStatus?.toUpperCase() === 'DUE') {
    return {
      text: 'Unpaid / Due',
      color: 'text-red-700 font-black',
      bgColor: 'bg-red-100'
    };
  }

  return {
    text: (order.paymentMethod?.toUpperCase() === 'ONLINE' || order.collectedVia?.toUpperCase() === 'ONLINE') ? 'Online Pending' : 'Pay at Counter',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  };
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber?: string;
  tableNumber?: number;
  customerName: string;
  customerPhone?: string;
  numberOfPersons?: number;
  specialInstructions?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentMethod?: 'ONLINE' | 'CASH';
  collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
  paymentDueStatus?: 'CLEAR' | 'DUE';
  utr?: string;
  retryCount?: number;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  feedback?: {
    rating?: number;
    comment?: string;
  };
  transactions?: any[];
  submittedUtr?: string;
  paymentVerificationRequestbycustomer?: {
    applied?: boolean;
    appliedUTR?: string;
    retrycount?: number;
    adminAskedretry?: boolean;
  };
}

interface OrderCardProps {
  order: Order;
  variant?: 'today' | 'compact';
  onAction?: (orderId: string, action: string, payload?: any) => void;
  onPrint?: (order: Order) => void;
}

const OrderCard = ({
  order,
  variant = 'today',
  onAction,
  onPrint
}: OrderCardProps) => {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [modalType, setModalType] = useState<ActionType | null>(null);

  const paid = isOrderPaid(order);
  const paymentStatusDisplay = getPaymentStatusDisplay(order);

  const statusColors = {
    PLACED: 'from-amber-500 to-orange-500',
    ACCEPTED: 'from-blue-500 to-indigo-500',
    COMPLETED: 'from-emerald-500 to-teal-500',
    REJECTED: 'from-rose-500 to-red-500',
    CANCELLED: 'from-gray-500 to-slate-500'
  };

  const statusBg = {
    PLACED: 'bg-amber-50/50 border-amber-100',
    ACCEPTED: 'bg-blue-50/50 border-blue-100',
    COMPLETED: 'bg-emerald-50/50 border-emerald-100',
    REJECTED: 'bg-rose-50/30 border-rose-100',
    CANCELLED: 'bg-gray-50/30 border-gray-100'
  };

  const handleAction = async (action: string, payload?: any) => {
    setLoadingActions(prev => ({ ...prev, [action]: true }));
    try {
      if (onAction) {
        await onAction(order._id, action, payload);
      }
    } finally {
      setLoadingActions(prev => ({ ...prev, [action]: false }));
    }
  };

  const isLoading = (action: string) => loadingActions[action] || false;
  const isAnyLoading = Object.values(loadingActions).some(val => val);

  const currentStatus = order.status?.toUpperCase() || 'PLACED';
  const colorGradient = (statusColors as any)[currentStatus] || statusColors.PLACED;
  const bgClass = (statusBg as any)[currentStatus] || statusBg.PLACED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative group/card flex flex-col min-h-[300px] rounded-3xl border border-white/40 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden backdrop-blur-xl bg-white/70 ${paid ? 'ring-1 ring-emerald-500/20' : ''}`}
    >
      {/* Top Status Gradient Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${colorGradient}`} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">

        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Table Diamond Badge */}
            <div className="relative group/table">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br ${colorGradient} shadow-lg shadow-indigo-200/50 transition-all duration-300 group-hover/card:scale-105 border border-white/20`}>
                <span className="text-[7px] sm:text-[8px] font-black text-white/70 uppercase leading-none mb-0.5">Tbl</span>
                <span className="text-lg sm:text-xl font-black text-white leading-none">{order.tableNumber}</span>
              </div>
              {order.status === 'PLACED' && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-md z-10">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight truncate leading-none">
                  {order.customerName}
                </h3>
                {order.numberOfPersons && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
                    <FaUsers className="w-2 h-2" />
                    {order.numberOfPersons}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50 font-mono">
                  <FaClock className="w-2.5 h-2.5 text-indigo-400" />
                  {new Date(order.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {order.customerPhone && (
                  <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
                    <FaPhone className="w-2.5 h-2.5 text-emerald-400" />
                    {order.customerPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${order.status === 'PLACED' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                order.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
              {order.status}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-300 uppercase font-mono">ID: #{order.orderNumber || order._id.slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Receipt Divider */}
        <div className="relative h-px w-full border-t-2 border-dashed border-slate-100 my-2">
          <div className="absolute -left-6 -top-1.5 w-3 h-3 rounded-full bg-slate-100/50 shadow-inner" />
          <div className="absolute -right-6 -top-1.5 w-3 h-3 rounded-full bg-slate-100/50 shadow-inner" />
        </div>

        {/* Items Section */}
        <div className="flex-1 min-h-0 py-3">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order Summary</h4>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">{order.items.length} Items</span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start group/item">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-slate-600">{item.quantity}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-700 leading-tight group-hover/item:text-indigo-600 transition-colors">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">₹{item.price} each</p>
                  </div>
                </div>
                <span className="text-[12px] font-black text-slate-600 font-mono">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100/50">
            <div className="flex items-start gap-2">
              <FaComment className="w-3 h-3 text-amber-500 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-900 leading-snug">{order.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Total & Payment Section */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${paid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
              }`}>
              {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-4 h-4" /> : <FaMoneyBillWave className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Payment</p>
              <p className={`text-[11px] font-black uppercase ${paymentStatusDisplay.color}`}>{paymentStatusDisplay.text}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Total Amount</p>
            <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">₹{order.totalAmount}</p>
          </div>
        </div>

        {/* Actions Section */}
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="flex-1 flex gap-2">
            {(order.status?.toUpperCase() === 'ACCEPTED' || order.status?.toUpperCase() === 'COMPLETED') && (
              <button
                onClick={() => onPrint?.(order)}
                className="h-10 px-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all text-slate-400 flex items-center justify-center gap-2"
              >
                <FaPrint className="w-3.5 h-3.5" />
              </button>
            )}

            {(() => {
              const orderKeys = Object.keys(order);
              const targetKey = orderKeys.find(k => k.toLowerCase() === 'paymentverificationrequestbycustomer');
              const paymentObj = targetKey ? (order as any)[targetKey] : null;
              const showVerify = (paymentObj?.applied || order.utr || order.submittedUtr) && (order.status === 'ACCEPTED' || order.status === 'COMPLETED') && !paid;

              if (paid || order.status === 'REJECTED' || order.status === 'CANCELLED') return null;

              return (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => setModalType(showVerify ? 'VERIFY_PAYMENT' : 'COLLECT_PAYMENT')}
                  isLoading={isLoading(showVerify ? 'VERIFY_PAYMENT' : 'COLLECT_PAYMENT')}
                  disabled={isAnyLoading}
                  className="flex-1 !h-10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                  leftIcon={showVerify ? <FaCheckCircle /> : <FaMoneyBillWave />}
                >
                  {showVerify ? 'Verify' : 'Collect'}
                </Button>
              );
            })()}
          </div>

          <div className="flex gap-2">
            {order.status === 'PLACED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAction('ACCEPT_ORDER')}
                  isLoading={isLoading('ACCEPT_ORDER')}
                  disabled={isAnyLoading}
                  className="!h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] bg-slate-800 hover:bg-slate-900 text-white"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setModalType('REJECT_ORDER')}
                  isLoading={isLoading('REJECT_ORDER')}
                  disabled={isAnyLoading}
                  className="!h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px]"
                >
                  Reject
                </Button>
              </>
            )}

            {order.status === 'ACCEPTED' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAction('COMPLETE_ORDER')}
                isLoading={isLoading('COMPLETE_ORDER')}
                disabled={isAnyLoading}
                className="!h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]"
                leftIcon={<FaUtensils />}
              >
                Serve
              </Button>
            )}
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onConfirm={(payload) => handleAction(modalType!, payload)}
        type={modalType!}
        orderNumber={order.orderNumber || order._id.slice(-6)}
        amount={order.totalAmount}
        submittedUtr={order.utr || order.submittedUtr || order.paymentVerificationRequestbycustomer?.appliedUTR}
      />
    </motion.div>
  );
};

export default OrderCard;

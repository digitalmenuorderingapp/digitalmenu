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
  FaExclamationTriangle
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
}

const OrderCard = ({
  order,
  variant = 'today',
  onAction
}: OrderCardProps) => {
  // TEMP: Debug log for retry count
  console.log('Order:', order._id, 'retryCount:', order.paymentVerificationRequestbycustomer?.retrycount, 'paymentStatus:', order.paymentStatus);
  
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [modalType, setModalType] = useState<ActionType | null>(null);

  const paid = isOrderPaid(order);
  const paymentStatusDisplay = getPaymentStatusDisplay(order);

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

  if (variant === 'compact') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
               order.status?.toUpperCase() === 'PLACED' ? 'bg-amber-50 text-amber-600' :
               order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-blue-50 text-blue-600' :
               order.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-50 text-green-600' :
               'bg-gray-50 text-gray-500'
            }`}>
              {order.tableNumber}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm truncate max-w-[100px]">{order.customerName}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-indigo-600 text-sm">₹{order.totalAmount}</p>
            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
              order.status?.toUpperCase() === 'PLACED' ? 'bg-amber-100 text-amber-600' :
              order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' :
              order.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-600' :
              order.status?.toUpperCase() === 'REJECTED' || order.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {order.status?.toUpperCase() === 'PLACED' ? 'NEW' :
               order.status?.toUpperCase() === 'ACCEPTED' ? 'PREPARING' :
               order.status?.toUpperCase() === 'COMPLETED' ? 'SERVED' :
               order.status?.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center space-x-1">
            {order.paymentMethod?.toUpperCase() === 'ONLINE' ? <FaCreditCard className="w-3 h-3 text-blue-500" /> : <FaMoneyBillWave className="w-3 h-3 text-amber-500" />}
            <span className={`text-[10px] font-bold ${paymentStatusDisplay.color}`}>
              {paymentStatusDisplay.text}
              {order.paymentStatus?.toUpperCase() === 'RETRY' && ` (${order.retryCount || 0})`}
            </span>
          </div>
          <FaArrowRight className="w-3 h-3 text-gray-300 transition-colors" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl border transition-all duration-300 overflow-hidden group/card shadow-sm hover:shadow-xl ${
        order.status?.toUpperCase() === 'PLACED' ? 'bg-amber-50/50 border-amber-100/50 hover:border-amber-200' :
        order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-blue-50/50 border-blue-100/50 hover:border-blue-200' :
        order.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-50/50 border-green-100/50 hover:border-green-200' :
        order.status?.toUpperCase() === 'REJECTED' ? 'bg-red-50/30 border-red-100/50' :
        'bg-white border-gray-100'
      } ${order.paymentDueStatus?.toUpperCase() === 'DUE' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
    >
      {/* Header */}
      <div className={`p-4 sm:p-5 border-b border-gray-100/50 flex flex-wrap items-center justify-between gap-3 transition-colors duration-300 ${
        order.status?.toUpperCase() === 'PLACED' ? 'bg-gradient-to-br from-amber-50/80 to-white/40' :
        order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-gradient-to-br from-blue-50/80 to-white/40' :
        order.status?.toUpperCase() === 'COMPLETED' ? 'bg-gradient-to-br from-green-50/80 to-white/40' :
        'bg-gradient-to-br from-gray-50/80 to-white/40'
      }`}>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-transform duration-300 group-hover/card:scale-105 ${
            order.status?.toUpperCase() === 'PLACED' ? 'bg-white text-amber-600 border border-amber-100' :
            order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-white text-blue-600 border border-blue-100' :
            order.status?.toUpperCase() === 'COMPLETED' ? 'bg-white text-green-600 border border-green-100' :
            'bg-white text-gray-600 border border-gray-100'
          }`}>
            {order.tableNumber}
            {order.status?.toUpperCase() === 'PLACED' && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight uppercase tracking-tight transition-colors">
                {order.customerName}
              </h3>
              {order.numberOfPersons && (
                <span className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">
                  <FaUsers className="w-2.5 h-2.5" />
                  <span>{order.numberOfPersons}</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center mt-1 gap-1.5 sm:gap-2">
              {order.customerPhone && (
                <span className="text-[11px] sm:text-sm font-bold text-gray-600 flex items-center bg-white/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm">
                  <FaPhone className="mr-1.5 text-green-500 w-2.5 h-2.5" />
                  {order.customerPhone}
                </span>
              )}
              <span className="text-[11px] sm:text-sm font-black text-gray-600 flex items-center bg-white/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm">
                <FaClock className="mr-1.5 text-indigo-500 w-3 h-3" />
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tighter">₹{order.totalAmount}</p>
          <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
            order.status?.toUpperCase() === 'PLACED' ? 'bg-amber-100/50 text-amber-700' :
            order.status?.toUpperCase() === 'ACCEPTED' ? 'bg-blue-100/50 text-blue-700' :
            order.status?.toUpperCase() === 'COMPLETED' ? 'bg-green-100/50 text-green-700' :
            order.status?.toUpperCase() === 'REJECTED' || order.status?.toUpperCase() === 'CANCELLED' ? 'bg-red-100/50 text-red-700' :
            'bg-gray-100/50 text-gray-700'
          }`}>
            {order.status?.toUpperCase() === 'PLACED' && <FaSpinner className="animate-spin mr-1 w-2 h-2" />}
            {order.status?.toUpperCase() === 'PLACED' ? 'NEW' :
             order.status?.toUpperCase() === 'ACCEPTED' ? 'PREPARING' :
             order.status?.toUpperCase() === 'COMPLETED' ? 'SERVED' :
             order.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col min-h-0 bg-white/40">
        <div className="flex-1 min-h-0 mb-3 sm:mb-4">
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 sm:mb-3">
            <span>ITEMS ({order.items.length})</span>
            <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-lg border border-indigo-100/50 text-[9px] sm:text-[10px]">
              {order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)} Total
            </span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50/50 hover:bg-indigo-50/30 p-2 rounded-xl transition-all border border-transparent hover:border-indigo-100/30">
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-lg bg-white border border-gray-200/50 flex items-center justify-center text-xs font-black text-indigo-600">
                    {item.quantity}x
                  </span>
                  <span className="text-sm font-bold text-gray-700">{item.name}</span>
                </div>
                <span className="text-xs font-black text-gray-400 font-mono">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {order.specialInstructions && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-start space-x-2">
              <FaComment className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Special Instructions</p>
                <p className="text-sm font-medium text-amber-900">{order.specialInstructions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback for completed orders */}
        {order.status === 'COMPLETED' && order.feedback && (order.feedback.rating || order.feedback.comment) && (
          <div className="mb-4 p-3 rounded-2xl bg-green-50/50 border border-green-100">
            <div className="flex items-start space-x-2">
              <FaStar className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Customer Feedback</p>
                {order.feedback.rating && (
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={`w-4 h-4 ${i < order.feedback!.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="text-sm font-bold text-gray-700 ml-1">{order.feedback.rating}/5</span>
                  </div>
                )}
                {order.feedback.comment && (
                  <p className="text-sm font-medium text-green-900">{order.feedback.comment}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection reason */}
        {order.status === 'REJECTED' && order.rejectionReason && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50/50 border border-red-100">
            <div className="flex items-start space-x-2">
              <FaExclamationCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                <p className="text-sm font-medium text-red-900">{order.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation reason */}
        {order.status === 'CANCELLED' && order.cancellationReason && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50/50 border border-red-100">
            <div className="flex items-start space-x-2">
              <FaTimes className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Cancellation Reason</p>
                <p className="text-sm font-medium text-red-900">{order.cancellationReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Unpaid reason for orders marked as unpaid */}
        {order.paymentStatus === 'UNPAID' && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50/50 border border-red-100">
            <div className="flex items-start space-x-2">
              <FaExclamationTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Payment Status</p>
                <p className="text-sm font-medium text-red-900">Order marked as unpaid</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className={`p-2 sm:p-3 rounded-2xl border transition-all ${paymentStatusDisplay.bgColor} ${paid ? 'border-green-100' : 'border-gray-100'}`}>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center bg-white shadow-sm font-bold ${paymentStatusDisplay.color}`}>
                {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-4 h-4" /> : <FaMoneyBillWave className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PAYMENT</p>
                <p className={`text-xs sm:text-sm font-black truncate leading-tight ${paymentStatusDisplay.color}`}>
                  {paymentStatusDisplay.text}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50/30 border border-indigo-100/50 p-2 sm:p-3 rounded-2xl flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white text-indigo-600 rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center">
              <FaHashtag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ORDER ID</p>
              <p className="text-xs sm:text-sm font-black text-indigo-700 truncate leading-tight">#{order.orderNumber || order._id.slice(-6)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
          
          {/* Unified Payment Actions - Only visible if not verified */}
          {(() => {
            // Robust field detection using case-insensitive search
            const orderKeys = Object.keys(order);
            const targetKey = orderKeys.find(k => k.toLowerCase() === 'paymentverificationrequestbycustomer');
            const paymentObj = targetKey ? (order as any)[targetKey] : null;

            const hasApplied = !!paymentObj?.applied || String(paymentObj?.applied) === 'true';
            const hasUTR = !!order.utr || !!order.submittedUtr || !!paymentObj?.appliedUTR;
            const isRetry = order.paymentStatus?.toUpperCase() === 'RETRY';
            const showVerify = (hasApplied || hasUTR || isRetry) && order.status?.toUpperCase() === 'ACCEPTED';
            
            console.log(`[DEBUG:OrderCard:${order.orderNumber || order._id?.slice(-6)}]`, { 
              showVerify,
              detectedKey: targetKey,
              paymentObj,
              hasApplied,
              hasUTR,
              isRetry,
              orderKeys,
              fullOrderSample: JSON.stringify(order).slice(0, 300)
            });
            
            if (paid || order.status?.toUpperCase() === 'REJECTED' || order.status?.toUpperCase() === 'CANCELLED' || order.status?.toUpperCase() !== 'ACCEPTED') {
              return null;
            }

            return (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {/* Case 1: Payment Verification Needed (Applied) */}
                {showVerify ? (
                  <>
                    <Button 
                      size="md" 
                      variant="success"
                      onClick={() => setModalType('VERIFY_PAYMENT')}
                      isLoading={isLoading('VERIFY_PAYMENT')}
                      disabled={isAnyLoading}
                      leftIcon={<FaCheckCircle className="w-4 h-4" />}
                      fullWidth
                    >
                      Verify Payment
                    </Button>
                  </>
                ) : (
                  /* Case 2: Regular Payment Collection */
                  <Button 
                    size="md" 
                    variant="success" 
                    onClick={() => setModalType('COLLECT_PAYMENT')}
                    isLoading={isLoading('COLLECT_PAYMENT')}
                    disabled={isAnyLoading}
                    className="flex-1 sm:flex-none"
                    leftIcon={<FaMoneyBillWave className="w-4 h-4" />}
                  >
                    {order.paymentDueStatus?.toUpperCase() === 'DUE' ? 'Clear Due' : 'Collect Payment'}
                  </Button>
                )}
              </div>
            );
          })()}

          {/* Status-based Actions (Accept, Reject, Serve, Mark Unpaid) */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {order.status?.toUpperCase() === 'PLACED' && (
              <>
                <Button 
                  size="md" 
                  onClick={() => handleAction('ACCEPT_ORDER')} 
                  isLoading={isLoading('ACCEPT_ORDER')}
                  disabled={isAnyLoading}
                  leftIcon={<FaCheck className="w-4 h-4" />}
                >
                  Accept
                </Button>
                <Button 
                  size="md" 
                  variant="danger" 
                  onClick={() => setModalType('REJECT_ORDER')}
                  isLoading={isLoading('REJECT_ORDER')}
                  disabled={isAnyLoading}
                  leftIcon={<FaExclamationCircle className="w-4 h-4" />}
                >
                  Reject
                </Button>
              </>
            )}

            {order.status?.toUpperCase() === 'ACCEPTED' && (
              <Button 
                size="md" 
                variant="primary" 
                onClick={() => handleAction('COMPLETE_ORDER')} 
                isLoading={isLoading('COMPLETE_ORDER')}
                disabled={isAnyLoading}
                leftIcon={<FaUtensils className="w-4 h-4" />}
              >
                Serve
              </Button>
            )}

            {order.status?.toUpperCase() === 'COMPLETED' && !paid && order.paymentStatus?.toUpperCase() !== 'UNPAID' && (
              <Button 
                size="md" 
                variant="danger" 
                onClick={() => setModalType('MARK_UNPAID')}
                isLoading={isLoading('MARK_UNPAID')}
                disabled={isAnyLoading}
                leftIcon={<FaExclamationTriangle className="w-4 h-4" />}
              >
                Mark Unpaid
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* Action Modal */}
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

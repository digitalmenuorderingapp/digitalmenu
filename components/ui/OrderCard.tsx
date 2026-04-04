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
  FaUndo, 
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
  return order.paymentStatus === 'VERIFIED';
};

// Helper function to get payment status display
export const getPaymentStatusDisplay = (order: Order) => {
  const paid = isOrderPaid(order);

  if (order.paymentStatus === 'UNPAID') {
    return { text: 'Unpaid (Rejected)', color: 'text-red-600', bgColor: 'bg-red-50' };
  }

  if (order.refund?.status === 'COMPLETED') {
    return { text: `Refunded`, color: 'text-purple-600', bgColor: 'bg-purple-50' };
  }

  if (order.refund?.status === 'PENDING') {
    return { text: 'Refund Pending', color: 'text-orange-600', bgColor: 'bg-orange-50' };
  }

  if (paid) {
    return {
      text: order.collectedVia === 'CASH' ? 'Cash Collected' : 'Online Verified',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  }

  if (order.paymentStatus === 'RETRY') {
    return {
      text: `Retry (${order.retryCount || 0}/3)`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    };
  }

  if (order.paymentDueStatus === 'DUE') {
    return {
       text: 'Payment Due',
       color: 'text-red-700 font-black',
       bgColor: 'bg-red-100'
    };
  }

  return { 
    text: order.paymentMethod === 'ONLINE' ? 'Online Pending' : 'Pay at Counter', 
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
  paymentMethod?: 'ONLINE' | 'COUNTER';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
  paymentDueStatus?: 'CLEAR' | 'DUE';
  collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED';
  utr?: string;
  retryCount?: number;
  refund?: {
    status: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED';
    method?: string;
    amount?: number;
    processedAt?: string;
  };
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  feedback?: {
    rating?: number;
    comment?: string;
  };
  transactions?: any[];
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
               order.status === 'PLACED' ? 'bg-amber-50 text-amber-600' :
               order.status === 'ACCEPTED' ? 'bg-blue-50 text-blue-600' :
               order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
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
              order.status === 'PLACED' ? 'bg-amber-100 text-amber-600' :
              order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' :
              order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
              order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center space-x-1">
            {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-3 h-3 text-blue-500" /> : <FaMoneyBillWave className="w-3 h-3 text-amber-500" />}
            <span className={`text-[10px] font-bold ${paymentStatusDisplay.color}`}>
              {paymentStatusDisplay.text}
            </span>
          </div>
          <FaArrowRight className="w-3 h-3 text-gray-300 transition-colors" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-[2rem] border transition-all duration-300 overflow-hidden group/card shadow-sm hover:shadow-xl ${
        order.status === 'PLACED' ? 'bg-amber-50/50 border-amber-100/50 hover:border-amber-200' :
        order.status === 'ACCEPTED' ? 'bg-blue-50/50 border-blue-100/50 hover:border-blue-200' :
        order.status === 'COMPLETED' ? 'bg-green-50/50 border-green-100/50 hover:border-green-200' :
        order.status === 'REJECTED' ? 'bg-red-50/30 border-red-100/50' :
        'bg-white border-gray-100'
      } ${order.paymentDueStatus === 'DUE' ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
    >
      {/* Header */}
      <div className={`p-5 border-b border-gray-100/50 flex items-center justify-between transition-colors duration-300 ${
        order.status === 'PLACED' ? 'bg-gradient-to-br from-amber-50/80 to-white/40' :
        order.status === 'ACCEPTED' ? 'bg-gradient-to-br from-blue-50/80 to-white/40' :
        order.status === 'COMPLETED' ? 'bg-gradient-to-br from-green-50/80 to-white/40' :
        'bg-gradient-to-br from-gray-50/80 to-white/40'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm transition-transform duration-300 group-hover/card:scale-110 ${
            order.status === 'PLACED' ? 'bg-white text-amber-600 border border-amber-100' :
            order.status === 'ACCEPTED' ? 'bg-white text-blue-600 border border-blue-100' :
            order.status === 'COMPLETED' ? 'bg-white text-green-600 border border-green-100' :
            'bg-white text-gray-600 border border-gray-100'
          }`}>
            {order.tableNumber}
            {order.status === 'PLACED' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900 text-lg leading-tight uppercase tracking-tight transition-colors">
                {order.customerName}
              </h3>
              {order.numberOfPersons && (
                <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">
                  <FaUsers className="w-2.5 h-2.5" />
                  <span>{order.numberOfPersons}</span>
                </span>
              )}
            </div>
            <div className="flex items-center mt-1 space-x-2">
              {order.customerPhone && (
                <span className="text-sm font-bold text-gray-600 flex items-center bg-white/60 px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm">
                  <FaPhone className="mr-2 text-green-500 w-3 h-3" />
                  {order.customerPhone}
                </span>
              )}
              <span className="text-sm font-black text-gray-600 flex items-center bg-white/60 px-2.5 py-1 rounded-xl border border-gray-100 shadow-sm">
                <FaClock className="mr-2 text-indigo-500 w-3.5 h-3.5" />
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-indigo-600 tracking-tighter">₹{order.totalAmount}</p>
          <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            order.status === 'PLACED' ? 'bg-amber-100/50 text-amber-700' :
            order.status === 'ACCEPTED' ? 'bg-blue-100/50 text-blue-700' :
            order.status === 'COMPLETED' ? 'bg-green-100/50 text-green-700' :
            order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'bg-red-100/50 text-red-700' :
            'bg-gray-100/50 text-gray-700'
          }`}>
            {order.status === 'PLACED' && <FaSpinner className="animate-spin mr-1.5 w-2 h-2" />}
            {order.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col min-h-0 bg-white/40">
        <div className="flex-1 min-h-0 mb-4">
          <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
            <span>ITEMS ({order.items.length})</span>
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100/50">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} Total
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

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-2xl border transition-all ${paymentStatusDisplay.bgColor} ${paid ? 'border-green-100' : 'border-gray-100'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white shadow-sm font-bold ${paymentStatusDisplay.color}`}>
                {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-3.5 h-3.5" /> : <FaMoneyBillWave className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PAYMENT</p>
                <p className={`text-[11px] font-black truncate ${paymentStatusDisplay.color}`}>
                  {paymentStatusDisplay.text}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-2xl flex items-center space-x-3">
            <div className="w-8 h-8 bg-white text-indigo-600 rounded-xl shadow-sm flex items-center justify-center">
              <FaHashtag className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ORDER ID</p>
              <p className="text-[11px] font-black text-indigo-700 truncate">#{order.orderNumber || order._id.slice(-6)}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
          {/* Path A: ONLINE */}
          {order.paymentMethod === 'ONLINE' && order.status === 'PLACED' && order.paymentStatus === 'PENDING' && (
            <>
              <Button 
                size="md" 
                variant="success" 
                onClick={() => setModalType('VERIFY_PAYMENT')}
                isLoading={isLoading('VERIFY_PAYMENT')}
                disabled={isAnyLoading}
                leftIcon={<FaCheckCircle className="w-4 h-4" />}
                className="shadow-md shadow-green-200"
              >
                Verify Payment
              </Button>
              <Button 
                size="md" 
                variant="amber" 
                onClick={() => handleAction('REQUEST_RETRY')}
                isLoading={isLoading('REQUEST_RETRY')}
                disabled={isAnyLoading || (order.retryCount || 0) >= 3}
                leftIcon={<FaRedo className="w-4 h-4" />}
              >
                Request Retry
              </Button>
            </>
          )}

          {/* Path B: COUNTER / ACCEPTED Flow */}
          {order.status === 'PLACED' && order.paymentMethod === 'COUNTER' && (
            <Button 
              size="md" 
              onClick={() => handleAction('ACCEPT_ORDER')} 
              isLoading={isLoading('ACCEPT_ORDER')}
              disabled={isAnyLoading}
              leftIcon={<FaCheck className="w-4 h-4" />}
            >
              Accept
            </Button>
          )}

          {/* Combined Serve path */}
          {order.status === 'ACCEPTED' || (order.status === 'PLACED' && order.paymentStatus === 'VERIFIED') ? (
            <Button 
              size="md" 
              variant="success" 
              onClick={() => handleAction('COMPLETE_ORDER')} 
              isLoading={isLoading('COMPLETE_ORDER')}
              disabled={isAnyLoading}
              leftIcon={<FaUtensils className="w-4 h-4" />}
            >
              Serve
            </Button>
          ) : null}

          {/* Reject button (General) */}
          {(order.status === 'PLACED' || order.status === 'ACCEPTED') && (
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
          )}

          {/* Post-Serve Actions */}
          {order.status === 'COMPLETED' && !paid && (
            <>
              <Button 
                size="md" 
                variant="success" 
                onClick={() => setModalType('COLLECT_PAYMENT')}
                isLoading={isLoading('COLLECT_PAYMENT')}
                disabled={isAnyLoading}
                leftIcon={<FaMoneyBillWave className="w-4 h-4" />}
              >
                Collect Payment
              </Button>
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
            </>
          )}

          {/* Refund path */}
          {order.status === 'REJECTED' && order.paymentStatus === 'VERIFIED' && order.refund?.status === 'PENDING' && (
            <Button 
              size="md" 
              variant="primary" 
              onClick={() => setModalType('COMPLETE_REFUND')}
              isLoading={isLoading('COMPLETE_REFUND')}
              disabled={isAnyLoading}
              leftIcon={<FaUndo className="w-4 h-4" />}
            >
              Complete Refund
            </Button>
          )}

          {/* Unpaid in Retry mode */}
          {order.paymentStatus === 'RETRY' && (order.retryCount || 0) >= 3 && (
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

      {/* Action Modal */}
      <ActionModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onConfirm={(payload) => handleAction(modalType!, payload)}
        type={modalType!}
        orderNumber={order.orderNumber || order._id.slice(-6)}
        amount={order.totalAmount}
      />
    </motion.div>
  );
};

export default OrderCard;

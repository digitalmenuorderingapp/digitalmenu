'use client';

import React from 'react';
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
  FaArrowRight
} from 'react-icons/fa';
import Button from './Button';

// Helper function to check if order is paid - exported for reuse
export const isOrderPaid = (order: Order) => {
  return order.transactions?.some(tx => tx.type === 'PAYMENT' && tx.status === 'VERIFIED') || order.paymentStatus === 'VERIFIED';
};

// Helper function to get payment status display - exported for reuse
export const getPaymentStatusDisplay = (order: Order) => {
  const paid = isOrderPaid(order);

  // For cancelled/rejected orders that were never paid
  if ((order.status === 'cancelled' || order.status === 'rejected') && !paid) {
    return { text: 'Payment not done', color: 'text-gray-500', bgColor: 'bg-gray-50' };
  }

  // For refunded orders
  if (order.refund?.status === 'refunded') {
    return { 
      text: `Refunded ${order.refund.method === 'online' ? '(Online)' : '(Cash)'}`, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    };
  }

  // For pending refunds
  if (order.refund?.status === 'pending') {
    return { 
      text: 'Refund pending', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    };
  }

  // For paid orders
  if (paid) {
    return {
      text: order.paymentMethod === 'cash' ? 'Cash Collected' : `Paid ${order.paymentMethod === 'online' ? '(Online)' : '(Cash)'}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    };
  }

  // Default pending
  return { 
    text: 'Payment pending', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
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
  tableNumber: number;
  customerName: string;
  numberOfPersons?: number;
  specialInstructions?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled';
  paymentMethod?: 'cash' | 'online';
  paymentStatus: 'PENDING' | 'VERIFIED';
  refund?: {
    status: 'none' | 'pending' | 'refunded';
    method?: 'cash' | 'online';
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
  onUpdateStatus?: (orderId: string, status: string) => void;
  onVerifyPayment?: (order: Order) => void;
  onCollectCash?: (orderId: string) => void;
  onRefund?: (order: Order) => void;
  onReject?: (orderId: string) => void;
}

const OrderCard = ({
  order,
  variant = 'today',
  onUpdateStatus,
  onVerifyPayment,
  onCollectCash,
  onRefund,
  onReject
}: OrderCardProps) => {
  const paid = isOrderPaid(order);
  const paymentStatus = getPaymentStatusDisplay(order);

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
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600">
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
              order.status === 'placed' ? 'bg-amber-100 text-amber-600' :
              order.status === 'preparing' ? 'bg-blue-100 text-blue-600' :
              order.status === 'served' ? 'bg-green-100 text-green-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-center space-x-1">
            {order.paymentMethod === 'online' ? <FaCreditCard className="w-3 h-3 text-blue-500" /> : <FaMoneyBillWave className="w-3 h-3 text-amber-500" />}
            <span className={`text-[10px] font-bold ${paid ? 'text-green-600' : 'text-gray-400'}`}>
              {paid ? 'Paid' : 'Pending'}
            </span>
          </div>
          <FaArrowRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 transition-colors" />
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
        order.status === 'placed' ? 'bg-amber-50/50 border-amber-100/50 hover:border-amber-200' :
        order.status === 'preparing' ? 'bg-blue-50/50 border-blue-100/50 hover:border-blue-200' :
        order.status === 'served' ? 'bg-green-50/50 border-green-100/50 hover:border-green-200' :
        order.status === 'rejected' ? 'bg-yellow-50/50 border-yellow-100/50 hover:border-yellow-200' :
        order.status === 'cancelled' ? 'bg-red-50/50 border-red-100/50 hover:border-red-200' :
        'bg-white border-gray-100'
      } ${!paid && order.paymentMethod === 'cash' ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
    >
      {/* Header */}
      <div className={`p-5 border-b border-gray-100/50 flex items-center justify-between transition-colors duration-300 ${
        order.status === 'placed' ? 'bg-gradient-to-br from-amber-50/80 to-white/40' :
        order.status === 'preparing' ? 'bg-gradient-to-br from-blue-50/80 to-white/40' :
        order.status === 'served' ? 'bg-gradient-to-br from-green-50/80 to-white/40' :
        'bg-gradient-to-br from-gray-50/80 to-white/40'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl transition-transform duration-300 group-hover/card:scale-110 ${
            order.status === 'placed' ? 'bg-white text-amber-600 border border-amber-100' :
            order.status === 'preparing' ? 'bg-white text-blue-600 border border-blue-100' :
            order.status === 'served' ? 'bg-white text-green-600 border border-green-100' :
            'bg-white text-gray-600 border border-gray-100'
          }`}>
            {order.tableNumber}
            {order.status === 'placed' && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-gray-900 text-lg leading-tight uppercase tracking-tight group-hover/card:text-indigo-600 transition-colors">
                {order.customerName}
              </h3>
              {order.numberOfPersons && (
                <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-black text-gray-500">
                  <FaUsers className="w-2.5 h-2.5" />
                  <span>{order.numberOfPersons}</span>
                </span>
              )}
            </div>
            <div className="flex items-center mt-2">
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
            order.status === 'placed' ? 'bg-amber-100/50 text-amber-700' :
            order.status === 'preparing' ? 'bg-blue-100/50 text-blue-700' :
            order.status === 'served' ? 'bg-green-100/50 text-green-700' :
            'bg-gray-100/50 text-gray-700'
          }`}>
            {order.status === 'placed' && <FaSpinner className="animate-spin mr-1.5 w-2 h-2" />}
            {order.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col min-h-0 bg-white/40">
        {/* Items List */}
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

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-2xl border transition-all ${
            order.refund?.status === 'refunded' ? 'bg-purple-50/30 border-purple-100/50' :
            order.refund?.status === 'pending' ? 'bg-orange-50/30 border-orange-100/50' :
            paid ? 'bg-green-50/30 border-green-100/50' : 
            'bg-amber-50/30 border-amber-100/50'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                order.refund?.status === 'refunded' ? 'bg-white text-purple-600' :
                order.refund?.status === 'pending' ? 'bg-white text-orange-600' :
                paid ? 'bg-white text-green-600' : 
                'bg-white text-amber-600'
              }`}>
                {order.refund?.status === 'refunded' || order.refund?.status === 'pending' ? <FaUndo className="w-3.5 h-3.5" /> :
                 order.paymentMethod === 'online' ? <FaCreditCard className="w-3.5 h-3.5" /> : 
                 <FaMoneyBillWave className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">PAYMENT</p>
                <p className={`text-[11px] font-black truncate ${
                  order.refund?.status === 'refunded' ? 'text-purple-600' :
                  order.refund?.status === 'pending' ? 'text-orange-600' :
                  paid ? 'text-green-600' : 
                  'text-amber-600'
                }`}>
                  {order.refund?.status === 'refunded' ? `Refunded ₹${order.refund.amount}` :
                   order.refund?.status === 'pending' ? 'Refund Pending' :
                   paid ? 'Collected' : 
                   'Pending'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50/30 border border-indigo-100/50 p-3 rounded-2xl flex items-center space-x-3">
            <div className="w-8 h-8 bg-white text-indigo-600 rounded-xl flex items-center justify-center">
              <FaHashtag className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ORDER ID</p>
              <p className="text-[11px] font-black text-indigo-700 truncate">#{order.orderNumber || order._id.slice(-6)}</p>
            </div>
          </div>
        </div>

        {/* Status Info */}
        <div className="mb-4 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                order.status === 'placed' ? 'bg-amber-100 text-amber-700' :
                order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                order.status === 'served' ? 'bg-green-100 text-green-700' :
                order.status === 'rejected' ? 'bg-yellow-100 text-yellow-700' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {order.status === 'placed' && <FaSpinner className="animate-spin mr-1.5 w-2 h-2" />}
                {order.status === 'served' && <FaCheck className="mr-1.5 w-2 h-2" />}
                {order.status === 'rejected' && <FaTimes className="mr-1.5 w-2 h-2" />}
                {order.status === 'cancelled' && <FaTimes className="mr-1.5 w-2 h-2" />}
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium">
                {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash Payment'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {order.status === 'placed' && (
            <Button size="sm" onClick={() => onUpdateStatus?.(order._id, 'preparing')} leftIcon={<FaUtensils className="w-3 h-3" />}>
              Prepare
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button variant="success" size="sm" onClick={() => onUpdateStatus?.(order._id, 'served')} leftIcon={<FaCheck className="w-3 h-3" />}>
              Serve
            </Button>
          )}
          {!paid && order.paymentMethod === 'online' && (
            <Button variant="amber" size="sm" onClick={() => onVerifyPayment?.(order)} leftIcon={<FaCheckCircle className="w-3 h-3" />}>
              Verify Payment
            </Button>
          )}
          {!paid && order.paymentMethod === 'cash' && order.status === 'served' && (
            <Button variant="success" size="sm" onClick={() => onCollectCash?.(order._id)} leftIcon={<FaMoneyBillWave className="w-3 h-3" />}>
              Collect Cash
            </Button>
          )}
          {paid && order.status !== 'served' && order.refund?.status !== 'refunded' && (
             <Button variant="amber" size="sm" onClick={() => onRefund?.(order)} leftIcon={<FaUndo className="w-3 h-3" />}>
              Refund
            </Button>
          )}
          {(order.status === 'placed' || order.status === 'preparing') && (
            <Button variant="danger" size="sm" onClick={() => onReject?.(order._id)} leftIcon={<FaTimes className="w-3 h-3" />}>
              Reject
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaCheckCircle, 
  FaUndo, 
  FaClock, 
  FaHashtag,
  FaUtensils,
  FaArrowRight
} from 'react-icons/fa';

interface Transaction {
  _id: string;
  type: 'PAYMENT' | 'REFUND';
  paymentMode: 'CASH' | 'ONLINE' | 'COUNTER';
  status: 'PENDING' | 'VERIFIED';
  amount: number;
  createdAt: string;
  meta: {
    orderNumber: string;
    tableNumber?: number;
    deviceId?: string;
    utr?: string;
  };
}

interface TransactionCardProps {
  transaction: Transaction;
  onViewDetails?: (transaction: Transaction) => void;
}

const TransactionCard = ({ transaction, onViewDetails }: TransactionCardProps) => {
  const isPayment = transaction.type === 'PAYMENT';
  const isOnline = transaction.paymentMode === 'ONLINE';
  const isVerified = transaction.status === 'VERIFIED';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
    >
      {/* Type-based Accent Strip */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${
        isPayment ? (isVerified ? 'bg-green-500' : 'bg-amber-400') : 'bg-red-500'
      }`} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110 ${
            isPayment 
              ? (isOnline ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600') 
              : 'bg-red-50 text-red-600'
          }`}>
            {isPayment 
              ? (isOnline ? <FaCreditCard /> : <FaMoneyBillWave />) 
              : <FaUndo />
            }
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-black text-gray-900 uppercase tracking-tight">#{transaction.meta.orderNumber}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                isPayment ? (isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700') : 'bg-red-100 text-red-700'
              }`}>
                {transaction.type}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                isOnline ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {transaction.paymentMode}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-bold text-gray-400 uppercase tracking-tighter">
              {transaction.meta.tableNumber && (
                <span className="flex items-center">
                  <FaUtensils className="mr-1 w-2.5 h-2.5 text-indigo-400" />
                  Table {transaction.meta.tableNumber}
                </span>
              )}
              <span className="flex items-center">
                <FaClock className="mr-1 w-2.5 h-2.5 text-indigo-400" />
                {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              {transaction.meta.utr && (
                <span className="flex items-center text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50">
                  <FaHashtag className="mr-1 w-2.5 h-2.5" />
                  UTR: {transaction.meta.utr}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end md:space-x-6 w-full md:w-auto">
          <div className="text-right">
            <p className={`text-xl font-black ${isPayment ? 'text-indigo-600' : 'text-red-600'}`}>
              {isPayment ? '+' : '-'}₹{Math.round(Math.abs(transaction.amount))}
            </p>
            <div className={`flex items-center justify-end text-[10px] font-black uppercase tracking-widest mt-0.5 ${isVerified ? 'text-green-600' : 'text-orange-500'}`}>
              {isVerified ? (
                <>
                  <FaCheckCircle className="mr-1 w-2.5 h-2.5" />
                  Verified
                </>
              ) : 'Pending Verification'}
            </div>
          </div>

          {onViewDetails && (
            <button 
              onClick={() => onViewDetails(transaction)}
              className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm flex items-center justify-center transform group-hover:translate-x-1"
            >
              <FaArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionCard;

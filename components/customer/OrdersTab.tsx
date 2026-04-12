'use client';

import { useState } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaMoneyBillWave, FaCreditCard, FaStar, FaComment, FaTimes, FaUtensils, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Order, MenuItem } from '@/types/order';


interface OrdersTabProps {
  orders: Order[];
  session: any;
  onRefresh: () => void;
  menuItems: MenuItem[];
  isRefreshing?: boolean;
}

interface FeedbackFormProps {
  orderId: string;
  onSubmit: (orderId: string, feedback: string, rating: number) => void;
}

function FeedbackForm({ orderId, onSubmit }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }
    setIsSubmitting(true);
    await onSubmit(orderId, feedback, rating);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <h4 className="text-xs font-medium text-gray-900 mb-2">Rate Your Experience</h4>

      {/* Star Rating */}
      <div className="flex items-center space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <FaStar
              className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>

      {/* Feedback Text */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
        placeholder="Share your experience with this order..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs resize-none mb-2"
      />
      <p className="text-[10px] text-gray-500 mb-2 text-right">
        {feedback.length}/500
      </p>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

function PaymentEntryForm({ order, session, onRefresh }: { order: Order; session: any; onRefresh?: () => void }) {
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isPending, setIsPending] = useState(order.paymentVerificationRequestbycustomer?.applied || false);

  const handleVerify = async () => {
    if (!utr || utr.length < 6) {
      toast.error('Please enter the last 6 digits of your UTR');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/order/${order._id}/retry-payment`, {
        paymentMethod: 'ONLINE',
        utr,
        deviceId: session.deviceId
      });
      toast.success('UTR submitted! Verification pending.');
      setUtr('');
      setIsPending(true);
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted and waiting for admin
  if (isPending || order.paymentVerificationRequestbycustomer?.applied) {
    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 text-center">
          <FaClock className="w-6 h-6 text-amber-500 mx-auto mb-1 animate-pulse" />
          <p className="text-xs font-bold text-amber-800">Verification Pending</p>
          <p className="text-[10px] text-amber-600 mt-0.5">
            Your UTR has been submitted. Waiting for admin to verify.
          </p>
          {order.utr && (
            <p className="text-[10px] text-gray-500 mt-1 font-mono">
              UTR: ••••••{order.utr.slice(-4)}
            </p>
          )}
        </div>
        <button
          onClick={async () => {
            setIsCheckingStatus(true);
            try {
              await onRefresh?.();
            } finally {
              setIsCheckingStatus(false);
            }
          }}
          disabled={isCheckingStatus}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            {(isCheckingStatus || isSubmitting) && <FaSpinner className="animate-spin" />}
            {isCheckingStatus ? 'Updating...' : 'Check Status'}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <div className="bg-white/50 rounded-lg p-2 border border-amber-200/50">
        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
          <span className="font-black text-amber-900 border-b border-amber-300 mr-1">OPTION 1:</span>
          Pay via Cash/UPI at the restaurant counter.
        </p>
        <div className="h-px bg-amber-200/30 my-1" />
        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
          <span className="font-black text-amber-900 border-b border-amber-300 mr-1">OPTION 2:</span>
          Pay online via any UPI app and enter the last 6 digits of your UTR below.
        </p>
      </div>

      {/* Retry Count Display */}
      {(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 && (
        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-2 text-center">
          <p className="text-[10px] font-bold text-indigo-800">
            Retry Attempts: <span className="text-indigo-900">{order.paymentVerificationRequestbycustomer?.retrycount || 0}</span>
          </p>
          <p className="text-[9px] text-indigo-600 mt-0.5">
            {(order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3
              ? 'Maximum retries reached. Please visit counter.'
              : 'Please ensure correct UTR before submitting.'}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-white border-2 border-indigo-50 rounded-lg text-center text-lg font-black font-mono tracking-widest focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={isSubmitting || utr.length < 6 || (order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3}
        className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-lg touch-manipulation"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin" />
            Submitting...
          </div>
        ) : `Submit UTR for Verification ${(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 ? `(${order.paymentVerificationRequestbycustomer?.retrycount}/3)` : ''}`}
      </button>
    </div>
  );
}

export default function OrdersTab({ orders, session, onRefresh, menuItems, isRefreshing }: OrdersTabProps) {
  const [orderToVerify, setOrderToVerify] = useState<Order | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderIdForCancel, setSelectedOrderIdForCancel] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLACED': return <FaClock />;
      case 'ACCEPTED': return <FaUtensils />;
      case 'COMPLETED': return <FaCheckCircle />;
      case 'REJECTED':
      case 'CANCELLED': return <FaTimesCircle />;
      default: return <FaClock />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return 'bg-amber-100 text-amber-600';
      case 'ACCEPTED': return 'bg-indigo-100 text-indigo-600';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-600';
      case 'REJECTED': return 'bg-rose-100 text-rose-600';
      case 'CANCELLED': return 'bg-orange-100 text-orange-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatDate = (date: any) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemImage = (itemId: string) => {
    const menuItem = menuItems.find(item => item._id === itemId);
    return menuItem?.image || (menuItem?.images && menuItem.images.length > 0 ? menuItem.images[0] : null);
  };

  const isOrderPaid = (order: Order) => {
    return order.paymentStatus === 'VERIFIED';
  };

  const submitFeedback = async (orderId: string, feedback: string, rating: number) => {
    try {
      await api.post(`/order/${orderId}/feedback`, {
        rating,
        comment: feedback
      });
      toast.success('Thank you for your feedback!');
      await onRefresh();
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const openCancelModal = (orderId: string) => {
    setSelectedOrderIdForCancel(orderId);
    setCancelModalOpen(true);
  };

  const cancelOrder = async () => {
    if (!selectedOrderIdForCancel) return;
    
    setIsCancelling(true);
    try {
      await api.put(`/order/${selectedOrderIdForCancel}/cancel`, {
        reason: cancelReason,
        deviceId: session.deviceId
      });
      toast.success('Order cancelled successfully');
      setCancelModalOpen(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-36 relative min-h-screen">
        <div className="mesh-gradient" />
        
        <div className="flex items-center justify-between mb-4">
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order History</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Track your recent delites</p>
           </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-xl border-white/50 p-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
               <FaClipboardList className="w-6 h-6 text-slate-300 mx-auto" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No orders yet</h3>
            <p className="text-slate-500 mt-1 text-sm font-medium">Your delicious journey is just one click away!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="glass-card rounded-xl shadow-2xl border-white/60 hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                {/* Order Header */}
                <div className={`relative px-4 py-3 border-b border-gray-100/50 ${
                  order.status === 'REJECTED' ? 'bg-red-50/50' :
                  order.status === 'CANCELLED' ? 'bg-orange-50/50' :
                  order.status === 'COMPLETED' ? 'bg-emerald-50/50' :
                  order.status === 'ACCEPTED' ? 'bg-indigo-50/50' :
                  'bg-white/50'
                }`}>
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                        <div className={`p-1.5 rounded-lg glass ${
                           order.status === 'COMPLETED' ? 'text-emerald-600' :
                           order.status === 'ACCEPTED' ? 'text-indigo-600' :
                           order.status === 'PLACED' ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.15em] ${getStatusColor(order.status)} border border-white/50`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 truncate tracking-tight">
                        Order #{order.orderNumber || order._id.slice(-6)}
                      </h3>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-black uppercase tracking-widest">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-indigo-600 tabular-nums">
                        ₹{order.totalAmount.toFixed(0)}
                      </p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Total Paid</p>
                    </div>
                  </div>
                  
                  {/* Status Stepper - Overhauled */}
                  <div className="mt-3 px-3">
                    <div className="relative flex items-center justify-between">
                      {/* Progress Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200/50 rounded-full z-0 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-[1.5s] ease-out"
                          style={{ 
                            width: order.status === 'PLACED' ? '10%' : 
                                   order.status === 'ACCEPTED' ? '50%' : 
                                   order.status === 'COMPLETED' ? '100%' : '0%' 
                          }}
                        />
                      </div>
                      
                      {/* Steps */}
                      {[
                        { key: 'PLACED', label: 'Placed', icon: <FaClock /> },
                        { key: 'ACCEPTED', label: 'Cooking', icon: <FaUtensils /> },
                        { key: 'COMPLETED', label: 'Delivered', icon: <FaCheckCircle /> }
                      ].map((step, idx) => {
                        const isDone = (order.status === 'ACCEPTED' && idx === 0) || 
                                       (order.status === 'COMPLETED' && (idx === 0 || idx === 1));
                        const isCurrent = order.status === step.key;
                        const isPast = isDone;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${
                              isCurrent ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-xl shadow-indigo-200' :
                              isPast ? 'bg-emerald-500 border-emerald-300 text-white' :
                              'bg-white border-gray-200 text-gray-400 shadow-inner'
                            }`}>
                              {isCurrent && (
                                <div className="absolute inset-0 rounded-xl border-2 border-indigo-400 animate-ping opacity-30" />
                              )}
                              <div className="text-xs">
                                {isPast ? <FaCheckCircle /> : step.icon}
                              </div>
                            </div>
                            <span className={`absolute -bottom-4 text-[8px] font-black uppercase tracking-widest transition-colors duration-500 ${
                              isCurrent ? 'text-indigo-600' : isPast ? 'text-emerald-600' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-4 space-y-3">
                  {/* Order Items */}
                  <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 shadow-inner">
                    <h4 className="font-black text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-2 flex items-center">
                      <span className="w-3 h-0.5 bg-indigo-500 rounded-full mr-2"></span>
                      Items in this Order
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-indigo-100/30 last:border-b-0 gap-3">
                          <div className="flex items-center space-x-2 min-w-0">
                            {/* Item Image with Quantity Badge */}
                            <div className="relative flex-shrink-0">
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-900 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg z-20 border border-white tabular-nums">
                                {item.quantity}
                              </span>
                              {(() => {
                                const itemImg = getItemImage(item.itemId);
                                return itemImg ? (
                                  <img 
                                    src={itemImg} 
                                    alt={item.name} 
                                    className="w-10 h-10 object-cover rounded-lg border border-white shadow-md"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-indigo-50 shadow-md">
                                    <span className="text-sm font-black text-indigo-200 uppercase">{item.name.charAt(0)}</span>
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-slate-900 font-black block truncate text-xs uppercase tracking-tight">{item.name}</span>
                              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5 opacity-60">₹{(item.price / item.quantity).toFixed(0)} PER UNIT</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-black text-slate-900 block text-sm tabular-nums">
                              ₹{(item.price).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mt-2 p-2 glass border border-amber-200 rounded-lg bg-amber-50/30">
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-0.5 italic">Note to Chef:</p>
                      <p className="text-xs font-medium text-amber-800 leading-relaxed italic">"{order.specialInstructions}"</p>
                    </div>
                  )}

                  {/* Payment Block */}
                  <div className={`p-3 rounded-xl border-2 transition-all duration-500 ${isOrderPaid(order)
                    ? 'bg-emerald-50/50 border-emerald-100/50'
                    : 'bg-amber-50/50 border-amber-100/50'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ${isOrderPaid(order) ? 'bg-white text-emerald-600 border border-emerald-100' : 'bg-white text-amber-600 border border-amber-100'}`}>
                          {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-4 h-4" /> : <FaMoneyBillWave className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Status</p>
                          <h4 className={`text-sm font-black flex items-center tracking-tight ${isOrderPaid(order) ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {isOrderPaid(order) ? (
                              <><FaCheckCircle className="mr-2 w-4 h-4" /> Fully Paid</>
                            ) : order.paymentVerificationRequestbycustomer?.applied ? (
                              <div className="flex flex-col">
                                <span className="flex items-center"><FaClock className="mr-2 w-4 h-4 animate-pulse" /> Verification Pending</span>
                                <span className="text-[10px] font-mono text-slate-400 mt-1 ml-6 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg w-fit border border-slate-200/50">UTR: •••{order.paymentVerificationRequestbycustomer.appliedUTR?.slice(-3) || order.utr?.slice(-3)}</span>
                              </div>
                            ) : order.paymentVerificationRequestbycustomer?.adminAskedretry ? (
                              <div className="flex flex-col">
                                <span className="flex items-center text-rose-600"><FaExclamationTriangle className="mr-2 w-4 h-4 text-rose-500" /> Payment Rejected</span>
                                <span className="text-[10px] font-mono text-rose-400 mt-1 ml-6 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-lg w-fit border border-rose-100/50">Last Failed: •••{order.paymentVerificationRequestbycustomer.appliedUTR?.slice(-3) || order.utr?.slice(-3)}</span>
                              </div>
                            ) : (
                              <><FaClock className="mr-1 w-3 h-3 animate-pulse" /> Awaiting Payment</>
                            )}
                          </h4>
                        </div>
                      </div>
                      
                      {!isOrderPaid(order) && order.status !== 'CANCELLED' && order.status !== 'REJECTED' && order.status === 'ACCEPTED' && (
                        <div className="flex-shrink-0">
                          {order.paymentVerificationRequestbycustomer?.applied ? (
                            <button disabled className="w-full sm:w-auto px-4 py-2 bg-indigo-400 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                              <FaSpinner className="animate-spin" /> Verifying... {(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 && `(${order.paymentVerificationRequestbycustomer.retrycount}/3)`}
                            </button>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <button 
                                onClick={() => setOrderToVerify(order)}
                                disabled={(order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3}
                                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                                  (order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                                    : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
                                }`}
                              >
                                Verify UPI Now {(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 && `(${order.paymentVerificationRequestbycustomer?.retrycount}/3)`}
                              </button>
                              {(order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 && (
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                  Visit Counter to Pay
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isOrderPaid(order) && (
                         <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 border border-emerald-400">
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {order.status === 'COMPLETED' && !order.feedback?.rating && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <FeedbackForm orderId={order._id} onSubmit={submitFeedback} />
                    </div>
                  )}

                  {/* Show existing feedback */}
                  {order.feedback?.rating && (
                    <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100/50">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-3 h-3 ${i < order.feedback!.rating! ? 'text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                      {order.feedback?.comment && (
                        <p className="text-slate-700 italic font-medium text-xs">"{order.feedback.comment}"</p>
                      )}
                    </div>
                  )}

                  {/* Cancel Button */}
                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => openCancelModal(order._id)}
                      className="w-full py-2 glass text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] border-rose-100 hover:bg-rose-50 transition-all active:scale-95 mt-2"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="glass-card rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-white/50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-rose-500 to-orange-600 p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Stop Order?</h2>
                    <p className="text-xs font-bold text-rose-100 uppercase tracking-widest mt-1">We'll miss serving you!</p>
                  </div>
                  <button onClick={() => !isCancelling && setCancelModalOpen(false)} className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optional Feedback</label>
                   <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Why are you cancelling? (Optional)"
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-50 focus:border-rose-200 text-sm font-medium resize-none shadow-inner"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-4 glass text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 active:scale-95 transition-all">Keep It</button>
                  <button onClick={cancelOrder} className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all">Cancel It</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Verification Modal */}
      <AnimatePresence>
        {orderToVerify && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setOrderToVerify(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass-card rounded-2xl border-white/60 p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group shadow-xl shadow-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Verify Payment</h2>
                    <p className="text-xs text-indigo-200 font-bold uppercase tracking-widest mt-1">Order #{orderToVerify.orderNumber || orderToVerify._id.slice(-6)}</p>
                  </div>
                  <button onClick={() => setOrderToVerify(null)} className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10">
                    <FaTimes />
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">₹{orderToVerify.totalAmount.toFixed(0)}</span>
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Total Amount</span>
                </div>
              </div>

              <div className="p-8">
                {/* Check if max retries reached */}
                {(orderToVerify.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 ? (
                  <div className="space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-black text-red-800 mb-2">Max Attempts Reached</h3>
                      <p className="text-sm text-red-600 mb-4">
                        You have exceeded the maximum number of UTR verification attempts (3/3).
                      </p>
                      <div className="bg-white rounded-xl p-4 border border-red-100">
                        <p className="text-sm font-bold text-gray-800 mb-2">Please pay at the counter</p>
                        <p className="text-xs text-gray-500">
                          Visit the restaurant counter and pay via Cash or UPI directly. The staff will mark your payment as collected.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <PaymentEntryForm 
                    order={orderToVerify} 
                    session={session} 
                    onRefresh={async () => {
                      await onRefresh();
                      setOrderToVerify(null);
                    }} 
                  />
                )}
              </div>
              
              <div className="px-8 pb-8">
                <button 
                  onClick={() => setOrderToVerify(null)}
                  className="w-full py-4 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Close & Pay Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

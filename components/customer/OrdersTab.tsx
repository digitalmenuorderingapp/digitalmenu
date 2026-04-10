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
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Rate Your Experience</h4>

      {/* Star Rating */}
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <FaStar
              className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>

      {/* Feedback Text */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
        placeholder="Share your experience with this order..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none mb-3"
      />
      <p className="text-xs text-gray-500 mb-3 text-right">
        {feedback.length}/500
      </p>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

function PaymentEntryForm({ order, session, onRefresh }: { order: Order; session: any; onRefresh?: () => void }) {
  const [utr, setUtr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, setIsPending] = useState(order.paymentStatus === 'RETRY' || order.utr);

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
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If already submitted and waiting for admin
  if (isPending || order.paymentStatus === 'RETRY' || order.utr) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
          <FaClock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-pulse" />
          <p className="text-sm font-bold text-amber-800">Verification Pending</p>
          <p className="text-xs text-amber-600 mt-1">
            Your UTR has been submitted. Waiting for admin to verify.
          </p>
          {order.utr && (
            <p className="text-xs text-gray-500 mt-2 font-mono">
              UTR: ••••••{order.utr.slice(-4)}
            </p>
          )}
        </div>
        <button
          onClick={() => onRefresh?.()}
          disabled={isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className={`animate-spin ${!isSubmitting && 'hidden'}`} />
            Check Status
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-white/50 rounded-xl p-3 border border-amber-200/50">
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          <span className="font-black text-amber-900 border-b border-amber-300 mr-1">OPTION 1:</span> 
          Pay via Cash/UPI at the restaurant counter.
        </p>
        <div className="h-px bg-amber-200/30 my-2" />
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          <span className="font-black text-amber-900 border-b border-amber-300 mr-1">OPTION 2:</span> 
          Pay online via any UPI app and enter the last 6 digits of your UTR below.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            disabled={isSubmitting}
            className="w-full px-4 py-3.5 bg-white border-2 border-indigo-50 rounded-xl text-center text-xl font-black font-mono tracking-widest focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={isSubmitting || utr.length < 6}
        className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-black active:scale-95 transition-all disabled:opacity-50 shadow-lg touch-manipulation"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center gap-2">
            <FaSpinner className="animate-spin" />
            Submitting...
          </div>
        ) : 'Submit UTR for Verification'}
      </button>
    </div>
  );
}

export default function OrdersTab({ orders, session, onRefresh, menuItems }: OrdersTabProps) {

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  // @ts-ignore
  const [orderToVerify, setOrderToVerify] = useState<Order | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const getItemImage = (itemId: string) => {
    const menuItem = menuItems?.find(mi => mi._id === itemId);
    if (!menuItem) return null;
    return menuItem.image || (menuItem.images && menuItem.images.length > 0 ? menuItem.images[0] : null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <FaClock className="w-5 h-5 text-yellow-500" />;
      case 'ACCEPTED':
        return <FaClipboardList className="w-5 h-5 text-blue-500" />;
      case 'COMPLETED':
        return <FaCheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED':
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      case 'REJECTED':
        return <FaTimesCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FaClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOrderPaid = (order: Order) => {
    return order.paymentStatus === 'VERIFIED';
  };

  const cancelOrder = async () => {
    if (!cancelOrderId) return;
    
    setIsCancelling(true);
    try {
      const url = cancelReason.trim()
        ? `/order/${cancelOrderId}/cancel?deviceId=${session.deviceId}&reason=${encodeURIComponent(cancelReason.trim())}`
        : `/order/${cancelOrderId}/cancel?deviceId=${session.deviceId}`;

      await api.put(url);
      toast.success('Order cancelled successfully');
      setCancelModalOpen(false);
      setCancelOrderId(null);
      setCancelReason('');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelModal = (orderId: string) => {
    setCancelOrderId(orderId);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const submitFeedback = async (orderId: string, comment: string, rating: number) => {
    try {
      await api.put(`/order/${orderId}/feedback`, { comment, rating });
      toast.success('Feedback submitted');
      onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  // @ts-ignore
  const toggleOrderExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500 mt-2">Your order history will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Order Header */}
                <div className={`bg-gradient-to-r ${order.status === 'REJECTED' ? 'from-red-50 to-red-100' :
                  order.status === 'CANCELLED' ? 'from-orange-50 to-orange-100' :
                    order.status === 'COMPLETED' ? 'from-green-50 to-green-100' :
                      order.status === 'ACCEPTED' ? 'from-blue-50 to-blue-100' :
                        'from-indigo-50 to-indigo-100'
                  } px-4 sm:px-6 py-4 border-b border-gray-200`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 flex-wrap gap-y-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 truncate">
                        #{order.orderNumber || order._id.slice(-8)}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-bold">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl sm:text-3xl font-black text-indigo-600">
                        ₹{order.totalAmount.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Stepper */}
                  <div className="mt-6 px-2">
                    <div className="relative flex items-center justify-between">
                      {/* Progress Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                          style={{ 
                            width: order.status === 'PLACED' ? '0%' : 
                                   order.status === 'ACCEPTED' ? '50%' : 
                                   order.status === 'COMPLETED' ? '100%' : '0%' 
                          }}
                        />
                      </div>
                      
                      {/* Steps */}
                      {[
                        { key: 'PLACED', label: 'Placed', icon: <FaClock className="w-2.5 h-2.5" /> },
                        { key: 'ACCEPTED', label: 'Preparing', icon: <FaUtensils className="w-2.5 h-2.5" /> },
                        { key: 'COMPLETED', label: 'Served', icon: <FaCheckCircle className="w-2.5 h-2.5" /> }
                      ].map((step, idx) => {
                        const isDone = ['ACCEPTED', 'COMPLETED'].includes(order.status) && idx === 0 || 
                                       order.status === 'COMPLETED' && idx === 1 ||
                                       order.status === step.key;
                        const isCurrent = order.status === step.key;
                        const isPast = (order.status === 'ACCEPTED' && idx === 0) || 
                                       (order.status === 'COMPLETED' && (idx === 0 || idx === 1));

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                              isCurrent ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' :
                              isPast ? 'bg-indigo-500 border-indigo-500 text-white' :
                              'bg-white border-gray-300 text-gray-400'
                            }`}>
                              {isPast ? <FaCheckCircle className="w-3 h-3" /> : step.icon}
                            </div>
                            <span className={`absolute -bottom-5 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors ${
                              isCurrent ? 'text-indigo-600' : 'text-gray-400'
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
                <div className="p-6 space-y-4">
                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 gap-4">
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Item Image with Quantity Badge */}
                            <div className="relative flex-shrink-0">
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm z-10 border border-white">
                                {item.quantity}
                              </span>
                              {(() => {
                                const itemImg = getItemImage(item.itemId);
                                return itemImg ? (
                                  <img 
                                    src={itemImg} 
                                    alt={item.name} 
                                    className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl border border-gray-100 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                                    <span className="text-lg font-bold text-indigo-400 uppercase">{item.name.charAt(0)}</span>
                                  </div>
                                );
                              })()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-gray-900 font-bold block truncate text-sm sm:text-base">{item.name}</span>
                              <p className="text-[10px] text-gray-500 font-medium tracking-tight">Qty: {item.quantity} × ₹{(item.price / item.quantity).toFixed(0)}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="font-bold text-gray-900 block text-sm sm:text-base">
                              ₹{(item.price).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t-2 border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-indigo-600">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.specialInstructions && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">Special Instructions:</p>
                      <p className="text-sm text-amber-700">{order.specialInstructions}</p>
                    </div>
                  )}

                  {/* Payment Block */}
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${isOrderPaid(order)
                    ? 'bg-green-50/50 border-green-100'
                    : 'bg-amber-50/50 border-amber-100'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${isOrderPaid(order) ? 'bg-white text-green-600' : 'bg-white text-amber-600'}`}>
                          {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-5 h-5 sm:w-6 sm:h-6" /> : <FaMoneyBillWave className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Payment Status</p>
                          <h4 className={`text-sm sm:text-base font-bold flex items-center ${isOrderPaid(order) ? 'text-green-700' : 'text-amber-700'}`}>
                            {isOrderPaid(order) ? (
                              <><FaCheckCircle className="mr-1.5 w-3.5 h-3.5 flex-shrink-0" /> Paid {order.paymentMethod === 'ONLINE' ? '(Online)' : '(Cash)'}</>
                            ) : (
                              <><FaClock className="mr-1.5 w-3.5 h-3.5 flex-shrink-0" /> Payment Pending</>
                            )}
                          </h4>
                          {!isOrderPaid(order) && (
                            <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                              Pay at counter or enter UTR
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Verification Link/Button */}
                      {!isOrderPaid(order) && order.status !== 'CANCELLED' && order.status !== 'REJECTED' && (
                        <>
                          {/* Max retries reached - show Exceeded status */}
                          {(order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 ? (
                            <button 
                              disabled
                              className="w-full sm:w-auto px-4 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 min-w-[100px] text-center border border-red-100 opacity-80"
                            >
                              Retry Count Exceeded
                            </button>
                          ) : /* Verification pending - show loading state */
                          (order.paymentVerificationRequestbycustomer?.applied) ? (
                            <button 
                              disabled
                              className="w-full sm:w-auto px-4 py-3 bg-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex-shrink-0 min-w-[100px] touch-manipulation flex items-center justify-center gap-2"
                            >
                              <FaSpinner className="animate-spin w-4 h-4" />
                              Verifying...
                            </button>
                          ) : /* Default - show Verify UPI button */
                          (
                            <button 
                              onClick={() => setOrderToVerify(order)}
                              className="w-full sm:w-auto px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 transition-all shadow-lg shadow-indigo-200 flex-shrink-0 min-w-[100px] touch-manipulation"
                            >
                              Verify UPI
                            </button>
                          )}
                        </>
                      )}
                      
                      {isOrderPaid(order) && (
                         <div className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-200 flex-shrink-0 self-start sm:self-center">
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {order.status === 'COMPLETED' && !order.feedback?.rating && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <FeedbackForm orderId={order._id} onSubmit={submitFeedback} />
                    </div>
                  )}

                  {/* Show existing feedback */}
                  {order.feedback?.rating && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-5 h-5 ${i < order.feedback!.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      {order.feedback?.comment && (
                        <p className="text-sm text-green-700 italic">"{order.feedback.comment}"</p>
                      )}
                    </div>
                  )}

                  {/* Cancel Button */}
                  {order.status === 'PLACED' && (
                    <div className="mt-4">
                      <button
                        onClick={() => openCancelModal(order._id)}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                      >
                        Cancel Order
                      </button>
                    </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">Cancel Order</h2>
                    <p className="text-sm opacity-90 mt-1">Are you sure?</p>
                  </div>
                  <button onClick={() => !isCancelling && setCancelModalOpen(false)}>
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason (optional)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                <div className="flex gap-3">
                  <button onClick={() => setCancelModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl">Keep</button>
                  <button onClick={cancelOrder} className="flex-1 py-3 bg-red-600 text-white rounded-xl">Cancel</button>
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
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
                    onRefresh={() => {
                      onRefresh();
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

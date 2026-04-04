'use client';

import { useState } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaMoneyBillWave, FaCreditCard, FaStar, FaComment, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Order } from '@/types/order';


interface OrdersTabProps {
  orders: Order[];
  session: any;
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

function RetryForm({ order }: { order: Order }) {
  const [utr, setUtr] = useState('');
  const [method, setMethod] = useState<'ONLINE' | 'COUNTER'>(order.paymentMethod || 'COUNTER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRetry = async () => {
    if (method === 'ONLINE' && (!utr || utr.length < 6)) {
      toast.error('Please enter last 6 digits of UTR');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/order/action', {
        orderId: order._id,
        action: 'RETRY_PAYMENT',
        payload: { method, utr }
      });
      toast.success('Payment details updated! Pending verification.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMethod('COUNTER')}
          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
            method === 'COUNTER' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Pay at Counter
        </button>
        <button
          onClick={() => setMethod('ONLINE')}
          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
            method === 'ONLINE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          Pay Online Again
        </button>
      </div>

      {method === 'ONLINE' && (
        <input
          type="text"
          value={utr}
          onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="New UTR (last 6 digits)"
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
        />
      )}

      <button
        onClick={handleRetry}
        disabled={isSubmitting}
        className="w-full py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50 shadow-sm"
      >
        {isSubmitting ? 'Updating...' : 'Resubmit Payment Details'}
      </button>
    </div>
  );
}

export default function OrdersTab({ orders, session }: OrdersTabProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
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
                  } px-6 py-4 border-b border-gray-200`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        #{order.orderNumber || order._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-indigo-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
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
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center space-x-3">
                            <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-bold text-indigo-600 shadow-sm">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-800 font-medium">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            ₹{(item.offerPrice || (item.price * item.quantity)).toFixed(2)}
                          </span>
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

                  {/* Rejection Reason */}
                  {order.status === 'REJECTED' && order.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{order.rejectionReason}</p>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {order.status === 'CANCELLED' && order.cancellationReason && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-medium text-orange-800 mb-1">Cancellation Reason:</p>
                      <p className="text-sm text-orange-700">{order.cancellationReason}</p>
                    </div>
                  )}

                  {/* PAYMENT BLOCK */}
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${isOrderPaid(order)
                    ? 'bg-green-50/50 border-green-100'
                    : 'bg-amber-50/50 border-amber-100'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isOrderPaid(order) ? 'bg-white text-green-600' : 'bg-white text-amber-600'
                          }`}>
                          {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-6 h-6" /> : <FaMoneyBillWave className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Payment Status</p>
                          <h4 className={`text-base font-bold flex items-center ${isOrderPaid(order) ? 'text-green-700' :
                              order.paymentStatus === 'RETRY' ? 'text-red-700' : 'text-amber-700'}`}>
                            {isOrderPaid(order) ? (
                              <><FaCheckCircle className="mr-1.5 w-4 h-4" /> Paid {order.paymentMethod === 'ONLINE' ? '(Online)' : '(Cash)'}</>
                            ) : order.paymentStatus === 'RETRY' ? (
                              <><FaTimesCircle className="mr-1.5 w-4 h-4" /> Payment Failed (Retry)</>
                            ) : (
                              <><FaClock className="mr-1.5 w-4 h-4" /> Payment Pending</>
                            )}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {isOrderPaid(order) 
                              ? `Verified at ${formatDate(order.updatedAt || order.createdAt)}` 
                              : `Initiated at ${formatDate(order.createdAt)}`}
                          </p>
                        </div>
                      </div>
                      {isOrderPaid(order) ? (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                          Verified
                        </div>
                      ) : order.paymentStatus === 'RETRY' ? (
                        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200 animate-bounce">
                          Retry
                        </div>
                      ) : (
                        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">
                          Pending
                        </div>
                      )}
                    </div>

                    {/* Retry Form */}
                    {order.paymentStatus === 'RETRY' && (
                      <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-200 shadow-inner">
                        <p className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <FaClock className="w-3 h-3" /> Action Required: Verification Failed
                        </p>
                        <RetryForm order={order} />
                      </div>
                    )}
                  </div>

                  {/* REFUND BLOCK - Only for REJECTED/CANCELLED orders with payment */}
                  {(order.status === 'CANCELLED' || order.status === 'REJECTED') && isOrderPaid(order) && (
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${order.refund?.status === 'COMPLETED'
                      ? 'bg-purple-50 border-purple-100'
                      : 'bg-orange-50 border-orange-100'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${order.refund?.status === 'COMPLETED' ? 'bg-white text-purple-600' : 'bg-white text-orange-600'
                            }`}>
                            <FaSpinner className={`w-6 h-6 ${order.refund?.status === 'COMPLETED' ? '' : 'animate-spin'}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Refund Status</p>
                            <h4 className={`text-base font-bold flex items-center ${order.refund?.status === 'COMPLETED' ? 'text-purple-700' : 'text-orange-700'}`}>
                              {order.refund?.status === 'COMPLETED' ? (
                                <><FaCheckCircle className="mr-1.5 w-4 h-4" /> Refund Completed</>
                              ) : (
                                <><FaSpinner className="mr-1.5 w-4 h-4 animate-spin" /> Refund Processing</>
                              )}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                              {order.refund?.status === 'COMPLETED'
                                ? `₹${(order.refund?.amount || order.totalAmount).toFixed(2)} refunded via ${order.refund?.method || 'original method'} at ${formatDate(order.refund?.processedAt || order.updatedAt)}`
                                : `Your refund of ₹${order.totalAmount.toFixed(2)} is being processed by the restaurant.`}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.refund?.status === 'COMPLETED'
                          ? 'bg-purple-100 text-purple-700 border-purple-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200'
                          }`}>
                          {order.refund?.status === 'COMPLETED' ? 'Refunded' : 'Processing'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback Section - Show for COMPLETED orders without feedback */}
                  {order.status === 'COMPLETED' && !order.feedback?.rating && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        Rate Your Experience
                      </h4>
                      <FeedbackForm orderId={order._id} onSubmit={submitFeedback} />
                    </div>
                  )}

                  {/* Show existing feedback */}
                  {(order.feedback?.comment || order.feedback?.rating) && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                        Your Feedback
                      </h4>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {order.feedback?.rating && (
                            <div className="flex items-center mb-2">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  className={`w-5 h-5 ${i < order.feedback!.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          )}
                          {order.feedback.comment && (
                            <p className="text-sm text-green-700 italic">"{order.feedback.comment}"</p>
                          )}
                        </div>
                        <FaComment className="w-5 h-5 text-green-600 ml-3" />
                      </div>
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

      {/* Cancel Order Modal */}
      <AnimatePresence>
        {cancelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isCancelling && setCancelModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black">Cancel Order</h2>
                    <p className="text-sm opacity-90 mt-1">Are you sure you want to cancel?</p>
                  </div>
                  <button
                    onClick={() => !isCancelling && setCancelModalOpen(false)}
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Reason for cancellation <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value.slice(0, 200))}
                    placeholder="Tell us why you're cancelling..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {cancelReason.length}/200
                  </p>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">Note:</span> Once cancelled, this action cannot be undone. If payment was already made, a refund will be processed.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setCancelModalOpen(false)}
                    disabled={isCancelling}
                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={cancelOrder}
                    disabled={isCancelling}
                    className="flex-1 py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Yes, Cancel'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { FaClipboardList, FaClock, FaCheckCircle, FaTimesCircle, FaSpinner, FaMoneyBillWave, FaCreditCard, FaStar, FaComment, FaTimes, FaUtensils, FaExclamationTriangle, FaPrint, FaDownload, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Order, MenuItem } from '@/types/order';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderFeedbackSchema, OrderFeedbackInput, paymentVerifySchema, PaymentVerifyInput, cancelOrderSchema, CancelOrderInput } from '@/lib/validations';
import html2pdf from 'html2pdf.js';
import PrintableBill from '@/components/ui/PrintableBill';


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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<OrderFeedbackInput>({
    resolver: zodResolver(orderFeedbackSchema),
    defaultValues: {
      rating: 5,
      comment: ''
    }
  });

  const rating = watch('rating');
  const comment = watch('comment');

  const onFormSubmit = async (data: OrderFeedbackInput) => {
    await onSubmit(orderId, data.comment, data.rating);
  };

  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <h4 className="text-xs font-medium text-gray-900 mb-2">Rate Your Experience</h4>

      {/* Star Rating */}
      <div className="flex items-center space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue('rating', star)}
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
        {...register('comment')}
        placeholder="Share your experience with this order..."
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs resize-none mb-1"
      />
      {errors.comment && <p className="text-rose-500 text-[10px] font-bold mb-1">{errors.comment.message}</p>}
      
      <p className="text-[10px] text-gray-500 mb-2 text-right">
        {comment.length}/500
      </p>

      <button
        onClick={handleSubmit(onFormSubmit)}
        disabled={isSubmitting}
        className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}

function PaymentEntryForm({ order, session, onRefresh }: { order: Order; session: any; onRefresh?: () => void }) {
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  // Single source of truth from props
  const isPending = (order.paymentVerificationRequestbycustomer?.applied || !!order.paymentVerificationRequestbycustomer?.appliedUTR) && !order.paymentVerificationRequestbycustomer?.adminAskedretry;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PaymentVerifyInput>({
    resolver: zodResolver(paymentVerifySchema),
    defaultValues: {
      utr: ''
    }
  });

  const utr = watch('utr');

  const onFormSubmit = async (data: PaymentVerifyInput) => {
    try {
      await api.put(`/order/${order._id}/retry-payment`, {
        paymentMethod: 'ONLINE',
        utr: data.utr,
        deviceId: session.deviceId
      });
      toast.success('UTR submitted! Verification pending.');
      if (onRefresh) await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
    }
  };

  // If already submitted and waiting for admin
  if (isPending) {
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
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-indigo-100"
        >
          <div className="flex items-center justify-center gap-2">
            {(isCheckingStatus || isSubmitting) && <FaSpinner className="animate-spin" />}
            {isCheckingStatus ? 'Syncing...' : 'Check Status'}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Instructions */}
      <div className="bg-slate-50/80 rounded-3xl p-6 border border-indigo-50 shadow-inner space-y-4">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-50">
            <span className="text-xs font-black text-indigo-500">01</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Option 1: In-Person</p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Pay via Cash or UPI at the restaurant counter.</p>
          </div>
        </div>
        <div className="h-px bg-indigo-100/50" />
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-50">
            <span className="text-xs font-black text-indigo-500">02</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">Option 2: Online UPI</p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Pay via any UPI app and enter the last 6 digits of your UTR below.</p>
          </div>
        </div>
      </div>

      {/* Retry Count Display */}
      {(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
            Attempt {order.paymentVerificationRequestbycustomer?.retrycount}/3
          </p>
          <p className="text-[9px] text-amber-600 font-medium mt-1">
            Please double-check your UTR to avoid being locked out.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Enter Last 6 Digits</label>
        <div className="relative">
          <input
            type="text"
            {...register('utr')}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setValue('utr', val);
            }}
            placeholder="••••••"
            disabled={isSubmitting}
            className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-center text-2xl font-black font-mono tracking-[0.5em] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-300 shadow-inner placeholder:text-slate-200"
          />
        </div>
        {errors.utr && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-tight">{errors.utr.message}</p>}
      </div>

      <button
        onClick={handleSubmit(onFormSubmit)}
        disabled={isSubmitting || (order.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 || utr?.length !== 6}
        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black active:scale-[0.98] transition-all disabled:opacity-30 shadow-2xl shadow-slate-200 flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <>
            <FaSpinner className="animate-spin w-4 h-4" />
            Securing...
          </>
        ) : (
          <>
            Verify My Payment
            {(order.paymentVerificationRequestbycustomer?.retrycount || 0) > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[8px]">
                {order.paymentVerificationRequestbycustomer?.retrycount}/3
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}

export default function OrdersTab({ orders, session, onRefresh, menuItems, isRefreshing }: OrdersTabProps) {
  const [orderToVerifyId, setOrderToVerifyId] = useState<string | null>(null);
  const orderToVerify = orders.find(o => o._id === orderToVerifyId);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedOrderIdForCancel, setSelectedOrderIdForCancel] = useState<string | null>(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedOrderForBill, setSelectedOrderForBill] = useState<Order | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  const {
    register: registerCancel,
    handleSubmit: handleSubmitCancel,
    formState: { isSubmitting: isCancelling }
  } = useForm<CancelOrderInput>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: {
      reason: ''
    }
  });

  const handleDownloadPDF = () => {
    if (!billRef.current || !selectedOrderForBill) return;

    const element = billRef.current;
    const opt = {
      margin: 0,
      filename: `Bill_${selectedOrderForBill.orderNumber || selectedOrderForBill._id}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: [80, 297] as [number, number], orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

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
      await api.put(`/order/${orderId}/feedback`, {
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

  const cancelOrder = async (data: CancelOrderInput) => {
    if (!selectedOrderIdForCancel) return;
    
    try {
      await api.put(`/order/${selectedOrderIdForCancel}/cancel`, {
        reason: data.reason,
        deviceId: session.deviceId
      });
      toast.success('Order cancelled successfully');
      setCancelModalOpen(false);
      await onRefresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Helper to calculate subtotal for selected order
  const calculateBillSubtotal = (order: any) => {
    return order.subtotal || order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  };

  // Scenario 1: Neither service charge nor GST enabled
  const SimpleBillModal = ({ order, subtotal }: { order: any; subtotal: number }) => (
    <div className="flex justify-between items-center border-t-2 border-indigo-600 pt-3 mt-3">
      <span className="text-base font-bold text-gray-900">Amount Payable</span>
      <span className="text-xl font-black text-indigo-600">₹{Math.round(order.totalAmount).toFixed(0)}</span>
    </div>
  );

  // Scenario 2: Service charge enabled, GST NOT enabled
  const ServiceChargeOnlyBillModal = ({ order, subtotal }: { order: any; subtotal: number }) => (
    <>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Service Charge</span>
        <span className="text-sm font-semibold text-gray-900">₹{(order.serviceChargeAmount || 0).toFixed(0)}</span>
      </div>
      <div className="flex justify-between items-center border-t-2 border-indigo-600 pt-3 mt-3">
        <span className="text-base font-bold text-gray-900">Amount Payable</span>
        <span className="text-xl font-black text-indigo-600">₹{Math.round(order.totalAmount).toFixed(0)}</span>
      </div>
    </>
  );

  // Scenario 3: GST enabled, Service charge NOT enabled
  const GSTOnlyBillModal = ({ order, subtotal }: { order: any; subtotal: number }) => {
    const taxAmount = order.totalAmount - subtotal;
    const grandTotal = order.grandTotal || (subtotal + (order.sgstAmount || 0) + (order.cgstAmount || 0) + (order.igstAmount || 0));
    
    return (
      <>
        <div className="flex justify-between items-center font-semibold">
          <span className="text-sm text-gray-700">Taxable Amount</span>
          <span className="text-sm font-semibold text-gray-900">₹{(order.taxableAmount || subtotal).toFixed(0)}</span>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 mt-3">
          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Tax Breakdown</h5>
          <div className="space-y-1">
            {(order.sgstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">SGST{order.items?.[0]?.sgstPercentage ? ` (${order.items[0].sgstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.sgstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.cgstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">CGST{order.items?.[0]?.cgstPercentage ? ` (${order.items[0].cgstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.cgstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.igstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">IGST{order.items?.[0]?.igstPercentage ? ` (${order.items[0].igstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.igstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.sgstAmount || 0) === 0 && (order.cgstAmount || 0) === 0 && (order.igstAmount || 0) === 0 && taxAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Tax</span>
                <span className="text-xs font-medium text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-sm font-semibold text-gray-900">₹{grandTotal.toFixed(2)}</span>
        </div>
        {(order.roundOff || 0) !== 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Round Off</span>
            <span className="text-gray-500">{(order.roundOff || 0) > 0 ? '+' : ''}₹{(order.roundOff || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Amount Payable</span>
            <span className="text-xl font-black text-indigo-600">₹{Math.round(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>
      </>
    );
  };

  // Scenario 4: Both service charge AND GST enabled
  const FullBillModal = ({ order, subtotal }: { order: any; subtotal: number }) => {
    const serviceCharge = order.serviceChargeAmount || 0;
    const taxableAmount = order.taxableAmount || (subtotal + serviceCharge);
    const taxAmount = order.totalAmount - subtotal - serviceCharge;
    const grandTotal = order.grandTotal || (taxableAmount + (order.sgstAmount || 0) + (order.cgstAmount || 0) + (order.igstAmount || 0));

    return (
      <>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Service Charge</span>
          <span className="text-sm font-semibold text-gray-900">₹{serviceCharge.toFixed(0)}</span>
        </div>
        <div className="flex justify-between items-center font-semibold">
          <span className="text-sm text-gray-700">Taxable Amount</span>
          <span className="text-sm font-semibold text-gray-900">₹{taxableAmount.toFixed(0)}</span>
        </div>
        <div className="bg-indigo-50 rounded-lg p-3 mt-3">
          <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">Tax Breakdown</h5>
          <div className="space-y-1">
            {(order.sgstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">SGST{order.items?.[0]?.sgstPercentage ? ` (${order.items[0].sgstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.sgstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.cgstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">CGST{order.items?.[0]?.cgstPercentage ? ` (${order.items[0].cgstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.cgstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.igstAmount || 0) > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">IGST{order.items?.[0]?.igstPercentage ? ` (${order.items[0].igstPercentage}%)` : ''}</span>
                <span className="text-xs font-medium text-gray-900">₹{(order.igstAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.sgstAmount || 0) === 0 && (order.cgstAmount || 0) === 0 && (order.igstAmount || 0) === 0 && taxAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Tax</span>
                <span className="text-xs font-medium text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-sm font-semibold text-gray-900">₹{grandTotal.toFixed(2)}</span>
        </div>
        {(order.roundOff || 0) !== 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Round Off</span>
            <span className="text-gray-500">{(order.roundOff || 0) > 0 ? '+' : ''}₹{(order.roundOff || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Amount Payable</span>
            <span className="text-xl font-black text-indigo-600">₹{Math.round(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>
      </>
    );
  };

  // Bill Totals component that decides which scenario to render
  const BillTotalsModal = ({ order }: { order: any }) => {
    const subtotal = calculateBillSubtotal(order);
    const hasServiceCharge = (order.serviceChargeAmount || 0) > 0;
    const hasTaxAmounts = (order.sgstAmount || 0) > 0 || (order.cgstAmount || 0) > 0 || (order.igstAmount || 0) > 0;
    const hasGSTFlag = order.gstEnabled;
    const hasTaxByAmount = order.totalAmount > (subtotal + (order.serviceChargeAmount || 0));
    const hasGST = hasTaxAmounts || hasGSTFlag || hasTaxByAmount;

    if (!hasServiceCharge && !hasGST) {
      return <SimpleBillModal order={order} subtotal={subtotal} />;
    }
    if (hasServiceCharge && !hasGST) {
      return <ServiceChargeOnlyBillModal order={order} subtotal={subtotal} />;
    }
    if (!hasServiceCharge && hasGST) {
      return <GSTOnlyBillModal order={order} subtotal={subtotal} />;
    }
    return <FullBillModal order={order} subtotal={subtotal} />;
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
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
                        {(order.status === 'ACCEPTED' || order.status === 'COMPLETED') && (
                          <button
                            onClick={() => {
                              setSelectedOrderForBill(order);
                              setBillModalOpen(true);
                            }}
                            className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm"
                            title="Print Bill"
                          >
                            <FaPrint className="w-4 h-4 text-slate-600" />
                          </button>
                        )}
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
                            width: order.status === 'PLACED' ? '12.5%' : 
                                   order.status === 'ACCEPTED' ? '37.5%' : 
                                   order.status === 'PREPARED' ? '62.5%' :
                                   order.status === 'COMPLETED' ? '100%' : '0%' 
                          }}
                        />
                      </div>
                      
                      {/* Steps */}
                      {[
                        { key: 'PLACED', label: 'Placed', icon: <FaClock /> },
                        { key: 'ACCEPTED', label: 'Cooking', icon: <FaUtensils /> },
                        { key: 'PREPARED', label: 'Ready', icon: <FaCheckCircle /> },
                        { key: 'COMPLETED', label: 'Delivered', icon: <FaCheckCircle /> }
                      ].map((step, idx) => {
                        const statusOrder = ['PLACED', 'ACCEPTED', 'PREPARED', 'COMPLETED'];
                        const currentIdx = statusOrder.indexOf(order.status || 'PLACED');
                        const isPast = currentIdx > idx;
                        const isCurrent = order.status === step.key;

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
                                const itemImg = item.itemId ? getItemImage(item.itemId) : null;
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
                    : order.paymentStatus === 'UNPAID'
                    ? 'bg-rose-50/50 border-rose-100/50'
                    : 'bg-amber-50/50 border-amber-100/50'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 ${
                          isOrderPaid(order) ? 'bg-white text-emerald-600 border border-emerald-100' : 
                          order.paymentStatus === 'UNPAID' ? 'bg-white text-rose-600 border border-rose-100' :
                          'bg-white text-amber-600 border border-amber-100'
                        }`}>
                          {order.paymentMethod === 'ONLINE' ? <FaCreditCard className="w-4 h-4" /> : <FaMoneyBillWave className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Payment Status</p>
                          <h4 className={`text-sm font-black flex items-center tracking-tight ${
                            isOrderPaid(order) ? 'text-emerald-700' : 
                            order.paymentStatus === 'UNPAID' ? 'text-rose-700' :
                            'text-amber-800'
                          }`}>
                            {isOrderPaid(order) ? (
                              <><FaCheckCircle className="mr-2 w-4 h-4" /> Fully Paid</>
            ) : (order.paymentVerificationRequestbycustomer?.applied || !!order.paymentVerificationRequestbycustomer?.appliedUTR) && !order.paymentVerificationRequestbycustomer?.adminAskedretry ? (
                              <div className="flex flex-col">
                                <span className="flex items-center"><FaClock className="mr-2 w-4 h-4 animate-pulse" /> Verification Pending</span>
                                <span className="text-[10px] font-mono text-slate-400 mt-1 ml-6 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg w-fit border border-slate-200/50">UTR: •••{order.paymentVerificationRequestbycustomer.appliedUTR?.slice(-3) || order.utr?.slice(-3) || '???' }</span>
                              </div>
                            ) : (order.paymentVerificationRequestbycustomer?.adminAskedretry || order.paymentStatus === 'RETRY') ? (
                              <div className="flex flex-col">
                                <span className="flex items-center text-rose-600"><FaExclamationTriangle className="mr-2 w-4 h-4 text-rose-500" /> Verification Failed</span>
                                <span className="text-[10px] font-mono text-rose-400 mt-1 ml-6 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-lg w-fit border border-rose-100/50">Last Failed: •••{order.paymentVerificationRequestbycustomer?.appliedUTR?.slice(-3) || order.utr?.slice(-3) || '???' }</span>
                              </div>
                            ) : order.paymentStatus === 'UNPAID' ? (
                              <><FaExclamationCircle className="mr-2 w-4 h-4 text-rose-500" /> Payment Due / Unpaid</>
                            ) : (
                              <><FaClock className="mr-1 w-3 h-3 animate-pulse" /> Awaiting Payment</>
                            )}
                          </h4>
                        </div>
                      </div>
                      
                      {!isOrderPaid(order) && 
                        order.status !== 'CANCELLED' && 
                        order.status !== 'REJECTED' && 
                        ['ACCEPTED', 'PREPARED', 'COMPLETED'].includes(order.status) && 
                        (!order.paymentVerificationRequestbycustomer?.applied && !order.paymentVerificationRequestbycustomer?.appliedUTR || order.paymentVerificationRequestbycustomer?.adminAskedretry) && (
                        <div className="flex-shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <button 
                              onClick={() => setOrderToVerifyId(order._id)}
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
                    {...registerCancel('reason')}
                    placeholder="Why are you cancelling? (Optional)"
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-50 focus:border-rose-200 text-sm font-medium resize-none shadow-inner"
                  />
                </div>
                
                <div className="flex gap-4">
                  <button type="button" onClick={() => setCancelModalOpen(false)} className="flex-1 py-4 glass text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 active:scale-95 transition-all">Keep It</button>
                  <button onClick={handleSubmitCancel(cancelOrder)} className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all">Cancel It</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Verification Modal */}
      <AnimatePresence>
        {orderToVerifyId && orderToVerify && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[150] flex items-center justify-center p-6"
            onClick={() => {
              setOrderToVerifyId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="glass-card rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border-white/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center justify-between relative z-10 mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Verify Payment</h2>
                    <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mt-1">Order #{orderToVerify.orderNumber || orderToVerify._id.slice(-6)}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setOrderToVerifyId(null);
                    }}                    className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                    <FaMoneyBillWave className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-4xl font-black tabular-nums">₹{orderToVerify.totalAmount.toFixed(0)}</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mt-1">Total Amount Payable</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-8">
                {(orderToVerify.paymentVerificationRequestbycustomer?.retrycount || 0) >= 3 ? (
                  <div className="space-y-6">
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 text-center">
                      <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                        <FaExclamationTriangle className="w-8 h-8 text-rose-500" />
                      </div>
                      <h3 className="text-xl font-black text-rose-900 mb-2 uppercase tracking-tight">Security Lock</h3>
                      <p className="text-xs font-bold text-rose-600 leading-relaxed mb-6">
                        Maximum verification attempts exceeded (3/3). Please visit the counter for manual settlement.
                      </p>
                      <div className="bg-white/80 rounded-2xl p-5 border border-rose-100 shadow-inner">
                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2">Visit Counter</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                          Our staff will assist you with Cash or UPI payments directly at the counter to clear your dues.
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
                      // Don't close modal here, let it sync state
                    }} 
                  />
                )}
              </div>
              
              <div className="px-8 pb-8">
                <button 
                  onClick={() => {
                    setOrderToVerifyId(null);
                  }}
                  className="w-full py-4 glass text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Close & Pay on Counter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Bill Modal */}
        <AnimatePresence>
          {billModalOpen && selectedOrderForBill && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setBillModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-[2rem] z-[101] shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Bill Details</h3>
                    <button
                      onClick={() => setBillModalOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FaTimes className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">Order #{selectedOrderForBill.orderNumber || selectedOrderForBill._id.slice(-6)}</span>
                      <span className="text-xs text-gray-500">{formatDate(selectedOrderForBill.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Table #{selectedOrderForBill.tableNumber}</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedOrderForBill.customerName}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Items</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                            <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
                            <th className="text-right py-2 font-semibold text-gray-700">Price</th>
                            <th className="text-right py-2 font-semibold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderForBill.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="py-2 text-gray-900">{item.name}</td>
                              <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-600">₹{item.price.toFixed(0)}</td>
                              <td className="py-2 text-right font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    {/* Common: Subtotal always shown first */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-semibold text-gray-900">₹{selectedOrderForBill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(0)}</span>
                    </div>

                    {/* Bill Details - 4 Scenarios */}
                    <BillTotalsModal order={selectedOrderForBill} />
                  </div>

                  {/* PAID Stamp - Show if payment is verified */}
                  {selectedOrderForBill.paymentStatus?.toUpperCase() === 'VERIFIED' && (
                    <div className="mt-4 flex justify-center">
                      <div className="border-2 border-emerald-500/20 rounded-full py-2 px-6 flex items-center gap-4 bg-emerald-50/50 shadow-lg shadow-emerald-100/20 transform rotate-[-0.5deg]">
                        <div className="flex items-center gap-2">
                          <FaCheckCircle className="text-emerald-600" />
                          <span className="text-sm font-black tracking-widest text-emerald-700 uppercase">PAID</span>
                        </div>
                        <div className="w-px h-4 bg-emerald-200"></div>
                        <span className="text-sm font-black text-slate-800 tabular-nums">₹{Math.round(selectedOrderForBill.totalAmount).toFixed(0)}</span>
                        <div className="w-px h-4 bg-emerald-200"></div>
                        <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">
                           {selectedOrderForBill.collectedVia === 'SPLIT' ? 'Split' : (selectedOrderForBill.collectedVia || 'Online')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Hidden PrintableBill for PDF generation */}
                  <div className="hidden">
                    <div ref={billRef}>
                      <PrintableBill
                        order={selectedOrderForBill}
                        restaurantName={session?.restaurantName || 'Restaurant'}
                        restaurantLogo={session?.logo || undefined}
                        isPaid={selectedOrderForBill.paymentStatus?.toUpperCase() === 'VERIFIED'}
                        gstEnabled={selectedOrderForBill.gstEnabled || false}
                        isThermalPrint={false}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleDownloadPDF}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FaDownload className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
  );
}

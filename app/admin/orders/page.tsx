'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaSearch,
  FaCalendarDay,
  FaTasks,
  FaHome,
  FaStar,
  FaComment,
  FaUsers,
  FaMoneyBillWave,
  FaTimes,
  FaUndo,
  FaCreditCard,
  FaUtensils,
  FaCheck,
  FaHashtag,
  FaExclamationCircle,
  FaEnvelope,
  FaPlus
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';
import { playNotificationSound } from '@/utils/notifications';
import { getTodayISTDateString } from '@/utils/date';
import Button from '@/components/ui/Button';
import OrderCard, { isOrderPaid, getPaymentStatusDisplay } from '@/components/ui/OrderCard';
import StatsCard from '@/components/ui/StatsCard';
import CreateOrderModal from '@/components/ui/CreateOrderModal';
import { Skeleton, StatsCardSkeleton, OrderCardSkeleton } from '@/components/ui/Skeleton';

interface Order {
  _id: string;
  orderNumber?: string;
  tableNumber: number;
  customerName: string;
  customerPhone?: string;
  numberOfPersons?: number;
  specialInstructions?: string;
  orderType?: 'dine-in' | 'takeaway' | 'delivery';
  deviceId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  status: 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled';
  paymentMethod?: 'cash' | 'online';
  paymentStatus: 'PENDING' | 'VERIFIED';
  refund: {
    status: 'none' | 'pending' | 'refunded';
    method?: 'cash' | 'online';
    amount?: number;
    processedAt?: string;
  };
  utrNumber?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt?: string;
  feedback?: {
    rating?: number;
    comment?: string;
    submittedAt?: string;
  };
  transactions?: any[];
}

type OrderStatus = 'all' | 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled';

interface RefundModalData {
  orderId: string;
  orderNumber?: string;
  tableNumber: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'online';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const { user } = useAuth();
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundModalData, setRefundModalData] = useState<RefundModalData | null>(null);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'online'>('cash');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      socketService.on('newOrder', (order: Order) => {
        toast.success(`New order from Table #${order.tableNumber}!`);
        playNotificationSound();
        // Removed fetchOrders() as newOrder is now followed by orderUpdate for state injection
      });

      socketService.on('orderCancelled', (order: Order) => {
        toast.error(`Order from Table #${order.tableNumber} was cancelled`);
        playNotificationSound();
        // State update handled by orderUpdate
      });

      socketService.on('orderUpdate', (updatedOrder: Order) => {
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === updatedOrder._id);
          if (index !== -1) {
            // Update existing order
            const newOrders = [...prevOrders];
            newOrders[index] = updatedOrder;
            return newOrders;
          }
          // Insert new order at beginning
          return [updatedOrder, ...prevOrders];
        });
        
        // Also update selected order if it's the one being viewed
        if (selectedOrder?._id === updatedOrder._id) {
          setSelectedOrder(updatedOrder);
        }
      });

      return () => {
        socketService.off('newOrder');
        socketService.off('orderCancelled');
        socketService.off('orderUpdate');
      };
    }
  }, [user?._id]);

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    const loadingToast = toast.loading('Generating and sending your monthly report...');
    try {
      const response = await api.post('/order/report/email');
      if (response.data.success) {
        toast.success(response.data.message || 'Report sent successfully to your mail!', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Failed to send report email:', error);
      toast.error(error.response?.data?.message || 'Failed to send report. Please try again.', { id: loadingToast });
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, selectedDate, activeTab]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      // Only append date if activeTab is 'today', otherwise send current month/year
      if (activeTab === 'today') {
        params.append('date', selectedDate);
      } else {
        const now = new Date();
        params.append('month', (now.getMonth() + 1).toString());
        params.append('year', now.getFullYear().toString());
      }

      const response = await api.get(`/order?${params.toString()}`);
      setOrders(response.data.data || []);
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await api.put(`/order/${orderId}/status`, { status });
      const statusMessages: Record<string, string> = {
        placed: 'Order placed and pending',
        preparing: 'Order is now being prepared',
        served: 'Order has been served'
      };
      toast.success(statusMessages[status] || `Order ${status}`);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const verifyOnlinePayment = async () => {
    if (!selectedOrderForVerify) {
      toast.error('No order selected for verification');
      return;
    }
    setIsVerifying(true);
    try {
      const response = await api.put(`/order/${selectedOrderForVerify._id}/verify-payment`, { utrNumber: utrInput });
      toast.success('Payment verified successfully');
      setVerifyModalOpen(false);
      setUtrInput('');

      if (selectedOrder?._id === selectedOrderForVerify._id) {
        setSelectedOrder(response.data.data);
      }

      setSelectedOrderForVerify(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const markCashCollected = async (orderId: string) => {
    try {
      const response = await api.put(`/order/${orderId}/collect-cash`);
      toast.success('Cash marked as collected');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark cash collected');
    }
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    try {
      const response = await api.put(`/order/${orderId}/reject`, { reason });
      toast.success('Order rejected');
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(response.data.data);
      }
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    }
  };

  const handleRefundClick = (order: Order) => {
    if (!isOrderPaid(order)) {
      toast.error('Order was not paid, no refund needed');
      return;
    }
    if (order.refund?.status === 'refunded') {
      toast.error('This order has already been refunded');
      return;
    }
    setRefundModalData({
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod || 'cash'
    });
    setRefundMethod(order.paymentMethod || 'cash');
    setRefundAmount(order.totalAmount.toFixed(2));
    setRefundModalOpen(true);
  };

  const processRefund = async () => {
    if (!refundModalData) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > refundModalData.totalAmount) {
      toast.error('Invalid refund amount');
      return;
    }

    setIsProcessingRefund(true);
    try {
      await api.post(`/order/${refundModalData.orderId}/refund`, {
        refundMethod,
        refundAmount: amount
      });
      toast.success(`Refund of ₹${amount.toFixed(2)} processed successfully`);
      setRefundModalOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      placed: 'bg-amber-100 text-amber-700 border-amber-200',
      preparing: 'bg-blue-100 text-blue-700 border-blue-200',
      served: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter((o: Order) => o.status === orderFilter);

  const orderCounts = {
    totalOrders: orders.length,
    placed: orders.filter((o: Order) => o.status === 'placed').length,
    preparing: orders.filter((o: Order) => o.status === 'preparing').length,
    served: orders.filter((o: Order) => o.status === 'served').length,
    rejected: orders.filter((o: Order) => o.status === 'rejected').length,
    cancelled: orders.filter((o: Order) => o.status === 'cancelled').length,
  };

  const refundStats = {
    pending: orders.filter((o: Order) => 
      (o.status === 'cancelled' || o.status === 'rejected') && 
      o.paymentStatus === 'VERIFIED' && 
      o.refund?.status === 'pending'
    ).length,
    refunded: orders.filter((o: Order) => 
      (o.status === 'cancelled' || o.status === 'rejected') && 
      o.paymentStatus === 'VERIFIED' && 
      o.refund?.status === 'refunded'
    ).length,
  };

  const paymentStats = stats || {
    totalRevenue: orders
      .filter(o => 
        o.paymentStatus === 'VERIFIED' && 
        o.refund?.status !== 'refunded' &&
        o.status !== 'cancelled' && 
        o.status !== 'rejected'
      )
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    onlinePending: 0,
    cashPending: 0,
    totalRefunds: 0,
    totalRefundAmount: 0,
    cashGross: 0,
    cashRefunded: 0,
    onlineGross: 0,
    onlineRefunded: 0
  };

  // Remove full-page blocking loader

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Tabs & Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders & Payments</h1>
            <p className="text-sm text-gray-500 mt-1">Manage real-time orders and verify payments</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('today')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'today'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                All Orders
              </button>
            </div>

            <Button
              variant="primary"
              onClick={() => setCreateOrderModalOpen(true)}
              className="!py-2.5 !px-5 !rounded-xl shadow-sm hover:shadow-md"
              leftIcon={<FaPlus className="text-white" />}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Create Counter Order</span>
            </Button>

            <Button
              variant="secondary"
              onClick={handleSendEmail}
              isLoading={isSendingEmail}
              className="!py-2.5 !px-5 !rounded-xl shadow-sm hover:shadow-md border border-gray-100"
              leftIcon={<FaEnvelope className="text-indigo-500" />}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Send Order Report to Mail</span>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {isLoading ? (
            Array(7).fill(0).map((_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            <>
              <StatsCard 
                label="Total" 
                value={orders.length} 
                variant="indigo" 
                icon={<FaClipboardList />} 
                description={activeTab === 'today' ? "Today's" : "All-time"} 
              />
              <StatsCard 
                label="Cancelled" 
                value={orderCounts.cancelled} 
                variant="red" 
                icon={<FaTimes />} 
              />
              <StatsCard 
                label="Rejected" 
                value={orderCounts.rejected} 
                variant="amber" 
                icon={<FaExclamationCircle />} 
              />
              <StatsCard 
                label="Refund Pending" 
                value={refundStats.pending} 
                variant="purple" 
                icon={<FaUndo />} 
                description="Requires action"
              />
              <StatsCard 
                label="Online" 
                value={paymentStats.onlinePending} 
                variant="blue" 
                icon={<FaCreditCard />} 
                description="Verification pending"
              />
              <StatsCard 
                label="Cash" 
                value={paymentStats.cashPending} 
                variant="amber" 
                icon={<FaMoneyBillWave />} 
                description="Collection pending"
              />
              <StatsCard 
                label="Revenue" 
                value={`₹${paymentStats.totalRevenue.toFixed(0)}`} 
                variant="green" 
                icon={<FaCheckCircle />} 
                description={activeTab === 'today' ? 'From today' : 'From all'}
              />
            </>
          )}
        </div>

        {/* Financial Summaries (Cash vs Online) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Cash Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-amber-50/50 px-4 py-3 border-b border-amber-100/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Cash Summary</h3>
              </div>
              <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest">{activeTab === 'today' ? 'Today' : 'This Month'}</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Gross Received</p>
                <p className="text-base font-black text-gray-900">₹{paymentStats.cashGross.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Refunded</p>
                <p className="text-base font-black text-red-600">₹{paymentStats.cashRefunded.toFixed(0)}</p>
              </div>
              <div className="bg-amber-50/30 p-2 rounded-xl border border-amber-100/30">
                <p className="text-[9px] font-black text-amber-600 uppercase mb-1 tracking-tighter">Net Cash</p>
                <p className="text-lg font-black text-amber-700">₹{(paymentStats.cashGross - paymentStats.cashRefunded).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Online Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaCreditCard className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Online Summary</h3>
              </div>
              <span className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest">{activeTab === 'today' ? 'Today' : 'This Month'}</span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Gross Received</p>
                <p className="text-base font-black text-gray-900">₹{paymentStats.onlineGross.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Refunded</p>
                <p className="text-base font-black text-red-600">₹{paymentStats.onlineRefunded.toFixed(0)}</p>
              </div>
              <div className="bg-blue-50/30 p-2 rounded-xl border border-blue-100/30">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-1 tracking-tighter">Net Online</p>
                <p className="text-lg font-black text-blue-700">₹{(paymentStats.onlineGross - paymentStats.onlineRefunded).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative w-full md:w-64 lg:w-72 shrink-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm shadow-sm transition-all placeholder:text-gray-400 font-medium"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center bg-gray-100/80 border border-gray-200/50 rounded-2xl p-1.5 shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
            {(['all', 'placed', 'preparing', 'served', 'rejected', 'cancelled'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all duration-300 uppercase tracking-widest flex items-center space-x-2.5 ${orderFilter === status
                  ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-100 scale-[1.02] border border-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'
                  }`}
              >
                <span>{status}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${orderFilter === status ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200/50 text-gray-400'}`}>
                  {status === 'all' ? orderCounts.totalOrders : (orderCounts as any)[status] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="w-full md:w-auto flex items-center space-x-3 bg-white border border-gray-100/50 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all group shrink-0">
            <FaCalendarDay className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`}
              max={new Date().toISOString().split('T')[0]}
              className="border-none focus:ring-0 p-0 text-xs font-black text-gray-700 uppercase tracking-widest bg-transparent cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 no-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-20 text-center"
            >
              <FaClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No orders found</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className={`grid gap-4 pb-10 ${activeTab === 'today'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                }`}
            >
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order as any}
                  variant="today"
                  onUpdateStatus={updateOrderStatus}
                  onVerifyPayment={(o) => {
                    setSelectedOrderForVerify(o as any);
                    setVerifyModalOpen(true);
                  }}
                  onCollectCash={markCashCollected}
                  onRefund={(o) => handleRefundClick(o as any)}
                  onReject={(id) => rejectOrder(id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Verify Payment Modal */}
      <AnimatePresence>
        {
          verifyModalOpen && selectedOrderForVerify && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => !isVerifying && setVerifyModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Verify Online Payment
                    </h2>
                  </div>
                  <button
                    onClick={() => !isVerifying && setVerifyModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Order</p>
                      <p className="text-lg font-bold text-gray-900">#{selectedOrderForVerify.orderNumber || selectedOrderForVerify._id.slice(-6)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Table</p>
                      <p className="text-lg font-bold text-gray-900">#{selectedOrderForVerify.tableNumber}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-xs text-indigo-600 font-medium">Amount to Verify</p>
                    <p className="text-2xl font-bold text-indigo-700">₹{selectedOrderForVerify.totalAmount.toFixed(2)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last 6 digits of UTR Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter last 6 digits"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-widest font-mono text-xl font-bold"
                    />
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Customer provided UTR: <span className="font-mono font-bold text-gray-700">{selectedOrderForVerify.utrNumber || 'None'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setVerifyModalOpen(false)}
                      disabled={isVerifying}
                      className="w-full sm:flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors order-2 sm:order-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={verifyOnlinePayment}
                      disabled={isVerifying}
                      className="w-full sm:flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-200 order-1 sm:order-2"
                    >
                      {isVerifying ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="w-4 h-4" />
                          <span>Verify Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Refund Modal */}
      <AnimatePresence>
        {
          refundModalOpen && refundModalData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => !isProcessingRefund && setRefundModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-purple-600 px-6 py-4 flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <FaMoneyBillWave className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Process Refund</h2>
                  </div>
                  <button
                    onClick={() => !isProcessingRefund && setRefundModalOpen(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Table</span>
                      <span className="font-semibold text-gray-900">#{refundModalData.tableNumber}</span>
                    </div>
                    {refundModalData.orderNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Order #</span>
                        <span className="font-semibold text-gray-900">{refundModalData.orderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Amount</span>
                      <span className="font-semibold text-gray-900">₹{refundModalData.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Payment</span>
                      <span className="font-semibold text-gray-900 capitalize">{refundModalData.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Refund Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={refundModalData.totalAmount}
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum refund: ₹{refundModalData.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* Refund Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setRefundMethod('cash')}
                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${refundMethod === 'cash'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                      >
                        <span className="font-medium">Cash</span>
                      </button>
                      <button
                        onClick={() => setRefundMethod('online')}
                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${refundMethod === 'online'
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                      >
                        <span className="font-medium">Online</span>
                      </button>
                    </div>
                    {refundMethod === 'online' && (
                      <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded-lg">
                        Online refunds require UPI/Account details from customer
                      </p>
                    )}
                  </div>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <p className="text-sm text-amber-800">
                      This action will mark the order as refunded. Please ensure you have processed the actual refund to the customer.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setRefundModalOpen(false)}
                    disabled={isProcessingRefund}
                    className="w-full sm:flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processRefund}
                    disabled={isProcessingRefund}
                    className="w-full sm:flex-1 px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 order-1 sm:order-2"
                  >
                    {isProcessingRefund ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FaUndo className="w-4 h-4" />
                        <span>Confirm Refund</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        onOrderCreated={() => {
          fetchOrders();
          setCreateOrderModalOpen(false);
        }}
      />
    </div >
  );
}

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
  status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentMethod?: 'ONLINE' | 'COUNTER';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
  paymentDueStatus?: 'CLEAR' | 'DUE';
  collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED';
  refund: {
    status: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED';
    method?: string;
    amount?: number;
    processedAt?: string;
  };
  utr?: string;
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

type OrderStatus = 'all' | 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const { user } = useAuth();
  
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<{ id: string; type: string } | null>(null);
  const [actionPayload, setActionPayload] = useState<any>({});
  
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      const handleNewOrder = (order: Order) => {
        toast.success(`New order from Table #${order.tableNumber}!`);
        playNotificationSound();
      };

      const handleOrderCancelled = (order: Order) => {
        toast.error(`Order from Table #${order.tableNumber} was cancelled`);
        playNotificationSound();
      };

      const handleOrderRejected = (order: Order) => {
        toast.error(`Order from Table #${order.tableNumber} was rejected`);
        playNotificationSound();
      };

      const handlePaymentVerified = (order: Order) => {
        toast.success(`Payment verified for order #${order.orderNumber || order._id.slice(-8)}!`);
        playNotificationSound();
      };

      const handleOrderUpdate = (updatedOrder: Order) => {
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === updatedOrder._id);
          if (index !== -1) {
            const newOrders = [...prevOrders];
            newOrders[index] = updatedOrder;
            return newOrders;
          }
          return [updatedOrder, ...prevOrders];
        });
      };

      socketService.on('newOrder', handleNewOrder);
      socketService.on('orderCancelled', handleOrderCancelled);
      socketService.on('orderRejected', handleOrderRejected);
      socketService.on('paymentVerified', handlePaymentVerified);
      socketService.on('orderUpdate', handleOrderUpdate);

      return () => {
        socketService.off('newOrder', handleNewOrder);
        socketService.off('orderCancelled', handleOrderCancelled);
        socketService.off('orderRejected', handleOrderRejected);
        socketService.off('paymentVerified', handlePaymentVerified);
        socketService.off('orderUpdate', handleOrderUpdate);
      };
    }
  }, [user?._id]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeTab === 'today') {
        params.append('date', selectedDate);
      } else {
        const now = new Date();
        params.append('month', (now.getMonth() + 1).toString());
        params.append('year', now.getFullYear().toString());
      }

      const response = await api.get(`/order?${params.toString()}`);
      setOrders(response.data.data || []);
      if (response.data.stats) setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, selectedDate, activeTab]);

  const handleAction = async (orderId: string, action: string, payload: any = {}) => {
    if (action === 'VERIFY_PAYMENT' && !payload.confirmed) {
      const order = orders.find(o => o._id === orderId);
      setCurrentAction({ id: orderId, type: 'VERIFY_PAYMENT' });
      setActionPayload({ utr: order?.utr || '' });
      setActionModalOpen(true);
      return;
    }

    if (action === 'COLLECT_PAYMENT' && !payload.confirmed) {
      setCurrentAction({ id: orderId, type: 'COLLECT_PAYMENT' });
      setActionPayload({ method: 'CASH', utr: '' });
      setActionModalOpen(true);
      return;
    }

    if (action === 'REJECT_ORDER' && !payload.confirmed) {
      setCurrentAction({ id: orderId, type: 'REJECT_ORDER' });
      setActionPayload({ reason: '' });
      setActionModalOpen(true);
      return;
    }

    try {
      const response = await api.post(`/order/${orderId}/action`, { action, payload });
      toast.success(response.data.message || 'Action completed');
      fetchOrders();
      setActionModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete action');
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    const loadingToast = toast.loading('Sending report...');
    try {
      const response = await api.post('/ledger/exportreporttomail');
      toast.success(response.data.message || 'Report sent successfully!', { id: loadingToast });
    } catch (error: any) {
      toast.error('Failed to send report.', { id: loadingToast });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter((o: Order) => o.status === orderFilter);

  const orderCounts = {
    totalOrders: orders.length,
    PLACED: orders.filter((o: Order) => o.status === 'PLACED').length,
    ACCEPTED: orders.filter((o: Order) => o.status === 'ACCEPTED').length,
    COMPLETED: orders.filter((o: Order) => o.status === 'COMPLETED').length,
    REJECTED: orders.filter((o: Order) => o.status === 'REJECTED').length,
    CANCELLED: orders.filter((o: Order) => o.status === 'CANCELLED').length,
  };

  const refundStats = {
    pending: orders.filter((o: Order) => o.refund?.status === 'PENDING').length,
  };

  const paymentStats = stats || {
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'VERIFIED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    onlinePending: orders.filter(o => o.paymentMethod === 'ONLINE' && o.paymentStatus === 'PENDING').length,
    counterPending: orders.filter(o => o.paymentMethod === 'COUNTER' && o.paymentStatus === 'PENDING' && o.status !== 'COMPLETED').length,
    duesPending: orders.filter(o => o.paymentDueStatus === 'DUE' && o.paymentStatus === 'PENDING').length,
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Orders & Analytics</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Growth • Integrity • Operations</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
              {(['today', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <Button variant="primary" onClick={() => setCreateOrderModalOpen(true)} className="!py-1.5 !px-3.5" leftIcon={<FaPlus className="text-white text-[10px]" />}>
              <span className="text-[9px] font-black uppercase tracking-widest">Add Order</span>
            </Button>

            <Button variant="outline" onClick={handleSendEmail} isLoading={isSendingEmail} className="!py-1.5 !px-3.5 border-gray-200" leftIcon={<FaEnvelope className="text-indigo-500 text-[10px]" />}>
              <span className="text-[9px] font-black uppercase tracking-widest">Email Report</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Pending Actions Section - Needs immediate attention */}
          <div className="flex-1 bg-red-50/20 border border-red-100/50 rounded-2xl p-3">
            <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center px-1">
              <FaExclamationCircle className="mr-2" /> Pending Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <StatsCard isMini label="Online" value={paymentStats.onlinePending || 0} variant="blue" icon={<FaCreditCard />} />
              <StatsCard isMini label="Refunds" value={refundStats.pending} variant="purple" icon={<FaUndo />} />
              <StatsCard isMini label="Counter" value={paymentStats.counterPending || 0} variant="amber" icon={<FaMoneyBillWave />} />
              <StatsCard isMini label="Dues" value={paymentStats.duesPending || 0} variant="red" icon={<FaExclamationCircle />} />
            </div>
          </div>

          {/* Overview Section - Business Health */}
          <div className="flex-[2] bg-gray-50/50 border border-gray-100 rounded-2xl p-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center px-1">
              Business Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <StatsCard isMini label="Revenue" value={`₹${paymentStats.totalRevenue.toFixed(0)}`} variant="green" icon={<FaCheckCircle />} />
              <StatsCard isMini label="Total" value={orderCounts.totalOrders} variant="indigo" icon={<FaClipboardList />} />
              <StatsCard isMini label="Served" value={orderCounts.COMPLETED} variant="emerald" icon={<FaCheck />} />
              <StatsCard isMini label="Cancelled" value={orderCounts.CANCELLED} variant="red" icon={<FaTimes />} />
              <StatsCard isMini label="Rejected" value={orderCounts.REJECTED} variant="amber" icon={<FaExclamationCircle />} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full md:w-56 lg:w-60 shrink-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] focus:ring-2 focus:ring-indigo-50"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center bg-gray-100/80 border border-gray-200/50 rounded-2xl p-1.5 shadow-inner overflow-x-auto no-scrollbar">
            {(['all', 'PLACED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all uppercase tracking-widest flex items-center space-x-2.5 ${orderFilter === status ? 'bg-white text-indigo-600 shadow-sm border border-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <span>{status}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${orderFilter === status ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-200/50 text-gray-400'}`}>
                  {status === 'all' ? orderCounts.totalOrders : (orderCounts as any)[status] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-2 no-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center">
              <FaClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No orders found</p>
            </div>
          ) : (
            <motion.div layout className={`grid gap-4 pb-10 ${activeTab === 'today' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
              {filteredOrders.map((order) => (
                <OrderCard
                   key={order._id}
                   order={order as any}
                   onAction={handleAction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {actionModalOpen && currentAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
               <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
                  <h3 className="text-lg font-black text-indigo-900 uppercase tracking-tight">
                    {currentAction.type.replace('_', ' ')}
                  </h3>
                  <button onClick={() => setActionModalOpen(false)}><FaTimes className="text-gray-400 hover:text-gray-600" /></button>
               </div>

               <div className="p-6 space-y-5">
                  {currentAction.type === 'VERIFY_PAYMENT' && (
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2">Confirm Last 6 digits of UTR</label>
                        <input
                          autoFocus
                          type="text"
                          maxLength={6}
                          value={actionPayload.utr}
                          onChange={(e) => setActionPayload({ ...actionPayload, utr: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-4 py-4 border border-gray-200 rounded-2xl text-center text-2xl font-black font-mono tracking-widest focus:ring-4 focus:ring-indigo-50"
                          placeholder="000000"
                        />
                    </div>
                  )}

                  {currentAction.type === 'COLLECT_PAYMENT' && (
                    <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-2">Collection Method</label>
                          <div className="grid grid-cols-2 gap-3">
                              {['CASH', 'ONLINE'].map(m => (
                                <button
                                  key={m}
                                  onClick={() => setActionPayload({ ...actionPayload, method: m })}
                                  className={`py-3 rounded-xl border-2 font-black transition-all ${actionPayload.method === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-300'}`}
                                >
                                  {m}
                                </button>
                              ))}
                          </div>
                        </div>
                        {actionPayload.method === 'ONLINE' && (
                           <div>
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Last 6 digits of UTR (Optional)</label>
                              <input
                                type="text"
                                maxLength={6}
                                value={actionPayload.utr}
                                onChange={(e) => setActionPayload({ ...actionPayload, utr: e.target.value.replace(/\D/g, '') })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center font-mono font-bold tracking-widest focus:ring-4 focus:ring-indigo-50"
                              />
                           </div>
                        )}
                    </div>
                  )}

                  {currentAction.type === 'REJECT_ORDER' && (
                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase mb-2">Rejection Reason</label>
                       <textarea
                          rows={3}
                          value={actionPayload.reason}
                          onChange={(e) => setActionPayload({ ...actionPayload, reason: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-red-50"
                          placeholder="e.g. Items out of stock"
                       />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button fullWidth variant="outline" onClick={() => setActionModalOpen(false)}>Cancel</Button>
                    <Button fullWidth onClick={() => handleAction(currentAction.id, currentAction.type, { ...actionPayload, confirmed: true })}>
                       Confirm Action
                    </Button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateOrderModal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        onOrderCreated={() => {
          fetchOrders();
          setCreateOrderModalOpen(false);
        }}
      />
    </div>
  );
}

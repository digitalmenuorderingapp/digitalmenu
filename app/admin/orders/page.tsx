'use client';

import { useEffect, useState, useRef } from 'react';
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
import { playNewOrderSound, playPaymentVerifiedSound, playCancelledSound } from '@/utils/notifications';
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
  adminId?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  status: 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  paymentMethod?: 'ONLINE' | 'CASH';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'RETRY' | 'UNPAID';
  paymentDueStatus?: 'CLEAR' | 'DUE';
  collectedVia?: 'CASH' | 'ONLINE' | 'NOT_COLLECTED';
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

type OrderStatus = 'all' | 'PLACED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'DUES';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const { user } = useAuth();
  
  
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const fetchOrdersRef = useRef<() => Promise<void>>();
  // Track orders received via socket to ensure they persist after fetch
  const socketOrdersRef = useRef<Map<string, Order>>(new Map());

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      const handleNewOrder = (order: Order) => {
        // Only process orders for this admin
        if (order.deviceId !== user._id && order.adminId !== user._id) return;
        
        toast.success(`New order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber}!`);
        playNewOrderSound();
        
        // Store in socket orders ref to ensure it persists after fetch
        socketOrdersRef.current.set(order._id, order);
        
        // Add new order to the top of the list immediately for better UX
        setOrders(prevOrders => {
          // Check if order already exists
          if (prevOrders.find(o => o._id === order._id)) {
            return prevOrders;
          }
          // Add new order at the top
          return [order, ...prevOrders];
        });
        
        // Refresh to get complete data - fetchOrders will merge socket orders
        fetchOrdersRef.current?.();
      };

      const handleOrderCancelled = (order: Order) => {
        // Only process orders for this admin
        if (order.deviceId !== user._id && order.adminId !== user._id) return;
        toast.error(`Order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber} was cancelled`);
        playCancelledSound();
        // Remove from socket orders ref
        socketOrdersRef.current.delete(order._id);
        fetchOrdersRef.current?.();
      };

      const handleOrderRejected = (order: Order) => {
        // Only process orders for this admin
        if (order.deviceId !== user._id && order.adminId !== user._id) return;
        toast.error(`Order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber} was rejected`);
        playCancelledSound();
        // Remove from socket orders ref
        socketOrdersRef.current.delete(order._id);
        fetchOrdersRef.current?.();
      };

      const handlePaymentVerified = (order: Order) => {
        // Only process orders for this admin
        if (order.deviceId !== user._id && order.adminId !== user._id) return;
        toast.success(`Payment verified for order #${order.orderNumber || order._id.slice(-8)}!`);
        playPaymentVerifiedSound();
        fetchOrdersRef.current?.();
      };

      const handleOrderUpdate = (updatedOrder: Order) => {
        // Only process orders for this admin
        if (updatedOrder.deviceId !== user._id && updatedOrder.adminId !== user._id) return;
        
        // Update in socket orders ref if exists
        if (socketOrdersRef.current.has(updatedOrder._id)) {
          socketOrdersRef.current.set(updatedOrder._id, updatedOrder);
        }
        
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === updatedOrder._id);
          if (index !== -1) {
            // Update existing order in place
            const newOrders = [...prevOrders];
            newOrders[index] = updatedOrder;
            return newOrders;
          }
          // If order not in list, add it at the top (new order via update)
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
      const fetchedOrders = response.data.data || [];
      
      // Merge any socket-received orders that might be missing from API response
      // (e.g., due to timing or date filtering issues)
      const fetchedIds = new Set(fetchedOrders.map((o: Order) => o._id));
      const missingSocketOrders = Array.from(socketOrdersRef.current.values())
        .filter(o => !fetchedIds.has(o._id));
      
      // Clean up socketOrdersRef for orders that are now in the fetched list
      fetchedOrders.forEach((o: Order) => socketOrdersRef.current.delete(o._id));
      
      // Combine: socket orders first (they're newer), then fetched orders
      setOrders(missingSocketOrders.length > 0 
        ? [...missingSocketOrders, ...fetchedOrders] 
        : fetchedOrders);
      
      if (response.data.stats) setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep the ref updated with the latest fetchOrders function
  fetchOrdersRef.current = fetchOrders;

  useEffect(() => {
    fetchOrders();
  }, [searchQuery, selectedDate, activeTab]);

  const handleAction = async (orderId: string, action: string, payload: any = {}) => {
    try {
      const finalAction = payload?.actionOverride || action;
      const response = await api.post(`/order/${orderId}/action`, { action: finalAction, payload });
      toast.success(response.data.message || 'Action completed');
      fetchOrders();
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
    : orderFilter === 'DUES'
      ? orders.filter((o: Order) => o.paymentDueStatus === 'DUE')
      : orders.filter((o: Order) => o.status?.toUpperCase() === orderFilter);

  const orderCounts = {
    totalOrders: orders.length,
    PLACED: orders.filter((o: Order) => o.status?.toUpperCase() === 'PLACED').length,
    ACCEPTED: orders.filter((o: Order) => o.status?.toUpperCase() === 'ACCEPTED').length,
    COMPLETED: orders.filter((o: Order) => o.status?.toUpperCase() === 'COMPLETED').length,
    REJECTED: orders.filter((o: Order) => o.status?.toUpperCase() === 'REJECTED').length,
    CANCELLED: orders.filter((o: Order) => o.status?.toUpperCase() === 'CANCELLED').length,
    DUES: orders.filter((o: Order) => o.paymentDueStatus === 'DUE').length,
  };


  const paymentStats = {
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'VERIFIED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    // Serving = ACCEPTED status (orders being prepared/served)
    servingPending: orders.filter(o => o.status === 'ACCEPTED').length,
    // Online = ONLINE payment method + PENDING payment status
    onlinePending: orders.filter(o => 
      o.paymentMethod === 'ONLINE' && 
      o.paymentStatus === 'PENDING' && 
      o.status !== 'CANCELLED' && 
      o.status !== 'REJECTED'
    ).length,
    onlinePendingAmount: orders
      .filter(o => o.paymentMethod === 'ONLINE' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    // Cash = CASH payment method + PENDING payment status  
    cashPending: orders.filter(o => 
      o.paymentMethod === 'CASH' && 
      o.paymentStatus === 'PENDING' && 
      o.status !== 'CANCELLED' && 
      o.status !== 'REJECTED'
    ).length,
    cashPendingAmount: orders
      .filter(o => o.paymentMethod === 'CASH' && o.paymentStatus === 'PENDING' && o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    // Dues
    duesPending: orders.filter(o => o.paymentDueStatus === 'DUE').length,
    unpaidDuesAmount: orders.filter(o => o.paymentDueStatus === 'DUE').reduce((s, o) => s + (o.totalAmount || 0), 0),
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
              <StatsCard isMini label="Serving" value={paymentStats.servingPending || 0} variant="indigo" icon={<FaUtensils />} />
              <StatsCard isMini label="Online" value={paymentStats.onlinePending || 0} variant="blue" icon={<FaCreditCard />} />
              <StatsCard isMini label="Cash" value={paymentStats.cashPending || 0} variant="amber" icon={<FaMoneyBillWave />} />
              <StatsCard isMini label="Dues" value={paymentStats.duesPending || 0} variant="red" icon={<FaExclamationCircle />} />
            </div>
          </div>

          {/* Overview Section - Business Health */}
          <div className="flex-[1.6] bg-gray-50/50 border border-gray-100 rounded-2xl p-3">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center px-1">
              Business Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
              <StatsCard isMini label="Revenue" value={`₹${paymentStats.totalRevenue.toFixed(0)}`} variant="green" icon={<FaCheckCircle />} />
              <StatsCard isMini label="Dues Amount" value={`₹${Math.round(paymentStats.unpaidDuesAmount || 0)}`} variant="red" icon={<FaExclamationCircle />} />
              <StatsCard isMini label="Total" value={orderCounts.totalOrders} variant="indigo" icon={<FaClipboardList />} />
              <StatsCard isMini label="Served" value={orderCounts.COMPLETED} variant="emerald" icon={<FaCheck />} />
              <StatsCard isMini label="Rejected" value={orderCounts.REJECTED} variant="red" icon={<FaTimes />} />
              <StatsCard isMini label="Cancelled" value={orderCounts.CANCELLED} variant="red" icon={<FaTimes />} />
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
            {(['all', 'PLACED', 'ACCEPTED', 'COMPLETED', 'DUES', 'REJECTED', 'CANCELLED'] as OrderStatus[]).map((status) => (
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`grid gap-4 pb-10 ${activeTab === 'today' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
              {filteredOrders.map((order) => (
                <OrderCard
                   key={`${order._id}-${order.updatedAt || order._id}`}
                   order={order as any}
                   onAction={handleAction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

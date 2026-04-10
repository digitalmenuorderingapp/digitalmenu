'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/services/swr';
import { socketService } from '@/services/socket';
import { playNewOrderSound, playPaymentVerifiedSound, playCancelledSound, initAudioContext } from '@/utils/notifications';
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
  restaurant?: string;
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
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  // Build SWR key based on query parameters
  const swrKey = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (activeTab === 'today') {
      params.append('date', selectedDate);
    } else {
      const now = new Date();
      params.append('month', (now.getMonth() + 1).toString());
      params.append('year', now.getFullYear().toString());
    }
    return `/order?${params.toString()}`;
  }, [searchQuery, selectedDate, activeTab]);

  // SWR hook for fetching orders
  const { data, error, isLoading, mutate: mutateOrders } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  });

  const orders = data?.data || [];
  const stats = data?.stats || null;

  // Function to refresh orders data (used by socket handlers)
  const refreshOrders = useCallback(() => {
    mutateOrders();
  }, [mutateOrders]);

  // Track processed socket events to prevent duplicate toasts
  const processedEventsRef = useRef<Map<string, number>>(new Map());

  // Helper to check if event was already processed (deduplication window: 5 seconds)
  const isDuplicateEvent = (eventKey: string): boolean => {
    const now = Date.now();
    const lastProcessed = processedEventsRef.current.get(eventKey);
    
    // Clean up old entries (older than 10 seconds)
    processedEventsRef.current.forEach((timestamp, key) => {
      if (now - timestamp > 10000) {
        processedEventsRef.current.delete(key);
      }
    });
    
    if (lastProcessed && (now - lastProcessed < 5000)) {
      console.log('[Socket] Duplicate event ignored:', eventKey);
      return true;
    }
    
    processedEventsRef.current.set(eventKey, now);
    return false;
  };

  useEffect(() => {
    if (user?._id) {
      const userIdStr = user._id.toString();
      console.log('[Socket] Connecting and joining room:', userIdStr);
      socketService.connect();
      socketService.join(userIdStr);

      const handleNewOrder = (order: Order) => {
        // Only process orders for this admin - check restaurant field matches user._id
        const isForThisAdmin = order.restaurant?.toString() === userIdStr || order.adminId?.toString() === userIdStr || order.deviceId === userIdStr;
        if (!isForThisAdmin) {
          console.log('[Socket] Order not for this admin. Order restaurant:', order.restaurant, 'User ID:', userIdStr);
          return;
        }
        
        // Deduplication check
        const eventKey = `newOrder-${order._id}`;
        if (isDuplicateEvent(eventKey)) return;
        
        console.log('[Socket] New order received:', order.orderNumber || order._id);
        toast.success(`New order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber}!`);
        playNewOrderSound();
        
        // Optimistically update the orders list
        mutateOrders(
          (currentData: any) => {
            const existingOrders = currentData?.data || [];
            if (existingOrders.find((o: Order) => o._id === order._id)) {
              return currentData;
            }
            return {
              ...currentData,
              data: [order, ...existingOrders]
            };
          },
          false // Don't revalidate yet
        );
        
        // Refresh to get complete data from server
        setTimeout(() => {
          refreshOrders();
        }, 100);
      };

      const handleOrderCancelled = (order: Order) => {
        // Only process orders for this admin - check restaurant field matches user._id
        const isForThisAdmin = order.restaurant?.toString() === userIdStr || order.adminId?.toString() === userIdStr || order.deviceId === userIdStr;
        if (!isForThisAdmin) return;
        
        // Deduplication check
        const eventKey = `cancelled-${order._id}`;
        if (isDuplicateEvent(eventKey)) return;
        
        console.log('[Socket] Order cancelled:', order.orderNumber || order._id);
        toast.error(`Order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber} was cancelled`);
        playCancelledSound();
        refreshOrders();
      };

      const handleOrderRejected = (order: Order) => {
        // Only process orders for this admin - check restaurant field matches user._id
        const isForThisAdmin = order.restaurant?.toString() === userIdStr || order.adminId?.toString() === userIdStr || order.deviceId === userIdStr;
        if (!isForThisAdmin) return;
        
        // Deduplication check
        const eventKey = `rejected-${order._id}`;
        if (isDuplicateEvent(eventKey)) return;
        
        console.log('[Socket] Order rejected:', order.orderNumber || order._id);
        toast.error(`Order #${order.orderNumber || order._id.slice(-6)} from Table #${order.tableNumber} was rejected`);
        playCancelledSound();
        refreshOrders();
      };

      const handlePaymentVerified = (order: Order) => {
        // Only process orders for this admin - check restaurant field matches user._id
        const isForThisAdmin = order.restaurant?.toString() === userIdStr || order.adminId?.toString() === userIdStr || order.deviceId === userIdStr;
        if (!isForThisAdmin) return;
        
        // Deduplication check
        const eventKey = `verified-${order._id}`;
        if (isDuplicateEvent(eventKey)) return;
        
        console.log('[Socket] Payment verified:', order.orderNumber || order._id);
        toast.success(`Payment verified for order #${order.orderNumber || order._id.slice(-8)}!`);
        playPaymentVerifiedSound();
        refreshOrders();
      };

      const handleOrderUpdate = (updatedOrder: Order) => {
        // Only process orders for this admin - check restaurant field matches user._id
        const isForThisAdmin = updatedOrder.restaurant?.toString() === userIdStr || updatedOrder.adminId?.toString() === userIdStr || updatedOrder.deviceId === userIdStr;
        if (!isForThisAdmin) return;
        
        // Deduplication check for status change toasts
        const eventKey = `update-${updatedOrder._id}-${updatedOrder.status}`;
        if (isDuplicateEvent(eventKey)) {
          return;
        }
        
        console.log('[Socket] Order update received:', updatedOrder.orderNumber || updatedOrder._id, 'Status:', updatedOrder.status);
        
        // Only show toast for meaningful status changes (not every update)
        const prevOrder = orders.find((o: Order) => o._id === updatedOrder._id);
        const prevStatus = prevOrder?.status;
        const newStatus = updatedOrder.status;
        
        // Show toast only for actual status transitions
        if (prevStatus && prevStatus !== newStatus) {
          if (newStatus === 'ACCEPTED' && prevStatus === 'PLACED') {
            toast.success(`Order #${updatedOrder.orderNumber || updatedOrder._id.slice(-6)} accepted! Being prepared 🍳`);
            playNewOrderSound();
          } else if (newStatus === 'COMPLETED') {
            toast.success(`Order #${updatedOrder.orderNumber || updatedOrder._id.slice(-6)} completed! 🎉`);
            playPaymentVerifiedSound();
          } else if (newStatus === 'REJECTED') {
            toast.error(`Order #${updatedOrder.orderNumber || updatedOrder._id.slice(-6)} was rejected`);
            playCancelledSound();
          } else if (newStatus === 'CANCELLED') {
            toast.error(`Order #${updatedOrder.orderNumber || updatedOrder._id.slice(-6)} was cancelled`);
            playCancelledSound();
          }
        }
        
        // Ensure updatedAt is set for proper key generation
        const orderWithTimestamp = {
          ...updatedOrder,
          updatedAt: updatedOrder.updatedAt || new Date().toISOString()
        };
        
        // Optimistically update the orders list
        mutateOrders(
          (currentData: any) => {
            const existingOrders = currentData?.data || [];
            const index = existingOrders.findIndex((o: Order) => o._id === orderWithTimestamp._id);
            console.log('[Socket] Updating order at index:', index, 'prev status:', existingOrders[index]?.status, 'new status:', orderWithTimestamp.status);
            
            if (index !== -1) {
              const newOrders = [...existingOrders];
              newOrders[index] = orderWithTimestamp;
              console.log('[Socket] Orders updated, new length:', newOrders.length);
              return {
                ...currentData,
                data: newOrders
              };
            }
            console.log('[Socket] Adding new order to list');
            return {
              ...currentData,
              data: [orderWithTimestamp, ...existingOrders]
            };
          },
          false // Don't revalidate yet
        );
        
        // Refresh to get complete data from server
        setTimeout(() => {
          refreshOrders();
        }, 100);
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
  }, [user?._id, refreshOrders]);

  const handleAction = async (orderId: string, action: string, payload: any = {}) => {
    try {
      const finalAction = payload?.actionOverride || action;
      const response = await api.post(`/order/${orderId}/action`, { action: finalAction, payload });
      toast.success(response.data.message || 'Action completed');
      refreshOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete action');
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


  const paymentStats = useMemo(() => {
    console.log('[Stats] Calculating paymentStats, orders count:', orders.length);
    console.log('[Stats] Sample order:', orders[0] ? { 
      status: orders[0].status, 
      paymentMethod: orders[0].paymentMethod, 
      paymentStatus: orders[0].paymentStatus,
      paymentDueStatus: orders[0].paymentDueStatus
    } : 'no orders');
    
    const stats = {
      totalRevenue: orders
        .filter((o: Order) => o.paymentStatus === 'VERIFIED' && o.status !== 'CANCELLED' && o.status !== 'REJECTED')
        .reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0),
      // Serving = ACCEPTED status (orders being prepared/served)
      servingPending: orders.filter((o: Order) => o.status === 'ACCEPTED').length,
      // Online = ONLINE payment method + PENDING payment status (default to ONLINE if not set)
      onlinePending: orders.filter((o: Order) => {
        const method = o.paymentMethod || 'ONLINE'; // Default to ONLINE
        const isPending = o.paymentStatus === 'PENDING' || !o.paymentStatus; // Default PENDING if not set
        const notCancelled = o.status !== 'CANCELLED' && o.status !== 'REJECTED';
        return method === 'ONLINE' && isPending && notCancelled;
      }).length,
      onlinePendingAmount: orders
        .filter((o: Order) => {
          const method = o.paymentMethod || 'ONLINE';
          const isPending = o.paymentStatus === 'PENDING' || !o.paymentStatus;
          const notCancelled = o.status !== 'CANCELLED' && o.status !== 'REJECTED';
          return method === 'ONLINE' && isPending && notCancelled;
        })
        .reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0),
      // Cash = CASH payment method + PENDING payment status  
      cashPending: orders.filter((o: Order) => {
        const method = o.paymentMethod;
        const isPending = o.paymentStatus === 'PENDING' || !o.paymentStatus;
        const notCancelled = o.status !== 'CANCELLED' && o.status !== 'REJECTED';
        return method === 'CASH' && isPending && notCancelled;
      }).length,
      cashPendingAmount: orders
        .filter((o: Order) => {
          const method = o.paymentMethod;
          const isPending = o.paymentStatus === 'PENDING' || !o.paymentStatus;
          const notCancelled = o.status !== 'CANCELLED' && o.status !== 'REJECTED';
          return method === 'CASH' && isPending && notCancelled;
        })
        .reduce((sum: number, o: Order) => sum + (o.totalAmount || 0), 0),
      // Dues
      duesPending: orders.filter((o: Order) => o.paymentDueStatus === 'DUE').length,
      unpaidDuesAmount: orders.filter((o: Order) => o.paymentDueStatus === 'DUE').reduce((s: number, o: Order) => s + (o.totalAmount || 0), 0),
    };
    
    console.log('[Stats] Calculated stats:', stats);
    return stats;
  }, [orders]);

  return (
    <div 
      className="w-full px-4 sm:px-6 lg:px-8 py-4"
      onClick={() => initAudioContext()}
    >
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
              {filteredOrders.map((order: Order) => (
                <OrderCard
                   key={`${order._id}-${order.status}-${order.paymentStatus}-${order.updatedAt || Date.now()}`}
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
          refreshOrders();
          setCreateOrderModalOpen(false);
        }}
      />
    </div>
  );
}

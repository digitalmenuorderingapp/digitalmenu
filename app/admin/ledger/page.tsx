'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaCalendar,
  FaChartLine,
  FaSpinner,
  FaMoneyBillWave,
  FaCreditCard,
  FaUtensils,
  FaClock,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaListAlt,
  FaClipboardList,
  FaTimes,
  FaCheckCircle,
  FaSkull,
  FaUndo,
  FaCheck,
  FaPlusCircle,
  FaMinusCircle,
  FaEnvelope,
  FaSync,
  FaExclamationCircle
} from 'react-icons/fa';
import Button from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import TransactionCard from '@/components/ui/TransactionCard';
import { LedgerSkeleton } from '@/components/ui/Skeleton';

// Interface definitions
interface LedgerTransaction {
  _id: string;
  restaurant: string;
  orderId: string;
  type: 'PAYMENT' | 'REFUND';
  paymentMode: 'COUNTER' | 'ONLINE' | 'CASH';
  status: 'PENDING' | 'VERIFIED';
  amount: number;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
  meta: {
    orderNumber: string;
    tableNumber?: number;
    deviceId?: string;
    utr?: string;
  };
}

interface SoldItem {
  menuItemId: string;
  name: string;
  count: number;
  totalRevenue: number;
}

interface HourlyBreakdown {
  hour: number;
  orders: number;
  revenue: number;
  servedOrders: number;
}

interface Ledger {
  _id: string;
  restaurant: string;
  date: string;
  counter: {
    received: number;
    verified: number;
    pending: number;
    refunded: number;
    balance: number;
  };
  online: {
    received: number;
    verified: number;
    pending: number;
    refunded: number;
    balance: number;
  };
  total: {
    received: number;
    refunded: number;
    netBalance: number;
    unpaidDues?: number;
  };
  counts: {
    totalOrders: number;
    servedOrders: number;
    rejectedOrders: number;
    cancelledOrders: number;
  };
  soldItems: SoldItem[];
  hourlyBreakdown: HourlyBreakdown[];
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export default function LedgerPage() {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'transactions'>('today');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayLedger();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'transactions') {
      fetchAllTransactions();
    }
  }, [activeTab, isAuthenticated]);

  const fetchTodayLedger = async () => {
    try {
      const response = await api.get('/ledger/today');
      setLedger(response.data.data);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
      toast.error('Failed to load today\'s ledger');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await api.get('/ledger/transactions');
      setTransactions(response.data.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    const loadingToast = toast.loading('Generating and sending your monthly financial report...');
    try {
      const response = await api.post('/ledger/exportreporttomail');
      if (response.data.success) {
        toast.success(response.data.message || 'Financial report sent successfully!', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Failed to send ledger report:', error);
      toast.error(error.response?.data?.message || 'Failed to send report. Please try again.', { id: loadingToast });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    const loadingToast = toast.loading('Syncing all orders and transactions...');
    try {
      const response = await api.post('/ledger/recalculate');
      if (response.data.success) {
        toast.success('Sync complete! Your ledger is now up to date.', { id: loadingToast });
        fetchTodayLedger(); // Refresh the data
      }
    } catch (error: any) {
      console.error('Failed to recalculate ledger:', error);
      toast.error(error.response?.data?.message || 'Failed to sync. Please try again.', { id: loadingToast });
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const groupTransactionsByDate = (transactions: LedgerTransaction[]) => {
    const grouped: { [key: string]: LedgerTransaction[] } = {};
    
    transactions.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tx);
    });
    
    return Object.keys(grouped)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: dateKey,
        transactions: grouped[dateKey].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }));
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  if (isLoading) {
    return <LedgerSkeleton />;
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <Link 
              href="/admin" 
              className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Audit Ledger</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Truth • Integrity • Operations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl w-fit shadow-inner border border-gray-200/50 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'today'
                  ? 'bg-white text-indigo-600 shadow-sm scale-[1.02] border border-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FaCalendarDay className="w-3 h-3" />
                <span>Today</span>
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'transactions'
                  ? 'bg-white text-indigo-600 shadow-sm scale-[1.02] border border-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <FaClipboardList className="w-3 h-3" />
                <span>Journal</span>
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handleSendEmail}
              isLoading={isSendingEmail}
              className="!py-1.5 !px-3.5"
              leftIcon={<FaEnvelope className="text-indigo-500 text-[10px]" />}
            >
              <span className="text-[9px] font-black uppercase tracking-widest">Email Report</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleRecalculate}
              isLoading={isRecalculating}
              className="!py-1.5 !px-3.5"
              leftIcon={<FaSync className={`${isRecalculating ? 'animate-spin' : ''} text-indigo-500 text-[10px]`} />}
            >
              <span className="text-[9px] font-black uppercase tracking-widest">Recalculate</span>
            </Button>
          </div>
        </div>

        {activeTab === 'today' && ledger && (
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Financial Section */}
            <div className="flex-[2] bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-3">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center px-1">
                Financial Reconciliation
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatsCard 
                  isMini
                  label="Counter" 
                  value={`₹${Math.round(ledger.counter.balance)}`} 
                  variant="amber" 
                  icon={<FaMoneyBillWave />} 
                />
                <StatsCard 
                  isMini
                  label="Online" 
                  value={`₹${Math.round(ledger.online.balance)}`} 
                  variant="blue" 
                  icon={<FaCreditCard />} 
                />
                <StatsCard 
                  isMini
                  label="Net Balance" 
                  value={`₹${Math.round(ledger.total.netBalance)}`} 
                  variant="green" 
                  icon={<FaChartLine />} 
                />
                <StatsCard 
                  isMini
                  label="Unpaid Dues" 
                  value={`₹${Math.round(ledger.total.unpaidDues || 0)}`} 
                  variant="red" 
                  icon={<FaExclamationCircle />} 
                />
              </div>
            </div>

            {/* Operational Section */}
            <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl p-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center px-1">
                Operational Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <StatsCard 
                  isMini
                  label="Total" 
                  value={ledger.counts.totalOrders} 
                  variant="indigo" 
                  icon={<FaUtensils />} 
                />
                <StatsCard 
                  isMini
                  label="Served" 
                  value={ledger.counts.servedOrders} 
                  variant="emerald" 
                  icon={<FaCheck />} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'today' && ledger && (
        <div className="space-y-8">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="bg-red-50/50 px-6 py-4 border-b border-red-100/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                      <FaClock className="w-5 h-5 text-red-600 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">Pending Ledger</h3>
                      <p className="text-[10px] font-black text-red-600/50 uppercase tracking-widest">Awaiting Verification</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:bg-amber-50/30 group-hover:border-amber-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-gray-500 uppercase tracking-tighter">
                      <FaMoneyBillWave className="text-amber-500" />
                      <span>Counter Verification Pending Amount</span>
                    </div>
                    <span className="text-lg font-black text-gray-900">₹{Math.round(ledger.counter.pending)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:bg-blue-50/30 group-hover:border-blue-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-gray-500 uppercase tracking-tighter">
                      <FaCreditCard className="text-blue-500" />
                      <span>Online Verification Pending Amount</span>
                    </div>
                    <span className="text-lg font-black text-gray-900">₹{Math.round(ledger.online.pending)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Gross Pending Amount</span>
                    <span className="text-3xl font-black text-red-600 tracking-tighter">₹{Math.round(ledger.counter.pending + ledger.online.pending)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="bg-amber-50/50 px-6 py-4 border-b border-amber-100/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center">
                      <FaMoneyBillWave className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Counter Ledger</h3>
                      <p className="text-[10px] font-black text-amber-600/50 uppercase tracking-widest">Physical Collection</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:bg-green-50/30 group-hover:border-green-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-gray-500 uppercase tracking-tighter">
                      <FaPlusCircle className="text-green-500" />
                      <span>Gross Verified</span>
                    </div>
                    <span className="text-lg font-black text-gray-900">₹{Math.round(ledger.counter.verified)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50/20 rounded-2xl border border-red-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-red-500 uppercase tracking-tighter">
                      <FaMinusCircle />
                      <span>Refunded Amount</span>
                    </div>
                    <span className="text-lg font-black text-red-600">-₹{Math.round(ledger.counter.refunded)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Net Balance</span>
                    <span className="text-3xl font-black text-amber-600 tracking-tighter">₹{Math.round(ledger.counter.balance)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100/50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Online Ledger</h3>
                      <p className="text-[10px] font-black text-blue-600/50 uppercase tracking-widest">Digital Settlement</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:bg-green-50/30 group-hover:border-green-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-gray-500 uppercase tracking-tighter">
                      <FaPlusCircle className="text-green-500" />
                      <span>Gross Verified</span>
                    </div>
                    <span className="text-lg font-black text-gray-900">₹{Math.round(ledger.online.verified)}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-red-50/20 rounded-2xl border border-red-100/30">
                    <div className="flex items-center space-x-3 text-sm font-bold text-red-500 uppercase tracking-tighter">
                      <FaMinusCircle />
                      <span>Refunded Amount</span>
                    </div>
                    <span className="text-lg font-black text-red-600">-₹{Math.round(ledger.online.refunded)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Settled Balance</span>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">₹{Math.round(ledger.online.balance)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Hourly Pulse</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operational Activity Heatmap</p>
                </div>
              </div>
              
              <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                {ledger.hourlyBreakdown.map((hour: HourlyBreakdown) => (
                  <div key={hour.hour} className="group relative flex flex-col items-center">
                    <div className="relative w-full h-32 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 group-hover:bg-indigo-50 transition-colors">
                      <div 
                        className="absolute bottom-0 left-0 w-full bg-indigo-500/20 border-t border-indigo-500/50 transition-all duration-700 ease-out flex flex-col items-center justify-end pb-1"
                        style={{ height: `${Math.min(100, (hour.orders / (Math.max(...ledger.hourlyBreakdown.map((h: HourlyBreakdown) => h.orders)) || 1)) * 100)}%` }}
                      >
                         <span className="text-[9px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">{hour.orders}</span>
                      </div>
                    </div>
                    <span className="mt-2 text-[9px] font-black text-gray-400 uppercase tracking-tighter">{formatTime(hour.hour)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-white border-b border-gray-100">
                <h3 className="text-base font-black text-indigo-900 uppercase tracking-tight">Prime Performers</h3>
                <p className="text-[10px] font-black text-indigo-600/50 uppercase tracking-widest mt-1">Top Selling Items Today</p>
              </div>
              <div className="p-4 space-y-3">
                {ledger.soldItems && ledger.soldItems.length > 0 ? (
                  ledger.soldItems.slice(0, 8).map((item: SoldItem, idx: number) => (
                    <div key={idx} className="group p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-md transition-all flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-transform group-hover:scale-110 ${
                          idx === 0 ? 'bg-amber-100 text-amber-600 shadow-sm' :
                          idx === 1 ? 'bg-indigo-100 text-indigo-600' :
                          'bg-white text-gray-400 border border-gray-100'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.count} Units Sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">₹{Math.round(item.totalRevenue)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-300">
                    <FaUtensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No Sales Data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
               <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
               
               <h3 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center">
                 <FaCheckCircle className="mr-3 text-indigo-400" /> Operational Quality
               </h3>
               <div className="space-y-6">
                 <div>
                   <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 opacity-60">
                     <span>Fulfillment Rate</span>
                     <span>{ledger.counts.totalOrders > 0 ? ((ledger.counts.servedOrders / ledger.counts.totalOrders) * 100).toFixed(1) : 0}%</span>
                   </div>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                     <div 
                      className="h-full bg-indigo-400 transition-all duration-1000"
                      style={{ width: `${ledger.counts.totalOrders > 0 ? (ledger.counts.servedOrders / ledger.counts.totalOrders) * 100 : 0}%` }}
                     />
                   </div>
                 </div>
                 <p className="text-xs font-medium text-indigo-100/60 leading-relaxed">
                   Current service efficiency is at <span className="text-white font-black">{ledger.counts.totalOrders > 0 ? ((ledger.counts.servedOrders / ledger.counts.totalOrders) * 100).toFixed(1) : 0}%</span> with {ledger.counts.rejectedOrders + ledger.counts.cancelledOrders} unsuccessful transactions.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Monthly Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              label="Monthly Orders" 
              value={transactions.filter(t => t.type === 'PAYMENT').length} 
              variant="indigo" 
              icon={<FaUtensils />} 
              description={`${transactions.filter(t => t.type === 'PAYMENT' && t.status === 'VERIFIED').length} Verified`}
            />
            <StatsCard 
              label="Counter Collected" 
              value={`₹${Math.round(transactions.filter(t => t.type === 'PAYMENT' && (t.paymentMode === 'CASH' || t.paymentMode === 'COUNTER') && t.status === 'VERIFIED').reduce((sum, t) => sum + t.amount, 0))}`} 
              variant="amber" 
              icon={<FaMoneyBillWave />} 
            />
            <StatsCard 
              label="Online Settled" 
              value={`₹${Math.round(transactions.filter(t => t.type === 'PAYMENT' && t.paymentMode === 'ONLINE' && t.status === 'VERIFIED').reduce((sum, t) => sum + t.amount, 0))}`} 
              variant="blue" 
              icon={<FaCreditCard />} 
            />
            <StatsCard 
              label="Monthly Net" 
              value={`₹${Math.round(transactions.filter(t => t.type === 'PAYMENT' && t.status === 'VERIFIED').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'REFUND').reduce((sum, t) => sum + Math.abs(t.amount), 0))}`} 
              variant="green" 
              icon={<FaChartLine />} 
            />
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-8">
              {groupTransactionsByDate(transactions).map(({ date, transactions: dayTransactions }) => (
                <div key={date} className="space-y-4">
                  <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                        {formatDateHeader(date)}
                      </h3>
                      <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {dayTransactions.length} transactions
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 pl-2">
                    {dayTransactions.map((tx) => (
                      <TransactionCard key={tx._id} transaction={tx} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <FaClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No recorded entries in journal</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

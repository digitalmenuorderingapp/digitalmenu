'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TRANSLATIONS, Language } from '@/utils/translations';
import api from '@/services/api';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/services/swr';
import { socketService } from '@/services/socket';
import { playNewOrderSound } from '@/utils/notifications';
import { getTodayISTDateString } from '@/utils/date';
import {
  FaUtensils,
  FaTable,
  FaArrowRight,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEdit,
  FaSpinner,
  FaSave,
  FaTimes,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaCreditCard,
  FaChartLine,
  FaCalendarDay,
  FaSearch,
  FaSyncAlt,
  FaStar,
  FaCrown,
  FaLock,
  FaEnvelope,
  FaChartArea,
  FaUserFriends
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';
import DailyOrdersChart from '@/components/dashboard/DailyOrdersChart';
import { Skeleton, StatsCardSkeleton } from '@/components/ui/Skeleton';

interface Stats {
  menuItems: number;
  tables: number;
  activeItems: number;
  occupiedTables: number;
  tablesList: any[];
  pendingOrders: any[];
}

interface Ledger {
  _id: string;
  date: string;
  cash: {
    received: number;
    balance: number;
  };
  online: {
    received: number;
    verified: number;
    balance: number;
  };
  total: {
    received: number;
    netBalance: number;
    totalRevenue: number;
  };
  counts: {
    totalOrders: number;
    servedOrders: number;
    rejectedOrders: number;
    cancelledOrders: number;
  };
  soldItems: Array<{
    menuItemId: string;
    name: string;
    count: number;
    totalRevenue: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
    servedOrders: number;
  }>;
}

interface MonthToDateStats {
  totalOrders: number;
  servedOrders: number;
  cashBalance: number;
  onlineBalance: number;
  netBalance: number;
  totalRevenue: number;
}

interface RestaurantFormData {
  restaurantName: string;
  ownerName: string;
  address: string;
  phone: string;
  motto: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getTodayISTDateString());
  const [chartMode, setChartMode] = useState<'hourly' | 'daily'>('daily');
  
  // SWR hooks for various dashboard data points
  const { data: menuRes, isLoading: isLoadingMenu } = useSWR(user ? '/menu/admin/all' : null, fetcher);
  const { data: tableRes, isLoading: isLoadingTables } = useSWR(user ? '/table' : null, fetcher);
  
  const occupancySwrKey = user ? `/order?status=PLACED,ACCEPTED,COMPLETED&date=${getTodayISTDateString()}` : null;
  const { data: occupancyRes, isLoading: isLoadingOccupancy, mutate: mutateOccupancy } = useSWR(occupancySwrKey, fetcher);

  const ledgerSwrKey = user ? (selectedDate === new Date().toISOString().split('T')[0] ? '/ledger/today' : `/ledger/date?date=${selectedDate}`) : null;
  const { data: ledgerRes, isLoading: isLoadingLedger, mutate: mutateLedger } = useSWR(ledgerSwrKey, fetcher);

  const { data: monthlyRes, isLoading: isLoadingMonthly, mutate: mutateMonthly } = useSWR(user ? '/ledger/monthly' : null, fetcher);

  // Derived data
  const menuItems = menuRes?.data || [];
  const tables = tableRes?.data || [];
  const pendingOrders = occupancyRes?.data || [];
  const ledger: Ledger | null = ledgerRes?.data || null;
  const monthlyLedgers: Ledger[] = monthlyRes?.data?.ledgers || [];
  const isLoading = isLoadingMenu || isLoadingTables || isLoadingOccupancy;

  // Calculate unique tables that are occupied
  // Rule: Occupied if (status is PLACED or ACCEPTED) OR (status is COMPLETED but payment is NOT VERIFIED)
  const occupiedOrders = pendingOrders.filter((order: any) => 
    order.orderType === 'dine-in' && 
    order.tableNumber && 
    (order.status === 'PLACED' || order.status === 'ACCEPTED' || (order.status === 'COMPLETED' && order.paymentStatus !== 'VERIFIED'))
  );

  const occupiedTableNumbers = new Set(occupiedOrders.map((order: any) => order.tableNumber));
  
  const stats = {
    menuItems: menuItems.length,
    tables: tables.length,
    activeItems: menuItems.filter((item: { isActive: boolean }) => item.isActive).length,
    occupiedTables: occupiedTableNumbers.size,
    tablesList: tables,
    pendingOrders: pendingOrders
  };
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    ownerName: '',
    address: '',
    phone: '',
    motto: ''
  });
  const [lang, setLang] = useState<Language>('en');

  // Persistence for language
  useEffect(() => {
    const saved = localStorage.getItem('digitalmenu_lang') as Language;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.join(user._id);

      const handleUpdate = () => {
        mutateOccupancy();
        mutateLedger();
        mutateMonthly();
      };

      socketService.on('newOrder', handleUpdate);
      socketService.on('orderUpdate', handleUpdate);

      return () => {
        socketService.off('newOrder', handleUpdate);
        socketService.off('orderUpdate', handleUpdate);
      };
    }
  }, [user, mutateOccupancy, mutateLedger, mutateMonthly]);

  const refreshLedger = async () => {
    setIsRefreshing(true);
    try {
      // Recalculate both transactions and analytical summary
      await api.post('/ledger/recalculate', { date: selectedDate });

      // Trigger SWR revalidation
      mutateOccupancy();
      mutateLedger();
      mutateMonthly();

      toast.success('Dashboard metrics refreshed successfully!');
    } catch (error: any) {
      console.error('Failed to update stats:', error);
      toast.error(error.response?.data?.message || 'Failed to update statistics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyRestaurantId = () => {
    if (user?._id) {
      navigator.clipboard.writeText(user._id);
      toast.success(t.sub_id_copied);
    }
  };


  const hasRestaurantDetails = user?.restaurantName || user?.ownerName || user?.address;

  // Subscription calculation
  const getSubscriptionStatus = () => {
    if (!user?.subscription) {
      return { name: 'Basic', daysLeft: 0, isExpired: false, color: 'text-gray-400' };
    }

    const { type, status, expiryDate } = user.subscription;
    const today = new Date();

    // 1. Handle Lifetime Free (Legacy)
    if (type === 'free') {
      return {
        name: 'Premium (LIFETIME)',
        daysLeft: null,
        isExpired: false,
        color: 'text-indigo-300'
      };
    }

    // 2. Handle Free Trial
    if (type === 'trial') {
      const expiry = expiryDate ? new Date(expiryDate) : null;
      const diffDays = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const expired = (expiry && diffDays <= 0) || status === 'expired';

      return {
        name: 'Free Trial',
        daysLeft: expiry ? Math.max(0, diffDays) : null,
        isExpired: expired,
        expiryDate: expiry ? expiry.toLocaleDateString() : 'Continuous',
        color: (expiry && diffDays < 7 || expired) ? 'text-red-400' : 'text-amber-300'
      };
    }

    // 3. Normal Paid Subscription
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        name: 'Premium Plan',
        daysLeft: Math.max(0, diffDays),
        isExpired: diffDays <= 0 || status === 'expired',
        expiryDate: expiry.toLocaleDateString(),
        color: (diffDays < 7 || status === 'expired') ? 'text-red-400' : 'text-green-300'
      };
    }

    // Default Fallback
    return {
      name: 'Basic Plan',
      daysLeft: 0,
      isExpired: false,
      color: 'text-gray-400'
    };
  };

  const subStatus = getSubscriptionStatus();

  // Date bounds for calendar (current month only)
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const maxDate = today.toISOString().split("T")[0];

  // Calculate month-to-date cumulative balance from monthlyLedgers
  const monthToDateStats = (monthlyLedgers as Ledger[]).reduce((acc: MonthToDateStats, ledger: Ledger) => {
    acc.totalOrders += ledger.counts?.totalOrders || 0;
    acc.servedOrders += ledger.counts?.servedOrders || 0;
    acc.cashBalance += ledger.cash?.balance || 0;
    acc.onlineBalance += ledger.online?.balance || 0;
    acc.netBalance += ledger.total?.netBalance || 0;
    acc.totalRevenue += ledger.total?.totalRevenue || 0;
    return acc;
  }, {
    totalOrders: 0,
    servedOrders: 0,
    cashBalance: 0,
    onlineBalance: 0,
    netBalance: 0,
    totalRevenue: 0
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Restaurant Welcome Card */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden border border-purple-500/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                {/* Admin Badge */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 text-center sm:text-left">
                  {user?.logo ? (
                    <div className="relative group p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-2xl shadow-2xl shrink-0">
                      <img
                        src={user.logo}
                        alt="Restaurant Logo"
                        className="w-20 h-20 lg:w-24 lg:h-24 rounded-[1.25rem] object-cover border-4 border-slate-900 group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      <div className="absolute -bottom-2 -right-2 sm:-bottom-2 sm:-right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-slate-900 shadow-lg animate-pulse" title="System Online"></div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-center border-2 border-white/10 shadow-3xl shrink-0">
                      <FaUtensils className="w-10 h-10 text-indigo-300 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col items-center sm:items-start">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2 sm:mb-1">
                      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tighter text-white">
                        {user?.restaurantName || 'DigitalMenu Admin'}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-300 rounded-lg tracking-widest uppercase mt-0.5">Premium</span>
                        <button
                          onClick={copyRestaurantId}
                          className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] font-medium text-purple-200/50 rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5 mt-0.5 group"
                          title={t.sub_copy_id}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">ID:</span>
                          <code className="text-[10px]">{user?._id?.slice(-6).toUpperCase()}</code>
                          <FaSyncAlt className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                    <p className="text-purple-200/70 text-sm lg:text-base font-medium max-w-md mx-auto sm:mx-0 leading-relaxed italic">
                      {user?.motto ? `"${user.motto}"` : 'Manage your digital menu, track orders, and grow your business with our state-of-the-art platform.'}
                    </p>
                  </div>
                </div>

                {/* Restaurant Info Cards */}
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 flex items-center gap-2">
                        <Skeleton circle width={32} height={32} className="bg-white/20" />
                        <div className="space-y-2 flex-1">
                          <Skeleton width="40%" height={8} className="bg-white/20" />
                          <Skeleton width="60%" height={12} className="bg-white/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasRestaurantDetails ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {user?.ownerName && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <FaUser className="w-4 h-4 text-purple-200" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-200">Owner</p>
                            <p className="text-sm font-medium text-white">{user.ownerName}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {user?.phone && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <FaPhone className="w-4 h-4 text-purple-200" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-200">Contact</p>
                            <p className="text-sm font-medium text-white">{user.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {user?.address && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                            <FaMapMarkerAlt className="w-4 h-4 text-purple-200" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-purple-200 uppercase tracking-tighter font-bold">Location</p>
                            <p className="text-sm font-medium text-white truncate">{user.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 border-l-purple-500/40 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${subStatus.isExpired ? 'bg-red-500/20' : 'bg-gradient-to-br from-amber-400 to-amber-600'} rounded-lg flex items-center justify-center shrink-0`}>
                          <FaStar className={`w-4 h-4 ${subStatus.isExpired ? 'text-red-400' : 'text-white'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className="text-xs text-purple-200 uppercase tracking-tighter font-bold">
                              {subStatus.daysLeft === null ? 'Subscription' : 'Status'}
                            </p>
                            {subStatus.isExpired ? (
                              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded uppercase font-black animate-pulse">Expired</span>
                            ) : subStatus.daysLeft === null ? (
                              <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tight">Free</span>
                            ) : (
                              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded uppercase font-black">Active</span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">
                              {subStatus.daysLeft !== null ? `${subStatus.daysLeft} days left` : 'Free'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 border-dashed">
                    <p className="text-purple-200 text-sm italic">No restaurant details added yet.</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex lg:flex-col gap-3">
                <Button
                  onClick={() => router.push('/admin/restaurant')}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  leftIcon={<FaEdit className="w-4 h-4" />}
                >
                  {hasRestaurantDetails ? 'Update Details' : 'Add Details'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Alert & Support Section */}
      {(subStatus.isExpired || subStatus.daysLeft !== null && subStatus.daysLeft < 10) && (
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-6 border-2 ${subStatus.isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} shadow-xl`}
          >
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
              <div className="flex-1 space-y-4 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div className={`p-3 rounded-xl ${subStatus.isExpired ? 'bg-red-500' : 'bg-amber-500'} text-white shadow-lg`}>
                    <FaCrown className="w-6 h-6" />
                  </div>
                  <h2 className={`text-2xl font-black tracking-tight ${subStatus.isExpired ? 'text-red-900' : 'text-amber-900'}`}>
                    {t.sub_payment_manual}
                  </h2>
                </div>

                <div className={`p-4 rounded-xl ${subStatus.isExpired ? 'bg-red-100/50' : 'bg-amber-100/50'} border ${subStatus.isExpired ? 'border-red-200' : 'border-amber-200'}`}>
                  <p className={`whitespace-pre-line font-bold ${subStatus.isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                    {t.sub_payment_desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/918017401099?text=Hello, I want to subscribe for my restaurant ID: ${user?._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-xl font-black shadow-lg hover:brightness-110 transition-all"
                  >
                    <FaPhone className="rotate-90" /> {t.sub_contact_whatsapp}
                  </a>
                  <a
                    href={`mailto:sahin401099@gmail.com?subject=Subscription Recognition&body=Hello, I have paid for my restaurant. My ID is: ${user?._id}. Attached is the screenshot.`}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-xl font-black shadow-lg hover:bg-slate-800 transition-all"
                  >
                    <FaEnvelope /> {t.sub_contact_email}
                  </a>
                </div>
              </div>

              <div className="w-full lg:w-72 shrink-0">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-3">{t.sub_rest_id}</span>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                    <code className="text-xs font-black text-indigo-600 truncate">{user?._id}</code>
                    <button
                      onClick={copyRestaurantId}
                      className="ml-2 p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-colors shrink-0"
                      title={t.sub_copy_id}
                    >
                      <FaSyncAlt className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] text-gray-400 font-bold leading-tight">
                    * {t.sub_copy_id} and send it along with your payment screenshot.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ledger Section - Daily Summary */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <FaChartLine className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Daily Performance</h2>
                  <p className="text-sm text-gray-500">Sales and order summary</p>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <div className="flex items-center space-x-2 shrink-0">
                  <FaCalendarDay className="w-5 h-5 text-indigo-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    className="bg-white border border-gray-200 text-sm font-black uppercase tracking-widest px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:border-gray-300"
                  />
                </div>
                <Button
                  onClick={refreshLedger}
                  isLoading={isRefreshing}
                  variant="primary"
                  size="sm"
                  leftIcon={<FaSyncAlt className={isRefreshing ? 'animate-spin' : ''} />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {isLoadingLedger ? (
            <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4).fill(0).map((_, i) => <StatsCardSkeleton key={i} />)}
            </div>
          ) : ledger ? (
            <div className="p-6">
              {/* Summary Cards - Daily + Month-to-Date */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatsCard
                  label="Total Orders"
                  value={ledger.counts.totalOrders}
                  variant="indigo"
                  icon={<FaClipboardList />}
                />
                <StatsCard
                  label="Served Orders"
                  value={ledger.counts.servedOrders}
                  variant="green"
                  icon={<FaCheckCircle />}
                />
                <StatsCard
                  label="Cash Balance"
                  value={`₹${Math.round(ledger.cash?.balance || 0)}`}
                  variant="amber"
                  icon={<FaMoneyBillWave />}
                />
                <StatsCard
                  label="Online Balance"
                  value={`₹${Math.round(ledger.online.balance)}`}
                  variant="blue"
                  icon={<FaCreditCard />}
                />
                <StatsCard
                  label="Today Revenue"
                  value={`₹${Math.round(ledger.total.totalRevenue)}`}
                  variant="purple"
                  icon={<FaChartLine />}
                  description="Earned Income"
                />
                <StatsCard
                  label="Settled Balance"
                  value={`₹${Math.round(ledger.total.netBalance)}`}
                  variant="emerald"
                  icon={<FaMoneyBillWave />}
                  description={`${new Date().toLocaleDateString('en-IN', { month: 'short' })}: ₹${Math.round(monthToDateStats.netBalance)}`}
                />
              </div>

              {/* Table Metrics Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <FaUtensils className="w-5 h-5 opacity-40" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Tables Occupied</h4>
                        <p className="text-xs text-indigo-600 font-medium">Active customers</p>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-indigo-700">{stats.occupiedTables}</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.tables > 0 ? (stats.occupiedTables / stats.tables) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                        <FaTable className="w-5 h-5 opacity-40" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Available Tables</h4>
                        <p className="text-xs text-emerald-600 font-medium">Ready for guests</p>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-emerald-700">{stats.tables - stats.occupiedTables}</span>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.tables > 0 ? ((stats.tables - stats.occupiedTables) / stats.tables) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Live Table Status Section */}
              <div className="mt-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <FaTable className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Live Table Occupancy</h3>
                      <p className="text-xs text-gray-500 font-medium">Real-time status for {user?.restaurantName || 'your restaurant'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl shadow-sm border border-gray-100 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Available
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl shadow-sm border border-gray-100 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      Occupied
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-5 relative z-10">
                  {stats.tablesList.map((table: any) => {
                    const isOccupied = stats.pendingOrders.some(
                      (order: any) => 
                        order.orderType === 'dine-in' && 
                        order.tableNumber === table.tableNumber &&
                        (order.status === 'PLACED' || order.status === 'ACCEPTED' || (order.status === 'COMPLETED' && order.paymentStatus !== 'VERIFIED'))
                    );

                    return (
                      <motion.div
                        key={table._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative group p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2
                          ${isOccupied 
                            ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 border-indigo-700 text-white shadow-2xl shadow-indigo-200' 
                            : 'bg-white border-gray-50 text-gray-900 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50'
                          }`}
                      >
                        <div className={`p-2 rounded-lg ${isOccupied ? 'bg-indigo-500/30' : 'bg-gray-50 group-hover:bg-emerald-50'}`}>
                          <FaTable className={`w-3 h-3 ${isOccupied ? 'text-indigo-200' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isOccupied ? 'text-indigo-200/80' : 'text-gray-400'}`}>
                            Table
                          </span>
                          <span className="text-3xl font-black tracking-tighter leading-none">
                            {table.tableNumber}
                          </span>
                        </div>

                        <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider
                          ${isOccupied ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-700'}`}>
                          <FaUserFriends className="w-2.5 h-2.5 opacity-60" />
                          {table.seats || 4} Seats
                        </div>

                        {isOccupied && (
                          <>
                            <div className="absolute -top-2 -right-2 bg-emerald-400 text-white w-7 h-7 rounded-full shadow-lg flex items-center justify-center border-4 border-indigo-600">
                              <FaUtensils className="w-2.5 h-2.5 animate-bounce" />
                            </div>
                            <div className="absolute top-2 left-2 flex gap-0.5">
                              {[1, 2, 3].map(i => (
                                <div key={i} className={`w-1 h-1 rounded-full bg-indigo-300/50 animate-pulse`} style={{ animationDelay: `${i * 200}ms` }}></div>
                              ))}
                            </div>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {stats.tablesList.length === 0 && (
                    <div className="col-span-full py-20 border-3 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <FaTable className="w-8 h-8 opacity-20" />
                      </div>
                      <h4 className="text-lg font-black text-gray-400 uppercase tracking-widest">No Tables Found</h4>
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-tighter">Please create tables in the Table Management section</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Selling Items */}
              {ledger.soldItems && ledger.soldItems.length > 0 && (
                <div className="mt-6 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Top Selling Items Today</h4>
                  <div className="space-y-2">
                    {ledger.soldItems.slice(0, 5).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-600">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-500">{item.count} sold</span>
                          <span className="font-medium text-gray-900">₹{Math.round(item.totalRevenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No ledger data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart - Date-wise Orders */}
      <div className="mt-8">
        <DailyOrdersChart
          data={monthlyLedgers.length > 0 ? monthlyLedgers.map(l => ({
            date: l.date,
            orders: l.counts.totalOrders,
            revenue: l.total.netBalance
          })).reverse() : [
            { date: new Date().toISOString().split('T')[0], orders: 0, revenue: 0 }
          ]}
          isLoading={isLoadingMonthly}
          mode="daily"
        />
      </div>

    </div>
  );
}

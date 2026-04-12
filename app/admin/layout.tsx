'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import toast from 'react-hot-toast';
import { playNewOrderSound, playNotificationSound, playPaymentVerifiedSound, playCancelledSound } from '@/utils/notifications';
import NotificationDrawer from '@/components/ui/NotificationDrawer';
import { Notification } from '@/types/notification';
import {
  FaUtensils,
  FaTable,
  FaQrcode,
  FaSignOutAlt,
  FaHome,
  FaChevronRight,
  FaDesktop,
  FaChartLine,
  FaClipboardList,
  FaMoneyBillWave,
  FaStore,
  FaBars,
  FaTimes,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaShieldAlt,
  FaCircle,
  FaCrown,
  FaLifeRing,
  FaMobileAlt,
  FaFileAlt,
  FaBell
} from 'react-icons/fa';
import api from '@/services/api';
import { UserProfileSkeleton } from '@/components/ui/Skeleton';
import SubscriptionModal from '@/components/ui/SubscriptionModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Track processed notification IDs for deduplication
  const processedNotificationsRef = useRef<Set<string>>(new Set());

  // Initialize global keyboard shortcuts
  const shortcuts = useGlobalShortcuts(() => setShortcutsModalOpen(true));

  // Fetch logged devices count
  useEffect(() => {
    const fetchDevices = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await api.get('/devices');
        setDeviceCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
      }
    };
    fetchDevices();
  }, [isAuthenticated]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !user?._id) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, user?._id]);

  // Real-time account status monitoring
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      socketService.connect();
      socketService.join(`restaurant:${user._id}`);

      const handleStatusUpdate = (data: any) => {
        console.log('🔄 Account status updated via socket:', data);
        refreshUser();
      };

      const handleIncomingNotification = (notification: Notification) => {
        if (!notification._id) return;

        // Deduplication check
        if (processedNotificationsRef.current.has(notification._id)) {
          console.log('🚫 Duplicate notification ignored:', notification._id);
          return;
        }

        // Mark as processed
        processedNotificationsRef.current.add(notification._id);

        // Keep the set size manageable (last 50 IDs)
        if (processedNotificationsRef.current.size > 50) {
          const firstItem = processedNotificationsRef.current.values().next().value;
          if (firstItem) processedNotificationsRef.current.delete(firstItem);
        }

        console.log('🔔 New notification received:', notification);

        setNotifications(prev => {
          // Double check state for the ID as a safety measure
          if (prev.some(n => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });

        setUnreadCount(prev => prev + 1);

        // Show specific toast based on type
        if (notification.type === 'ORDER_NEW') {
          toast.success(notification.message, { icon: '📦' });
          playNewOrderSound();
          if (!pathname.includes('/admin/orders')) {
            setNewOrdersCount(prev => prev + 1);
          }
        } else if (notification.type === 'PAYMENT_VERIFIED') {
          toast.success(notification.message, { icon: '💰' });
          playPaymentVerifiedSound();
        } else if (notification.type === 'ORDER_CANCELLED' || notification.type === 'ORDER_REJECTED') {
          toast.error(notification.message, { icon: '❌' });
          playCancelledSound();
        } else if (notification.type === 'PAYMENT_RETRY') {
          toast.error(notification.message, { icon: '⚠️' });
          playCancelledSound(); // Use error sound for retry
        } else {
          toast(notification.message, { icon: '🔔' });
          playNotificationSound();
        }
      };

      const handleNewOrder = (order: any) => {
        // We now use generic 'notification' event for everything, 
        // but keeping this for safety if backend still emits 'newOrder'
        console.log('📦 New order event received:', order);
      };

      const handleOrderUpdate = (order: any) => {
        console.log('📝 Order update event received:', order);
      };

      socketService.on('accountStatusUpdate', handleStatusUpdate);
      socketService.on('notification', handleIncomingNotification);
      socketService.on('newOrder', handleNewOrder);
      socketService.on('orderUpdate', handleOrderUpdate);

      return () => {
        socketService.off('accountStatusUpdate', handleStatusUpdate);
        socketService.off('notification', handleIncomingNotification);
        socketService.off('newOrder', handleNewOrder);
        socketService.off('orderUpdate', handleOrderUpdate);
      };
    }
  }, [isAuthenticated, user?._id, refreshUser, pathname]);

  const handleMarkAsRead = async (id?: string) => {
    try {
      await api.post('/notifications/mark-read', {
        notificationIds: id ? [id] : notifications.filter(n => !n.isRead).map(n => n._id),
        recipientType: 'ADMIN'
      });

      if (id) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Clear new orders badge when navigating to orders page
  useEffect(() => {
    if (pathname.includes('/admin/orders')) {
      setNewOrdersCount(0);
    }
  }, [pathname]);
  const getSubscriptionStatus = () => {
    if (!user?.subscription) {
      return { name: 'Basic', daysLeft: 0, isExpired: false, status: 'Inactive', expiryDate: 'N/A' };
    }

    const { type, status, expiryDate } = user.subscription;

    if (type === 'free') {
      return { name: 'Premium (Free)', daysLeft: null, isExpired: false, status: 'Active', expiryDate: 'Lifetime' };
    }

    if (type === 'trial') {
      const expiry = expiryDate ? new Date(expiryDate) : null;
      const diffDays = expiry ? Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
      return {
        name: 'Free Trial',
        daysLeft: expiry ? Math.max(0, diffDays) : null,
        isExpired: (expiry && diffDays <= 0) || status === 'expired',
        status: status || 'Active',
        expiryDate: expiry ? expiry.toLocaleDateString() : 'Continuous'
      };
    }

    if (!expiryDate) {
      return { name: 'Basic', daysLeft: 0, isExpired: false, status: 'Inactive', expiryDate: 'N/A' };
    }

    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      name: 'Premium Plan',
      daysLeft: Math.max(0, diffDays),
      isExpired: diffDays < 0 || status === 'expired',
      expiryDate: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: (diffDays < 0 || status === 'expired') ? 'Expired' : 'Active'
    };
  };

  const subStatus = getSubscriptionStatus();
  const isRestricted = !isLoading && isAuthenticated && (user?.subscription?.status === 'inactive' || subStatus.isExpired);

  const blockedPaths = ['/admin/orders'];
  const shouldBlockContent = isRestricted && blockedPaths.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const navItems = [
    // Dashboard - Standalone at top
    {
      section: 'Overview',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: <FaHome className="w-5 h-5" /> },
      ]
    },
    // Quick Access - Most Used
    {
      section: 'Quick Access',
      items: [
        { href: '/admin/orders', label: 'Orders', icon: <FaClipboardList className="w-5 h-5" /> },
        { href: '/admin/ledger', label: 'Ledger', icon: <FaChartLine className="w-5 h-5" /> },
      ]
    },
    // Management
    {
      section: 'Management',
      items: [
        { href: '/admin/menu', label: 'Menu', icon: <FaUtensils className="w-5 h-5" /> },
        { href: '/admin/tables', label: 'Tables', icon: <FaTable className="w-5 h-5" /> },
        { href: '/admin/reports', label: 'Reports', icon: <FaFileAlt className="w-5 h-5" /> },
        { href: '/admin/restaurant', label: 'Settings', icon: <FaStore className="w-5 h-5" /> },
      ]
    },
    // Support
    {
      section: 'Support',
      items: [
        { href: '/admin/support', label: 'Help & Support', icon: <FaLifeRing className="w-5 h-5" /> },
      ]
    },
  ];

  // Note: Full-page isLoading is now handled by LayoutClient's BrandLoader
  // During internal navigation, we let the skeletons handle it.
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
          {/* Logo Card */}
          <div className="m-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-16 flex items-center px-6">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <FaQrcode className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900">DigitalMenu</span>
                  {user?.restaurantName && (
                    <div className="flex items-center space-x-1">
                      {user?.logo && (
                        <img
                          src={user.logo}
                          alt={user.restaurantName}
                          className="w-4 h-4 rounded object-cover border border-gray-200"
                        />
                      )}
                      <span className="text-xs text-gray-600 truncate max-w-[120px]">
                        {user.restaurantName}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Navigation with Sections */}
          <div className="px-4 mb-2">
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <FaBell className="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Notifications</span>
              </div>
              {newOrdersCount > 0 && (
                <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                  {newOrdersCount}
                </span>
              )}
            </button>
          </div>

          <nav className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
            {navItems.map((section, sectionIdx) => (
              <div key={section.section} className="space-y-1">
                {/* Section Header */}
                <div className="flex items-center justify-between px-3 mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {section.section}
                  </span>
                </div>

                {/* Section Items */}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(`${item.href}/`));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </span>
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.href === '/admin/orders' && newOrdersCount > 0 && (
                          <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                            {newOrdersCount}
                          </span>
                        )}
                        {isActive && <FaChevronRight className="w-3 h-3 ml-auto opacity-70" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Section Divider */}
                {sectionIdx < navItems.length - 1 && (
                  <div className="pt-2 border-b border-gray-100" />
                )}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            {/* Logged Devices Badge */}
            <Link
              href="/admin/devices"
              className="flex items-center justify-between px-3 py-2.5 mb-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FaMobileAlt className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Logged Devices</span>
              </div>
              <span className="min-w-[1.5rem] h-6 px-2 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {deviceCount}
              </span>
            </Link>

            {isLoading || !user ? (
              <UserProfileSkeleton />
            ) : (
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-indigo-600 font-black">
                    {user?.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
            <div className="my-3 border-t border-gray-200" />
            <Link
              href="/"
              className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors"
            >
              <FaHome className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-64 flex flex-col bg-white border-r border-gray-200 z-50 shadow-2xl"
            >
              {/* Logo Card */}
              <div className="m-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-16 flex items-center justify-between px-6">
                  <Link href="/" className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <FaQrcode className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-gray-900">DigitalMenu</span>
                      {user?.restaurantName && (
                        <div className="flex items-center space-x-1">
                          {user?.logo && (
                            <img
                              src={user.logo}
                              alt={user.restaurantName}
                              className="w-4 h-4 rounded object-cover border border-gray-200"
                            />
                          )}
                          <span className="text-xs text-gray-600 truncate max-w-[120px]">
                            {user.restaurantName}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Navigation with Sections */}
              <nav className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
                {navItems.map((section, sectionIdx) => (
                  <div key={section.section} className="space-y-1">
                    {/* Section Header */}
                    <div className="flex items-center justify-between px-3 mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {section.section}
                      </span>
                    </div>

                    {/* Section Items */}
                    <div className="space-y-0.5">
                      {section.items.map((item, index) => {
                        const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(`${item.href}/`));
                        return (
                          <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: sectionIdx * 0.1 + index * 0.05 }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-semibold'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {item.icon}
                              </span>
                              <span className="font-medium text-sm">{item.label}</span>
                              {item.href === '/admin/orders' && unreadCount > 0 && (
                                <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                  {unreadCount}
                                </span>
                              )}
                              {isActive && <FaChevronRight className="w-3 h-3 ml-auto opacity-70" />}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Section Divider */}
                    {sectionIdx < navItems.length - 1 && (
                      <div className="pt-2 border-b border-gray-100" />
                    )}
                  </div>
                ))}
              </nav>

              {/* User section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 border-t border-gray-200"
              >
                {/* Logged Devices Badge */}
                <Link
                  href="/admin/devices"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 mb-3 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100/50 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FaMobileAlt className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Logged Devices</span>
                  </div>
                  <span className="min-w-[1.5rem] h-6 px-2 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {deviceCount}
                  </span>
                </Link>

                {isLoading || !user ? (
                  <UserProfileSkeleton />
                ) : (
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-black">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</p>
                    </div>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </motion.button>
                <div className="my-3 border-t border-gray-200" />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                  >
                    <FaHome className="w-5 h-5" />
                    <span className="font-medium">Back to Home</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header Card */}
          <header className="md:hidden px-4 py-3 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-14 flex items-center justify-between px-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg"
                >
                  <FaBars className="w-5 h-5" />
                </motion.button>
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <FaQrcode className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">DigitalMenu</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsNotificationOpen(true)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg relative"
                  >
                    <FaBell className="w-5 h-5" />
                    {newOrdersCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </motion.button>
                  <div className="w-1" />
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto w-full relative">
            <div className={`w-full h-full transition-all duration-300 ${shouldBlockContent ? 'blur-md pointer-events-none select-none' : ''}`}>
              {children}
            </div>

            <SubscriptionModal
              isOpen={shouldBlockContent}
              isInline={true}
              expiryDate={subStatus.expiryDate}
            />
          </main>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearAll}
      />
    </div>
  );
}


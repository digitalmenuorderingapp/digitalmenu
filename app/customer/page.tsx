'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '@/components/customer/BottomNav';
import MenuTab from '@/components/customer/MenuTab';
import CartTab from '@/components/customer/CartTab';
import OrdersTab from '@/components/customer/OrdersTab';
import ProfileTab from '@/components/customer/ProfileTab';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/services/swr';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FaSpinner, FaUtensils, FaShoppingCart, FaClipboardList, FaUser, FaQrcode } from 'react-icons/fa';
import { socketService } from '@/services/socket';
import { playNotificationSound } from '@/utils/notifications';
import { Order, MenuItem, CartItem } from '@/types/order';
import { Notification } from '@/types/notification';

// Encryption key - must match the one used in tables page
const ENCRYPTION_KEY = 'dm-2026';


function CustomerPageContent() {
  const searchParams = useSearchParams();
  const { session, updateSession } = useCustomerSession();
  const [activeTab, setActiveTab] = useState('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    customerName: '',
    numberOfPersons: 1,
    customerPhone: ''
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const qrParam = searchParams.get('q') || searchParams.get('qr'); // Support both new and old param
  const tableNumber = searchParams.get('table');
  const tabParam = searchParams.get('tab');

  const hasInitialized = useRef(false);

  // SWR hooks for data fetching
  const menuSwrKey = session.restaurantId && session.tableNumber ? `/public/menu?restaurantId=${session.restaurantId}&table=${session.tableNumber}` : null;
  const { data: menuData, mutate: mutateMenu } = useSWR(menuSwrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  });

  const menuItems = menuData?.data ? Object.values(menuData.data.menuItems).flat() as MenuItem[] : [];

  const ordersSwrKey = session.deviceId ? `/order/device/${session.deviceId}` : null;
  const { data: ordersData, mutate: mutateOrders } = useSWR(ordersSwrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  });

  const orders = ordersData?.data || [];

  const restaurantSwrKey = session.restaurantId ? `/public/restaurant/${session.restaurantId}` : null;
  const { data: restaurantData } = useSWR(restaurantSwrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  const restaurantInfo = restaurantData?.data ? {
    name: restaurantData.data.restaurantName,
    id: session.restaurantId || '',
    logo: restaurantData.data.logo,
    motto: restaurantData.data.motto
  } : null;

  // Handle tab from URL query param
  useEffect(() => {
    if (tabParam && ['menu', 'cart', 'orders', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Initialize session and process QR code - only once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeSession = async () => {
      // Handle QR code
      if (qrParam) {
        try {
          const qrData = decryptQrData(qrParam);
          if (qrData) {
            const tableStr = qrData.table.toString();
            try {
              const response = await api.get(`/public/restaurant/${qrData.restaurantId}`);
              const restaurantData = response.data.data;
              const restaurantName = restaurantData.restaurantName;

              updateSession({
                restaurantName: restaurantName,
                restaurantId: qrData.restaurantId,
                tableNumber: tableStr,
                logo: restaurantData.logo,
                motto: restaurantData.motto
              });
              toast.success(`Welcome to ${restaurantName}!`);
            } catch (error) {
              console.error('Restaurant fetch error:', error);
              updateSession({
                restaurantName: 'Restaurant',
                restaurantId: qrData.restaurantId,
                tableNumber: tableStr,
              });
              toast.success('Welcome!');
            }

            // ✅ Update session with restaurant info - SWR will automatically fetch menu
            setIsLoading(false);
            return; // Skip the generic setIsLoading(false) below
          }
        } catch (error) {
          console.error('QR decryption error:', error);
          toast.error('Failed to read QR code');
        }
      }

      setIsLoading(false);
    };

    initializeSession();
  }, []);

  // Check if returning customer and show/hide welcome modal accordingly
  useEffect(() => {
    const checkReturningCustomer = async () => {
      if (!session.deviceId) return;
      
      // If customer already has a name, they're returning - don't show modal
      if (session.customerName) {
        console.log('[Welcome Modal] Customer has name, skipping modal:', session.customerName);
        return;
      }
      
      try {
        console.log('[Welcome Modal] Checking orders for device:', session.deviceId);
        const response = await api.get(`/order/device/${session.deviceId}`);
        const previousOrders = response.data.data || [];
        
        console.log('[Welcome Modal] Previous orders count:', previousOrders.length);
        
        // Only show modal if no previous orders (new device)
        if (previousOrders.length === 0) {
          console.log('[Welcome Modal] No orders found, showing modal');
          setShowCustomerInfoModal(true);
        } else {
          console.log('[Welcome Modal] Found existing orders, hiding modal');
        }
      } catch (error) {
        console.error('[Welcome Modal] API error:', error);
        // If API fails, show modal
        setShowCustomerInfoModal(true);
      }
    };

    // Only run after session is loaded (deviceId exists)
    if (session.deviceId) {
      checkReturningCustomer();
    }
  }, [session.deviceId, session.customerName]);

  // Update table capacity in session when menu data changes
  useEffect(() => {
    if (menuData?.data?.tableCapacity && menuData.data.tableCapacity !== session.tableCapacity) {
      updateSession({ tableCapacity: menuData.data.tableCapacity });
    }
  }, [menuData, updateSession, session.tableCapacity]);

  const refreshMenu = useCallback(() => {
    mutateMenu();
  }, [mutateMenu]);

  const refreshOrders = useCallback(() => {
    mutateOrders();
  }, [mutateOrders]);


  const decryptQrData = (encryptedData: string) => {
    try {
      // Fix URL-safe base64 characters
      const base64 = encryptedData
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const bytes = CryptoJS.AES.decrypt(base64, ENCRYPTION_KEY);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedData) {
        throw new Error('Failed to decrypt QR data');
      }

      // Handle new format (restaurantId:tableNumber) or old JSON format
      if (decryptedData.includes(':') && !decryptedData.startsWith('{')) {
        const [restaurantId, table] = decryptedData.split(':');
        return { restaurantId, table };
      }
      
      // Fallback for old JSON format
      const qrData = JSON.parse(decryptedData);
      return { 
        restaurantId: qrData.restaurantId, 
        table: qrData.table 
      };
    } catch (error) {
      console.error('QR decryption error:', error);
      return null;
    }
  };



  // Real-time order updates
  useEffect(() => {
    if (session.deviceId) {
      socketService.connect();
      socketService.join(`customer:${session.deviceId}`);

      // Join restaurant room only for menu updates (not for admin notifications)
      if (session.restaurantId) {
        socketService.join(`restaurant:${session.restaurantId}`);
        console.log('[Socket] Joined restaurant room for menu updates:', session.restaurantId);
      }

      // Fetch initial notifications
      const fetchNotifications = async () => {
        try {
          const res = await api.get(`/notifications/public?deviceId=${session.deviceId}&recipientType=CUSTOMER`);
          setNotifications(res.data.data || []);
          setUnreadNotifications(res.data.unreadCount || 0);
        } catch (error) {
          console.error('Failed to fetch customer notifications:', error);
        }
      };

      fetchNotifications();

      // Track processed notification IDs to prevent duplicates
      const processedNotifications = new Set<string>();

      // Unified Notification Listener
      const handleNotification = (notification: Notification) => {
        // Filter out admin notifications - only process customer notifications
        if (notification.recipientType !== 'CUSTOMER') {
          console.log('[Socket] Ignored non-customer notification:', notification.recipientType);
          return;
        }

        // Prevent duplicate processing of the same notification
        if (processedNotifications.has(notification._id)) {
          console.log('[Socket] Duplicate notification ignored:', notification._id);
          return;
        }
        processedNotifications.add(notification._id);

        console.log('[Socket] New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifications(prev => prev + 1);

        // Map notification status to toast message
        const statusMessages: Record<string, string> = {
          'ORDER_NEW': 'Order placed successfully! 📝',
          'ORDER_ACCEPTED': 'Your order is being prepared! 🍳',
          'ORDER_COMPLETED': 'Your order has been served! 🍽️',
          'ORDER_REJECTED': 'Sorry, your order was rejected. ❌',
          'ORDER_CANCELLED': 'Your order has been cancelled. 🚫',
          'PAYMENT_RETRY': 'Verification failed. Please retry payment. 🔁',
          'PAYMENT_VERIFIED': 'Payment verified successfully! ✅',
        };

        const message = statusMessages[notification.type] || notification.message;
        const isError = ['ORDER_REJECTED', 'ORDER_CANCELLED', 'PAYMENT_RETRY'].includes(notification.type);

        toast(message, {
          id: `notif-${notification._id}`,
          icon: isError ? '❌' : '🔔',
          duration: isError ? 8000 : 5000,
          style: {
            borderRadius: '12px',
            background: isError ? '#dc2626' : '#1e293b',
            color: '#fff',
          },
        });

        playNotificationSound();

        // 🔄 SYNC STATE: If notification has order data, refetch orders from server
        if (notification.metadata?.orderData) {
          // Trigger server refetch to ensure order card is updated
          mutateOrders();
        }
      };

      socketService.on('notification', handleNotification);

      // Keep other system-wide listeners (like menu updates)
      const handleMenuUpdated = (data: { restaurantId: string }) => {
        console.log('[Socket] Menu updated by admin, refetching...');
        // Refetch menu items for current restaurant
        if (session.restaurantId && data.restaurantId === session.restaurantId) {
          refreshMenu();
          toast('Menu updated! 🍽️', {
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#10b981',
              color: '#fff',
            },
          });
        }
      };

      socketService.on('menuUpdated', handleMenuUpdated);

      return () => {
        socketService.off('notification', handleNotification);
        socketService.off('menuUpdated', handleMenuUpdated);
      };
    }
  }, [session.deviceId, session.restaurantId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Refresh orders when switching to orders tab
    // Refresh orders and mark notifications as read when switching to orders tab
    if (tab === 'orders') {
      refreshOrders();
      if (unreadNotifications > 0) {
        setUnreadNotifications(0);
        api.post('/notifications/public/mark-read', {
          deviceId: session.deviceId,
          recipientType: 'CUSTOMER'
        }).catch(err => console.error('Failed to clear notifications:', err));
      }
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem._id === item._id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item._id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item._id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    const item = cart.find(cartItem => cartItem._id === itemId);
    return item ? item.quantity : 0;
  };

  const placeOrder = async (paymentMethod: 'CASH' | 'ONLINE', utr?: string, specialInstructions?: string) => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!session.restaurantId || !session.tableNumber) {
      toast.error('Restaurant or table information is missing');
      return;
    }

    // Get mobileNumber directly from localStorage to ensure we have the latest value
    // This avoids any stale state issues
    const customerPhone = localStorage.getItem('mobileNumber') || session.mobileNumber || '';
    
    console.log('[DEBUG] Session mobileNumber:', session.mobileNumber);
    console.log('[DEBUG] localStorage mobileNumber:', localStorage.getItem('mobileNumber'));
    console.log('[DEBUG] Using customerPhone:', customerPhone);

    try {
      const orderData = {
        restaurantId: session.restaurantId,
        tableNumber: parseInt(session.tableNumber || '0') || 0,
        customerName: session.customerName || 'Guest',
        customerPhone: customerPhone || undefined,
        numberOfPersons: session.numberOfPersons || 1,
        deviceId: session.deviceId,
        sessionId: session.sessionId || session.deviceId,
        items: cart.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.offerPrice || item.price,
          quantity: item.quantity
        })),


        totalAmount: cart.reduce((total, item) => {
          const price = item.offerPrice || item.price;
          return total + (price * item.quantity);
        }, 0),
        paymentMethod,
        utr: utr || undefined,
        specialInstructions: specialInstructions || undefined,
        status: 'PLACED'
      };

      console.log('[DEBUG] Order data being sent:', orderData);

      const response = await api.post('/order', orderData);

      if (response.data.success) {
        const orderNumber = response.data.data.orderNumber;
        toast.success(`Your order # is ${orderNumber}`);
        setCart([]);
        handleTabChange('orders');
        refreshOrders();
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="mesh-gradient" />
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-indigo-50">
             <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Experience</p>
        </div>
      </div>
    );
  }

  // Get header title and icon based on active tab
  const getHeaderConfig = () => {
    switch (activeTab) {
      case 'menu':
        return { title: 'Menu', icon: <FaUtensils className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' };
      case 'cart':
        return { title: 'Your Cart', icon: <FaShoppingCart className="w-5 h-5" />, color: 'from-orange-500 to-red-500' };
      case 'orders':
        return { title: 'Your Orders', icon: <FaClipboardList className="w-5 h-5" />, color: 'from-green-500 to-teal-500' };
      case 'profile':
        return { title: 'Profile', icon: <FaUser className="w-5 h-5" />, color: 'from-pink-500 to-rose-500' };
      default:
        return { title: 'Menu', icon: <FaUtensils className="w-5 h-5" />, color: 'from-indigo-500 to-purple-500' };
    }
  };

  const headerConfig = getHeaderConfig();



  return (
    <div className="min-h-screen relative pb-24 overflow-x-hidden">
      <div className="mesh-gradient" />
      
      {/* Fixed Premium Header */}
      <header className="glass shadow-sm border-b border-white/40 fixed top-0 left-0 right-0 z-[100] h-[72px] flex items-center">
        <div className="max-w-4xl w-full mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Current Tab Identity */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg overflow-hidden border border-white/20`}>
                {restaurantInfo?.logo ? (
                  <img 
                    src={restaurantInfo.logo} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  headerConfig.icon
                )}
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 leading-tight uppercase tracking-tight">
                  {headerConfig.title}
                </h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-500 font-black">
                  Digital Menu Pro
                </p>
              </div>
            </div>

            {/* Right: Restaurant & Table (Compact) */}
            <div className="flex items-center space-x-2">
              <div className="glass p-1.5 pr-3 rounded-2xl flex items-center space-x-3 shadow-inner border-gray-200">
                {restaurantInfo && (
                  <div className="flex items-center space-x-2 pr-4 border-r border-gray-100">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                    <span className="text-sm font-black text-slate-800 max-w-[120px] truncate uppercase tracking-tight">{restaurantInfo.name}</span>
                  </div>
                )}
                {session.tableNumber && (
                   <div className="flex items-center space-x-1.5 pl-2">
                    <span className="text-xs font-black text-indigo-400">#</span>
                    <span className="text-xl font-black text-indigo-600 tabular-nums leading-none">{session.tableNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full pt-[72px]">
        <div className={activeTab === 'menu' ? 'block' : 'hidden'}>
          <MenuTab
            menuItems={menuItems}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getItemQuantity={getItemQuantity}
            restaurantInfo={restaurantInfo}
            session={session}
            onGoToCart={() => handleTabChange('cart')}
          />
        </div>
        
        <div className={activeTab === 'cart' ? 'block' : 'hidden'}>
          <CartTab
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getItemQuantity={getItemQuantity}
            session={session}
            onPlaceOrder={placeOrder}
          />
        </div>

        <div className={activeTab === 'orders' ? 'block' : 'hidden'}>
          <OrdersTab
            orders={orders}
            session={session}
            onRefresh={refreshOrders}
            menuItems={menuItems}
          />
        </div>

        <div className={activeTab === 'profile' ? 'block' : 'hidden'}>
          <ProfileTab
            session={session}
            onUpdateSession={(updates) => {
              updateSession(updates);
            }}
          />
        </div>
      </div>

      <BottomNav
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
        notificationCount={unreadNotifications}
        onTabChange={handleTabChange}
        activeTab={activeTab}
      />

      {/* Customer Info Modal for New Devices */}
      <AnimatePresence>
        {showCustomerInfoModal && (
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
              className="glass-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-white/50 flex flex-col"
            >
              <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-indigo-950 px-6 py-5 text-white relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                 <h2 className="text-3xl font-black tracking-tight leading-none mb-1">Welcome! 👋</h2>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mt-3">Start your dining journey</p>
              </div>

              <div className="px-6 py-5 space-y-7 overflow-y-auto max-h-[80vh] scrollbar-hide">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Your Full Name <span className="text-indigo-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerFormData.customerName}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-black shadow-inner outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Group Size <span className="text-indigo-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 shadow-inner">
                    <button
                      onClick={() => setCustomerFormData(prev => ({ ...prev, numberOfPersons: Math.max(1, prev.numberOfPersons - 1) }))}
                      className="w-14 h-14 rounded-2xl bg-white hover:bg-indigo-50 flex items-center justify-center text-xl font-black text-slate-900 shadow-sm transition-all border border-slate-100"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black text-indigo-600 flex-1 text-center tabular-nums">
                      {customerFormData.numberOfPersons}
                    </span>
                    <button
                      onClick={() => setCustomerFormData(prev => ({ ...prev, numberOfPersons: prev.numberOfPersons + 1 }))}
                      className="w-14 h-14 rounded-2xl bg-white hover:bg-indigo-50 flex items-center justify-center text-xl font-black text-slate-900 shadow-sm transition-all border border-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Mobile Sync <span className="text-slate-300 font-bold uppercase tracking-widest ml-1">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerFormData.customerPhone}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10 digit number"
                    maxLength={10}
                    className="w-full px-6 py-4.5 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-black shadow-inner outline-none transition-all placeholder:text-slate-300"
                  />
                </div>

                <button
                  onClick={async () => {
                    if (!customerFormData.customerName.trim()) {
                      toast.error('Please enter your name');
                      return;
                    }
                    updateSession({
                      customerName: customerFormData.customerName.trim(),
                      numberOfPersons: customerFormData.numberOfPersons,
                      mobileNumber: customerFormData.customerPhone || undefined
                    });
                    
                    try {
                      if (session.deviceId) {
                        await api.put('/order/device/profile', {
                          deviceId: session.deviceId,
                          customerName: customerFormData.customerName.trim(),
                          customerPhone: customerFormData.customerPhone || undefined,
                          numberOfPersons: customerFormData.numberOfPersons
                        });
                      }
                    } catch (error) {
                      console.error('Failed to sync initial profile:', error);
                    }
                    
                    setShowCustomerInfoModal(false);
                    toast.success('Ready to explore! 🍽️');
                  }}
                  disabled={!customerFormData.customerName.trim()}
                  className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                >
                  Start Experience
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pb-24">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
        {/* Placeholder BottomNav to prevent "jump" during first load */}
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center opacity-50 pointer-events-none">
          <div className="h-14 w-64 bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-lg" />
        </div>
      </div>
    }>
      <CustomerPageContent />
    </Suspense>
  );
}

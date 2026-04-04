'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '@/components/customer/BottomNav';
import MenuTab from '@/components/customer/MenuTab';
import CartTab from '@/components/customer/CartTab';
import OrdersTab from '@/components/customer/OrdersTab';
import ProfileTab from '@/components/customer/ProfileTab';
import { useCustomerSession } from '@/hooks/useCustomerSession';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { FaSpinner, FaUtensils, FaShoppingCart, FaClipboardList, FaUser, FaQrcode } from 'react-icons/fa';
import { socketService } from '@/services/socket';
import { playNotificationSound } from '@/utils/notifications';
import { Order, MenuItem, CartItem } from '@/types/order';

// Encryption key - must match the one used in tables page
const ENCRYPTION_KEY = 'dm-2026';


function CustomerPageContent() {
  const searchParams = useSearchParams();
  const { session, updateSession } = useCustomerSession();
  const [activeTab, setActiveTab] = useState('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<{ name: string; id: string; logo?: string } | null>(null);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    customerName: '',
    numberOfPersons: 1,
    customerPhone: ''
  });

  const qrParam = searchParams.get('q') || searchParams.get('qr'); // Support both new and old param
  const tableNumber = searchParams.get('table');
  const tabParam = searchParams.get('tab');

  const hasInitialized = useRef(false);

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
      let currentDeviceId = session.deviceId;
      
      // Initialize device ID if not exists
      if (!currentDeviceId) {
        currentDeviceId = uuidv4();
        updateSession({ deviceId: currentDeviceId });
      }

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
                logo: restaurantData.logo
              });

              setRestaurantInfo({
                name: restaurantName,
                id: qrData.restaurantId,
                logo: restaurantData.logo
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

            // ✅ Directly fetch menu with the restaurantId from QR — avoids stale state race condition
            setIsLoading(false);
            fetchMenuItems(qrData.restaurantId, qrData.table.toString());
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

  // Fetch menu items — accepts explicit restaurantId to avoid stale state race condition
  const fetchMenuItems = async (restaurantId?: string, tableNumber?: string) => {
    const rId = restaurantId || session.restaurantId;
    const tNum = tableNumber !== undefined ? tableNumber : (session.tableNumber || '');
    if (!rId) return;

    try {
      const response = await api.get(`/public/menu?restaurantId=${rId}&table=${tNum}`);
      const data = response.data.data;
      // Flatten grouped menu items into single array
      const flatItems = Object.values(data.menuItems).flat() as MenuItem[];
      setMenuItems(flatItems);

      // Update table capacity in session
      if (data.tableCapacity) {
        updateSession({ tableCapacity: data.tableCapacity });
      }
    } catch (error) {
      toast.error('Failed to load menu');
    }
  };

  // Returning users: if we already have a restaurantId in session (loaded from localStorage),
  // fetch the menu once loading is complete and session is ready.
  useEffect(() => {
    if (session.restaurantId && !isLoading && !qrParam) {
      fetchMenuItems(session.restaurantId, session.tableNumber || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.restaurantId, isLoading]);

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


  const fetchOrders = async () => {
    try {
      const response = await api.get(`/order/device/${session.deviceId}`);
      setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  // Real-time order updates
  useEffect(() => {
    if (session.deviceId) {
      socketService.connect();
      socketService.join(session.deviceId);
      
      // Also join restaurant room for menu updates
      if (session.restaurantId) {
        socketService.join(session.restaurantId);
        console.log('[Socket] Joined restaurant room:', session.restaurantId);
      }

      socketService.on('orderStatusUpdate', (order: Order) => {
        const statusMessages: Record<string, string> = {
          PLACED: 'Order placed successfully! 📝',
          ACCEPTED: 'Your order is being prepared! 🍳',
          COMPLETED: 'Your order has been served! 🍽️',
          REJECTED: 'Sorry, your order was rejected. ❌',
          CANCELLED: 'Your order has been cancelled. 🚫',
          RETRY: 'Verification failed. Please retry payment. 🔁',
          paymentVerified: 'Payment verified successfully! ✅',
        };

        const message = statusMessages[order.status] || `Your order status: ${order.status}`;

        // Special handling for rejected/cancelled orders with reasons
        if (order.status === 'REJECTED' && order.rejectionReason) {
          toast.error(`Order rejected: ${order.rejectionReason}`, {
            duration: 8000,
            style: {
              borderRadius: '12px',
              background: '#dc2626',
              color: '#fff',
            },
          });
        } else if (order.status === 'CANCELLED' && order.cancellationReason) {
          toast.error(`Order cancelled: ${order.cancellationReason}`, {
            duration: 8000,
            style: {
              borderRadius: '12px',
              background: '#dc2626',
              color: '#fff',
            },
          });
        } else {
          toast(message, {
            icon: order.status === 'REJECTED' || order.status === 'CANCELLED' ? '❌' : '🔔',
            duration: order.status === 'REJECTED' || order.status === 'CANCELLED' ? 8000 : 6000,
            style: {
              borderRadius: '12px',
              background: order.status === 'REJECTED' || order.status === 'CANCELLED' ? '#dc2626' : '#1e293b',
              color: '#fff',
            },
          });
        }

        playNotificationSound();

        // 🔄 SYNC STATE: Update the orders list immediately without a network fetch
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === order._id);
          if (index !== -1) {
            const newOrders = [...prevOrders];
            newOrders[index] = order;
            return newOrders;
          }
          return [order, ...prevOrders];
        });
      });

      // Listen for payment verified
      socketService.on('paymentVerified', (order: Order) => {
        toast.success('Payment verified successfully! ✅', {
          duration: 6000,
          style: {
            borderRadius: '12px',
            background: '#10b981',
            color: '#fff',
          },
        });
        playNotificationSound();

        // Update orders list
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === order._id);
          if (index !== -1) {
            const newOrders = [...prevOrders];
            newOrders[index] = order;
            return newOrders;
          }
          return prevOrders;
        });
      });

      // Listen for refund updates
      socketService.on('orderRefundUpdate', (order: Order) => {
        if (order.refund?.status === 'COMPLETED') {
          toast.success(`Refund of ₹${order.refund.amount?.toFixed(2)} processed via ${order.refund.method}! 💰`, {
            duration: 8000,
            style: {
              borderRadius: '12px',
              background: '#10b981',
              color: '#fff',
            },
          });
        } else if (order.refund?.status === 'PENDING') {
          toast('Refund is being processed... ⏳', {
            duration: 6000,
            style: {
              borderRadius: '12px',
              background: '#f59e0b',
              color: '#fff',
            },
          });
        }

        playNotificationSound();

        // Update orders list
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === order._id);
          if (index !== -1) {
            const newOrders = [...prevOrders];
            newOrders[index] = order;
            return newOrders;
          }
          return [order, ...prevOrders];
        });
      });

      // Listen for general order updates (for any other changes)
      socketService.on('orderUpdate', (order: Order) => {
        // 🔄 SYNC STATE
        setOrders(prevOrders => {
          const index = prevOrders.findIndex(o => o._id === order._id);
          if (index !== -1) {
            const newOrders = [...prevOrders];
            newOrders[index] = order;
            return newOrders;
          }
          return [order, ...prevOrders];
        });
      });

      // Listen for menu updates from admin
      socketService.on('menuUpdated', (data: { restaurantId: string }) => {
        console.log('[Socket] Menu updated by admin, refetching...');
        // Refetch menu items for current restaurant
        if (session.restaurantId && data.restaurantId === session.restaurantId) {
          fetchMenuItems(session.restaurantId, session.tableNumber || '');
          toast('Menu updated! 🍽️', {
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#10b981',
              color: '#fff',
            },
          });
        }
      });

      return () => {
        socketService.off('orderStatusUpdate');
        socketService.off('orderRefundUpdate');
        socketService.off('orderUpdate');
        socketService.off('paymentVerified');
        socketService.off('menuUpdated');
      };
    }
  }, [session.deviceId, session.restaurantId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);

    // Fetch data when switching to orders tab
    if (tab === 'orders') {
      fetchOrders();
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

  const placeOrder = async (paymentMethod: 'COUNTER' | 'ONLINE', utr?: string, specialInstructions?: string) => {
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
        fetchOrders();
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
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

  const tabVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <MenuTab
            menuItems={menuItems}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getItemQuantity={getItemQuantity}
            restaurantInfo={restaurantInfo}
            session={session}
            onGoToCart={() => setActiveTab('cart')}
          />
        );
      case 'cart':
        return (
          <CartTab
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getItemQuantity={getItemQuantity}
            session={session}
            onPlaceOrder={placeOrder}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            orders={orders}
            session={session}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            session={session}
            onUpdateSession={(updates) => {
              updateSession(updates);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Fixed Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-40 h-[72px] flex items-center">
        <div className="max-w-4xl w-full mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Current Tab Identity */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${headerConfig.color} flex items-center justify-center text-white shadow-lg overflow-hidden`}>
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
                <h1 className="text-lg font-black text-gray-900 leading-tight">
                  {headerConfig.title}
                </h1>
                <p className="text-[10px] uppercase tracking-tighter text-gray-400 font-black">
                  Digital Menu
                </p>
              </div>
            </div>

            {/* Right: Restaurant & Table (Compact) */}
            <div className="flex items-center space-x-2">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-1.5 flex items-center space-x-3 shadow-inner">
                {restaurantInfo && (
                  <div className="flex items-center space-x-2 pr-3 border-r border-gray-200">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                    {restaurantInfo.logo && (
                      <img 
                        src={restaurantInfo.logo} 
                        alt="Restaurant Logo" 
                        className="w-5 h-5 rounded-md object-cover border border-gray-200 shadow-sm"
                      />
                    )}
                    <span className="text-[11px] font-bold text-gray-700 max-w-[80px] truncate">{restaurantInfo.name}</span>
                  </div>
                )}
                {session.tableNumber && (
                   <div className="flex items-center space-x-1.5 pl-1">
                    <span className="text-[10px] font-black text-indigo-400">#</span>
                    <span className="text-xs font-black text-indigo-600">{session.tableNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full"
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                <h2 className="text-xl font-black">Welcome! 👋</h2>
                <p className="text-sm opacity-90 mt-1">Please tell us about yourself</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerFormData.customerName}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Number of Persons <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCustomerFormData(prev => ({ ...prev, numberOfPersons: Math.max(1, prev.numberOfPersons - 1) }))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                    >
                      -
                    </button>
                    <span className="text-xl font-black text-indigo-600 w-8 text-center">
                      {customerFormData.numberOfPersons}
                    </span>
                    <button
                      onClick={() => setCustomerFormData(prev => ({ ...prev, numberOfPersons: prev.numberOfPersons + 1 }))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Mobile Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={customerFormData.customerPhone}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10 digit mobile number"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    
                    // Update DB for active orders (first popup only)
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
                      console.error('Failed to sync initial profile to orders:', error);
                    }
                    
                    setShowCustomerInfoModal(false);
                    toast.success('Welcome! You can now place your order.');
                  }}
                  disabled={!customerFormData.customerName.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Ordering 🍽️
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <CustomerPageContent />
    </Suspense>
  );
}

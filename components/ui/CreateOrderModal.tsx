'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  FaTimes,
  FaPlus,
  FaMinus,
  FaTrash,
  FaUtensils,
  FaMoneyBillWave,
  FaUser,
  FaPhone,
  FaHashtag,
  FaChair,
  FaShoppingBag,
  FaTruck,
  FaCommentDots,
  FaCreditCard,
  FaUsers
} from 'react-icons/fa';

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  offerPrice?: number;
  category: string;
  foodType?: string;
  description?: string;
  ingredients?: string;
  preparationMethod?: string;
  image?: string;
  isActive: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    tableNumber: '',
    numberOfPersons: '1',
    orderType: 'dine-in' as 'dine-in' | 'takeaway' | 'delivery',
    specialInstructions: '',
    paymentMethod: 'CASH' as 'CASH' | 'ONLINE'
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchMenuItems();
    }
  }, [isOpen, user]);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const restaurantId = user?.id || user?._id;
      console.log('Fetching menu for restaurantId:', restaurantId);
      console.log('User object:', user);
      if (!restaurantId) {
        toast.error('Restaurant ID not found. Please login again.');
        return;
      }
      const response = await api.get(`/menu/${restaurantId}`);
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data?.data);
      const items = response.data?.data || [];
      console.log('Items before filter:', items);
      console.log('Items after isActive filter:', items.filter((item: MenuItem) => item.isActive));
      setMenuItems(items.filter((item: MenuItem) => item.isActive));
    } catch (error: any) {
      console.error('Failed to load menu items:', error);
      toast.error(error.response?.data?.message || 'Failed to load menu items');
    } finally {
      setIsLoading(false);
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

  const updateQuantity = (itemId: string, change: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item._id === itemId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item._id !== itemId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.offerPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('Please add items to the order');
      return;
    }

    if (!formData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    // Validate dine-in specific fields
    if (formData.orderType === 'dine-in') {
      if (!formData.tableNumber.trim()) {
        toast.error('Please enter table number for dine-in order');
        return;
      }
      if (!formData.numberOfPersons || parseInt(formData.numberOfPersons) < 1) {
        toast.error('Please enter valid number of persons');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const orderData = {
        ...formData,
        tableNumber: formData.orderType === 'dine-in' ? parseInt(formData.tableNumber) || 0 : undefined,
        numberOfPersons: formData.orderType === 'dine-in' ? parseInt(formData.numberOfPersons) || 1 : undefined,
        items: cart.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.offerPrice || item.price,
          quantity: item.quantity,
          offerPrice: item.offerPrice
        })),
        totalAmount: calculateTotal(),
        deviceId: 'counter-order',
        sessionId: `counter-${Date.now()}`,
        status: 'PLACED'
      };

      await api.post('/order/create-admin', orderData);
      toast.success('Order created successfully!');
      
      // Reset form
      setCart([]);
      setFormData({
        customerName: '',
        customerPhone: '',
        tableNumber: '',
        numberOfPersons: '1',
        orderType: 'dine-in',
        specialInstructions: '',
        paymentMethod: 'CASH'
      });
      
      onOrderCreated();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Debug logging
  console.log('Menu items:', menuItems);
  console.log('Grouped items:', groupedItems);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <FaUtensils className="text-xl sm:text-2xl" />
                  <h2 className="text-lg sm:text-2xl font-bold">Create Counter Order</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden" style={{ minHeight: 0 }}>
              {/* Left Side - Menu Items */}
              <div className="flex-none lg:flex-1 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaUtensils className="text-indigo-600" />
                    Menu Items
                  </h3>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                      <FaUtensils className="text-4xl mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No menu items available</p>
                      <p className="text-sm mt-2">Please add active menu items to your restaurant menu</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedItems).map(([category, items]) => (
                        <div key={category}>
                          <h4 className="font-medium text-gray-700 mb-3">{category}</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {items.map(item => {
                              const price = item.offerPrice || item.price;
                              const hasDiscount = item.offerPrice && item.offerPrice < item.price;
                              
                              return (
                                <div
                                  key={item._id}
                                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-indigo-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                                  onClick={() => addToCart(item)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                                          {item.name}
                                        </h5>
                                        {hasDiscount && (
                                          <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                                            {Math.round((1 - item.offerPrice! / item.price) * 100)}% OFF
                                          </span>
                                        )}
                                      </div>
                                      {item.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                      )}
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg font-bold text-indigo-600">₹{price}</span>
                                          {hasDiscount && (
                                            <span className="text-sm text-gray-400 line-through">₹{item.price}</span>
                                          )}
                                        </div>
                                        {item.category && (
                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(item);
                                        }}
                                        className="w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center group-hover:scale-110"
                                      >
                                        <FaPlus className="text-sm" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Order Details */}
              <div className="w-full lg:w-[420px] flex flex-col bg-white flex-none shrink-0 lg:shrink-none">
                {/* Scrollable Content Area */}
                <div className="flex-1 lg:overflow-y-auto">
                  {/* Customer Details */}
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-b from-white to-gray-50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="text-indigo-600" />
                    Customer Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                        <FaUser className="text-xs text-gray-400" />
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Enter customer name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                        <FaPhone className="text-xs text-gray-400" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3">Order Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, orderType: 'dine-in' })}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            formData.orderType === 'dine-in'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:shadow-md'
                          }`}
                        >
                          <FaChair className="mx-auto mb-1" />
                          <span className="text-xs font-semibold">Dine In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, orderType: 'takeaway' })}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            formData.orderType === 'takeaway'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-105'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:shadow-md'
                          }`}
                        >
                          <FaShoppingBag className="mx-auto mb-1" />
                          <span className="text-xs font-semibold">Takeaway</span>
                        </button>
                      </div>
                    </div>

                    {formData.orderType === 'dine-in' && (
                      <>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                          <label className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <FaHashtag className="text-indigo-600" />
                            Table Number *
                          </label>
                          <input
                            type="number"
                            value={formData.tableNumber}
                            onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            placeholder="Enter table number"
                            required
                          />
                        </div>

                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                          <label className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <FaUsers className="text-indigo-600" />
                            Number of Persons *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={formData.numberOfPersons}
                            onChange={(e) => setFormData({ ...formData, numberOfPersons: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            placeholder="Number of guests"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[80px] active:scale-95 ${
                            formData.paymentMethod === 'CASH'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:shadow-md'
                          }`}
                        >
                          <FaMoneyBillWave className="w-6 h-6" />
                          <span className="text-sm font-semibold">Cash</span>
                          <span className="text-xs opacity-80">Pay at counter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: 'ONLINE' })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[80px] active:scale-95 ${
                            formData.paymentMethod === 'ONLINE'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:shadow-md'
                          }`}
                        >
                          <FaCreditCard className="w-6 h-6" />
                          <span className="text-sm font-semibold">Online</span>
                          <span className="text-xs opacity-80">UPI/Card/NetBanking</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions
                      </label>
                      <textarea
                        value={formData.specialInstructions}
                        onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={2}
                        placeholder="Any special requests..."
                      />
                    </div>
                  </div>
                </div>

                {/* Cart Summary - Always Visible */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-t border-indigo-100 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FaShoppingBag className="text-indigo-600" />
                      Order Summary
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No items added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add items from the menu to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.slice(0, 3).map(item => {
                        const price = item.offerPrice || item.price;
                        const itemTotal = price * item.quantity;
                        return (
                          <div key={item._id} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <span className="text-gray-500 ml-2">×{item.quantity}</span>
                            </div>
                            <span className="font-medium text-gray-900">₹{itemTotal.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      
                      {cart.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">+{cart.length - 3} more items</p>
                      )}
                      
                      <div className="pt-3 border-t border-indigo-200 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                          <span className="text-xl font-bold text-indigo-600">₹{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart Details */}
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Order Details</h3>
                    {cart.length > 0 && (
                      <span className="text-sm text-gray-500">
                        Click items to modify quantity
                      </span>
                    )}
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <FaUtensils className="text-4xl text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Your cart is empty</p>
                      <p className="text-sm text-gray-400 mt-2">Browse menu items and add them to your order</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map(item => {
                        const price = item.offerPrice || item.price;
                        const itemTotal = price * item.quantity;
                        const hasDiscount = item.offerPrice && item.offerPrice < item.price;
                        
                        return (
                          <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-semibold text-gray-900">{item.name}</h5>
                                  {hasDiscount && (
                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                                      {Math.round((1 - item.offerPrice! / item.price) * 100)}% OFF
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>₹{price} × {item.quantity}</span>
                                  <span className="font-semibold text-gray-900">= ₹{itemTotal.toFixed(2)}</span>
                                </div>
                                
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item._id, -1)}
                                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                                  disabled={item.quantity <= 1}
                                >
                                  <FaMinus className="text-xs" />
                                </button>
                                <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item._id, 1)}
                                  className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center"
                                >
                                  <FaPlus className="text-xs" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center ml-2"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Order Total Summary */}
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-4 mt-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm opacity-90">Order Total</p>
                            <p className="text-2xl font-bold">₹{calculateTotal().toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm opacity-90">{cart.length} Items</p>
                            <p className="text-xs opacity-75">
                              {formData.orderType === 'dine-in' ? `Table ${formData.tableNumber || 'Not set'}` : formData.orderType}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
                {/* End of scrollable content */}

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                    >
                      Cancel Order
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || cart.length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Order...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <FaPlus />
                          Create Order
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

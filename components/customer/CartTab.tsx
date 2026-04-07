'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';


interface CartTabProps {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  session: any;
  onPlaceOrder: (paymentMethod: 'CASH' | 'ONLINE', utr?: string, specialInstructions?: string) => void;
}

export default function CartTab({
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  session,
  onPlaceOrder
}: CartTabProps) {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.offerPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    // Directly place order with temporary defaults; payment happens post-order
    await onPlaceOrder('CASH', '', specialInstructions);
    setIsSubmitting(false);
    setSpecialInstructions('');
  };


  const calculateSavings = () => {
    return cart.reduce((total, item) => {
      if (item.offerPrice && item.price > item.offerPrice) {
        return total + ((item.price - item.offerPrice) * item.quantity);
      }
      return total;
    }, 0);
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <FaShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
          <p className="text-gray-500 mt-2">Add some delicious items from the menu</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {(item.image || (item.images && item.images.length > 0)) ? (
                  <Image
                    src={item.image || (item.images && item.images[0]) || ''}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaShoppingCart className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-3">
                  <div className="flex items-center gap-2">
                    {item.offerPrice ? (
                      <>
                        <span className="text-lg font-bold text-indigo-600">
                          ₹{item.offerPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ₹{item.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-indigo-600">
                        ₹{item.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 touch-manipulation"
                      >
                        <FaMinus className="w-4 h-4 sm:w-3 sm:h-3" />
                      </button>
                      <span className="text-base sm:text-sm font-medium w-10 sm:w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-10 h-10 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 touch-manipulation"
                      >
                        <FaPlus className="w-4 h-4 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="w-10 h-10 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 touch-manipulation"
                    >
                      <FaTrash className="w-4 h-4 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
          </div>

          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-indigo-600">
                ₹{calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Instructions (Optional)
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
            placeholder="Any special requests for your order..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {specialInstructions.length}/500
          </p>
        </div>

        {/* Payment Instructions */}
        <div className="mt-6 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
          <p className="text-xs text-indigo-700 leading-relaxed">
            <span className="font-bold">How to Pay: </span>
            Place your order now. You can pay at the counter later, or pay online and verify your payment in the "Orders" tab.
          </p>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? 'Placing Order...' : 'Order Now'}
        </button>
      </div>
    </main>
  );
}

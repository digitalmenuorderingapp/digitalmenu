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
    await onPlaceOrder('CASH', '', specialInstructions);
    setIsSubmitting(false);
    setSpecialInstructions('');
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 relative min-h-[60vh] flex flex-col items-center justify-center">
        <div className="mesh-gradient" />
        <div className="text-center py-16 glass-card p-12 rounded-2xl border-white/50">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <FaShoppingCart className="w-10 h-10 text-indigo-300 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your cart is empty</h3>
          <p className="text-slate-500 mt-2 font-medium">Add some delicious items from the menu</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pt-8 pb-36 relative min-h-screen">
      <div className="mesh-gradient" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Order</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{cart.length} {cart.length === 1 ? 'Item' : 'Items'} selected</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-6 mb-12">
        {cart.map((item) => (
          <div key={item._id} className="glass-card rounded-2xl p-5 border-white/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center space-x-5">
              <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-gray-100">
                {(item.image || (item.images && item.images.length > 0)) ? (
                  <Image
                    src={item.image || (item.images && item.images[0]) || ''}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50/50">
                    <FaShoppingCart className="w-10 h-10 text-indigo-200" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{item.foodType}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">₹{(item.offerPrice || item.price).toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center glass p-1 rounded-2xl border-gray-200 shadow-inner">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 hover:bg-gray-100 transition-all font-bold"
                    >
                      <FaMinus className="w-3 h-3" />
                    </button>
                    <span className="text-base font-black w-10 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-lg"
                    >
                      <FaPlus className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="w-10 h-10 glass text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-50 transition-all border-rose-100"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border-white/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <FaShoppingCart className="text-white w-4 h-4" />
          </div>
          Order Summary
        </h2>

        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 font-bold uppercase tracking-widest">Subtotal</span>
            <span className="font-black text-slate-900">₹{calculateTotal().toFixed(0)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
             <span className="text-slate-500 font-bold uppercase tracking-widest">Delivery/Service</span>
             <span className="font-black text-emerald-500">FREE</span>
          </div>

          <div className="h-px bg-slate-200/50 my-4" />

          <div className="flex justify-between items-center">
            <span className="text-lg font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
            <div className="text-right">
              <span className="text-3xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none">
                ₹{calculateTotal().toFixed(0)}
              </span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Incl. all taxes</p>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mt-8 mb-8">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
            Special Instructions
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value.slice(0, 500))}
            placeholder="Add a note (e.g., less spicy, no onions)..."
            rows={2}
            className="w-full px-5 py-4 bg-white/50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-medium resize-none shadow-inner"
          />
        </div>

        {/* Payment Instructions */}
        <div className="mb-8 glass p-4 rounded-2xl border-indigo-100 flex items-start gap-3">
          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-indigo-600 text-[10px] font-black">!</span>
          </div>
          <p className="text-[11px] text-indigo-700 leading-relaxed font-bold">
            Place your order now. You can pay at the counter or online via the "Orders" tab after placement.
          </p>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white py-4 rounded-xl text-sm font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <span className="relative z-10">{isSubmitting ? 'Processing...' : 'Place Order'}</span>
        </button>
      </div>
    </main>
  );
}

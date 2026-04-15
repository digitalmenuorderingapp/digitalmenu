'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cartInstructionsSchema, CartInstructionsInput } from '@/lib/validations';


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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<CartInstructionsInput>({
    resolver: zodResolver(cartInstructionsSchema),
    defaultValues: {
      specialInstructions: ''
    }
  });

  const specialInstructions = watch('specialInstructions');

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.offerPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const onFormSubmit = async (data: CartInstructionsInput) => {
    await onPlaceOrder('CASH', '', data.specialInstructions);
    reset();
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-4 relative min-h-[60vh] flex flex-col items-center justify-center">
        <div className="mesh-gradient" />
        <div className="text-center py-8 glass-card p-6 rounded-2xl border-white/50">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <FaShoppingCart className="w-6 h-6 text-indigo-300 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Your cart is empty</h3>
          <p className="text-slate-500 mt-1 text-sm font-medium">Add some delicious items from the menu</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pt-4 pb-36 relative min-h-screen">
      <div className="mesh-gradient" />
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Order</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{cart.length} {cart.length === 1 ? 'Item' : 'Items'} selected</p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div key={item._id} className="glass-card rounded-xl p-3 border-white/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-lg border border-gray-100">
                {(item.image || (item.images && item.images.length > 0)) ? (
                  <Image
                    src={item.image || (item.images && item.images[0]) || ''}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50/50">
                    <FaShoppingCart className="w-6 h-6 text-indigo-200" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{item.foodType}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">₹{(item.offerPrice || item.price).toFixed(0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center glass p-1 rounded-xl border-gray-200 shadow-inner">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-gray-100 transition-all font-bold"
                    >
                      <FaMinus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-sm font-black w-7 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-lg"
                    >
                      <FaPlus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                   
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="w-7 h-7 glass text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-50 transition-all border-rose-100"
                  >
                    <FaTrash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="glass-card rounded-xl p-4 border-white/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12" />
        
        <h2 className="text-base font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center">
            <FaShoppingCart className="text-white w-3 h-3" />
          </div>
          Order Summary
        </h2>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-widest">Subtotal</span>
            <span className="font-black text-slate-900">₹{calculateTotal().toFixed(0)}</span>
          </div>
          
          <div className="flex justify-between text-xs">
             <span className="text-slate-500 font-bold uppercase tracking-widest">Delivery/Service</span>
             <span className="font-black text-emerald-500">FREE</span>
          </div>

          <div className="h-px bg-slate-200/50 my-2" />

          <div className="flex justify-between items-center">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
            <div className="text-right">
              <span className="text-xl font-black text-indigo-600 tracking-tighter tabular-nums leading-none">
                ₹{calculateTotal().toFixed(0)}
              </span>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Incl. all taxes</p>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mt-4 mb-4">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
            Special Instructions
          </label>
          <textarea
            {...register('specialInstructions')}
            placeholder="Add a note (e.g., less spicy, no onions)..."
            rows={2}
            className="w-full px-3 py-2 bg-white/50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-50 focus:border-indigo-500 text-xs font-medium resize-none shadow-inner"
          />
        </div>

        {/* Payment Instructions */}
        <div className="mb-4 glass p-3 rounded-xl border-indigo-100 flex items-start gap-2">
          <div className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-indigo-600 text-[9px] font-black">!</span>
          </div>
          <p className="text-[10px] text-indigo-700 leading-relaxed font-bold">
            Place your order now. You can pay at the counter or online via the "Orders" tab after placement.
          </p>
        </div>

        <button
          onClick={handleSubmit(onFormSubmit)}
          disabled={isSubmitting}
          className="w-full bg-slate-900 text-white py-3 rounded-lg text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
          <span className="relative z-10">{isSubmitting ? 'Processing...' : 'Place Order'}</span>
        </button>
      </div>
    </main>
  );
}

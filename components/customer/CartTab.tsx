'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaPlus, FaMinus, FaTrash, FaShoppingCart, FaMoneyBillWave, FaCreditCard, FaSpinner } from 'react-icons/fa';
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
  restaurantInfo: any;
  onPlaceOrder: (paymentMethod: 'CASH' | 'ONLINE', utr?: string, specialInstructions?: string) => void;
}

export default function CartTab({
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  session,
  restaurantInfo,
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

  const calculateDetailedTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const config = restaurantInfo?.gstConfig || { gstEnabled: false, serviceChargeEnabled: false };
    
    let serviceCharge = 0;
    if (config.serviceChargeEnabled && config.serviceChargePercentage > 0) {
      serviceCharge = (subtotal * config.serviceChargePercentage) / 100;
    }
    
    const taxableAmount = subtotal + serviceCharge;
    
    let totalGst = 0;
    let sgst = 0;
    let cgst = 0;
    if (config.gstEnabled) {
      sgst = (taxableAmount * (config.sgstPercentage || 0)) / 100;
      cgst = (taxableAmount * (config.cgstPercentage || 0)) / 100;
      totalGst = sgst + cgst;
    }
    
    const rawTotal = taxableAmount + totalGst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = grandTotal - rawTotal;
    
    return {
      subtotal,
      serviceCharge,
      sgst,
      cgst,
      totalGst,
      roundOff,
      grandTotal,
      taxableAmount,
      config
    };
  };

  const totals = calculateDetailedTotal();
  const calculateTotal = () => totals.grandTotal;

  const onFormSubmit = async (data: CartInstructionsInput) => {
    await onPlaceOrder('CASH', '', data.specialInstructions);
    reset();
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8 relative min-h-[70vh] flex flex-col items-center justify-center">
        <div className="mesh-gradient opacity-30" />
        <div className="text-center py-12 glass-card p-10 rounded-[2.5rem] border-white/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-indigo-50 relative z-10 group-hover:scale-110 transition-transform duration-500">
            <FaShoppingCart className="w-10 h-10 text-indigo-400 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight relative z-10">Your cart is empty</h3>
          <p className="text-slate-500 mt-2 text-base font-medium relative z-10">Add some delicious items from the menu</p>
          <div className="mt-8 relative z-10">
             <div className="h-1.5 w-12 bg-indigo-100 rounded-full mx-auto" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pt-6 pb-40 relative min-h-screen">
      <div className="mesh-gradient opacity-20" />
      
      <div className="flex items-end justify-between mb-8 px-1">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">My Cart</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md shadow-lg shadow-indigo-100">
              {cart.reduce((total, item) => total + item.quantity, 0)} {cart.length === 1 && cart[0].quantity === 1 ? 'Item' : 'Items'}
            </span>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">selected</p>
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4 mb-10">
        {cart.map((item) => (
          <div key={item._id} className="group relative glass-card rounded-[1.75rem] p-4 border-white/60 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center gap-4 relative z-10">
              {/* Item Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl overflow-hidden flex-shrink-0 shadow-xl border border-gray-100/50 relative group-hover:scale-105 transition-transform duration-500">
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
                    <FaShoppingCart className="w-8 h-8 text-indigo-100" />
                  </div>
                )}
                {/* Quantity Badge on Mobile */}
                <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg sm:hidden">
                  {item.quantity}
                </div>
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-20 sm:h-24">
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'} shadow-sm`}></span>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.foodType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 tabular-nums leading-none">₹{item.price.toFixed(0)}</div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Per Unit</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                   {/* Modern Quantity Selector */}
                  <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 shadow-inner">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-rose-500 transition-all font-bold active:scale-90"
                    >
                      {item.quantity === 1 ? <FaTrash className="w-3 h-3" /> : <FaMinus className="w-2.5 h-2.5" />}
                    </button>
                    <div className="w-8 sm:w-10 text-center flex flex-col items-center">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {item.quantity}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white hover:bg-indigo-600 transition-all shadow-lg active:scale-90"
                    >
                      <FaPlus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Subtotal for Item */}
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total</span>
                    <span className="text-sm font-black text-indigo-600 tabular-nums">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary Section */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden bg-white/80 backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                <FaShoppingCart className="text-white w-3.5 h-3.5" />
              </div>
              Bill Summary
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-6 hidden sm:block" />
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">Subtotal</span>
                <p className="text-[10px] text-slate-400 font-bold italic lowercase">Items total before taxes & charges</p>
              </div>
              <span className="text-lg font-black text-slate-900 tabular-nums">₹{totals.subtotal.toFixed(2)}</span>
            </div>

            {totals.config.serviceChargeEnabled && totals.serviceCharge > 0 && (
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">Service Charge</span>
                  <p className="text-[10px] text-slate-400 font-bold italic lowercase">Restaurant service fee ({totals.config.serviceChargePercentage}%)</p>
                </div>
                <span className="text-lg font-black text-slate-900 tabular-nums">₹{totals.serviceCharge.toFixed(2)}</span>
              </div>
            )}

            {totals.config.gstEnabled && (
              <>
                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">SGST ({totals.config.sgstPercentage}%)</span>
                  </div>
                  <span className="text-lg font-black text-slate-900 tabular-nums">₹{totals.sgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">CGST ({totals.config.cgstPercentage}%)</span>
                  </div>
                  <span className="text-lg font-black text-slate-900 tabular-nums">₹{totals.cgst.toFixed(2)}</span>
                </div>
                {totals.config.igstPercentage > 0 && (
                  <div className="flex justify-between items-center px-1">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">IGST ({totals.config.igstPercentage}%)</span>
                    </div>
                    <span className="text-lg font-black text-slate-900 tabular-nums">₹{((totals.taxableAmount * totals.config.igstPercentage) / 100).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">Delivery & Service</span>
                <p className="text-[10px] text-slate-400 font-bold italic lowercase">Digital order convenience</p>
              </div>
              <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter">FREE</span>
            </div>

            {Math.abs(totals.roundOff) > 0 && (
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">Round Off</span>
                </div>
                <span className="text-lg font-black text-slate-900 tabular-nums">{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
              </div>
            )}

            <div className="h-px bg-slate-200/50 my-2" />

            <div className="flex justify-between items-center px-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Payable</span>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Grand Total</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">₹{totals.grandTotal}</span>
                <p className="text-[10px] text-slate-400 font-bold italic leading-none">inclusive of all taxes</p>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Cooking Instructions
              </label>
              {specialInstructions && (
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Note Added</span>
              )}
            </div>
            <textarea
              {...register('specialInstructions')}
              placeholder="E.g. Make it extra spicy, no onions, etc..."
              rows={2}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-semibold text-slate-700 placeholder:text-slate-300 resize-none shadow-inner transition-all"
            />
          </div>

          {/* Payment Help Note */}
          <div className="mb-8 group cursor-default">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-5 rounded-2xl flex items-start gap-4 shadow-xl shadow-indigo-100/50 transition-all duration-500 hover:scale-[1.01]">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                <FaCreditCard className="text-indigo-200 w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Flexi-Pay System</h4>
                <p className="text-[10px] text-indigo-200/80 leading-relaxed font-medium">
                  Confirm your order now. You can settle the bill via <span className="text-white font-black">Cash at Counter</span> or <span className="text-white font-black">Instant UPI</span> once the order is accepted.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.15)] active:scale-[0.97] disabled:opacity-50 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 opacity-20" />
            <span className="relative z-10 flex items-center justify-center gap-4">
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending Order...
                </>
              ) : (
                <>
                  Confirm & Place Order
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

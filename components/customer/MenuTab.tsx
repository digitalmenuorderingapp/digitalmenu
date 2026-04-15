'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaPlus, FaMinus, FaLeaf, FaDotCircle, FaSlidersH, FaTimes, FaShoppingCart, FaSpinner, FaEdit, FaCheck } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';
import EditProfileModal from './EditProfileModal';

interface MenuTabProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  restaurantInfo: { name: string; id: string; logo?: string; motto?: string } | null;
  session: any;
  onGoToCart?: () => void;
}

export default function MenuTab({
  menuItems,
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  restaurantInfo,
  session,
  onGoToCart
}: MenuTabProps) {
  const [activeFoodType, setActiveFoodType] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Auto-slide effect for item images
  useEffect(() => {
    if (!selectedItem) {
      setCurrentImageIndex(0);
      return;
    }

    const images = (selectedItem.images && selectedItem.images.length > 0) 
      ? selectedItem.images 
      : [selectedItem.image].filter(Boolean);
      
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedItem]);

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const foodTypes = Array.from(
    new Set(
      menuItems
        .map(item => item.foodType)
        .filter(Boolean) as string[]
    )
  ).sort();

  const filteredItems = activeFoodType
    ? menuItems.filter(item => item.foodType?.toLowerCase() === activeFoodType.toLowerCase())
    : menuItems;

  return (
    <div className="relative min-h-screen">
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient" />

      <main className="max-w-4xl mx-auto">
        {/* DARK STATIC WELCOME CARD */}
        {(restaurantInfo || session.customerName) && session.customerName && (
          <div className="px-4 py-2 relative">
            <div className="bg-slate-900 rounded-2xl shadow-lg overflow-hidden relative">
              <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                      <span className="text-xl">👋</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1.5 leading-none mb-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active</p>
                      </div>
                      <h2 className="text-lg font-black text-white tracking-tight leading-none">
                        {session.customerName}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2.5 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700">
                      <div className="text-right">
                         <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Guests</p>
                         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                           {session.numberOfPersons === 1 ? 'Solo' : 'Group'}
                         </p>
                      </div>
                      <div className="w-px h-5 bg-slate-700" />
                      <span className="text-xl font-black text-white leading-none tabular-nums">{session.numberOfPersons || 1}</span>
                    </div>
                    
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      <FaEdit className="text-slate-300 w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modern Sticky Category Ribbon */}
      <div className="sticky top-[80px] z-[60] glass border-b border-gray-200/50 shadow-sm overflow-hidden">
        <div className="max-w-4xl mx-auto flex items-center">
          <div className="flex-shrink-0 pl-4 py-4 pr-2 border-r border-gray-100">
             <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <FaUtensils className="text-white w-4 h-4" />
             </div>
          </div>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide py-4 px-2">
            <div className="flex items-center gap-2 whitespace-nowrap min-w-max px-2">
              <button
                onClick={() => setActiveFoodType('')}
                className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  !activeFoodType 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                    : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-200'
                }`}
              >
                Explore All
              </button>
              
              {foodTypes.map((type) => {
                const isActive = activeFoodType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFoodType(type)}
                    className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                        : 'bg-white text-gray-400 hover:text-gray-900 border border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No items match your filter
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const qty = getItemQuantity(item._id);
              const isVeg = item.isVeg ?? (item.foodType?.toLowerCase() === 'veg');

              return (
                <motion.div 
                  key={item._id} 
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-white/60 backdrop-blur-md rounded-2xl p-4 flex flex-col h-full border border-white/50 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
                    <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-700 ease-out">
                      {(item.images?.length || 0) > 0 || item.image ? (
                        <Image
                          src={item.images?.[0] || item.image || ''}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-indigo-50/50 text-indigo-200">
                          <FaUtensils className="w-12 h-12 opacity-20 rotate-12" />
                        </div>
                      )}
                    </div>
                    
                    {/* Gradient Overlay for better contrast */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                  </div>

                  {/* Badges Row - At top of content */}
                  <div className="pt-4 pb-1 flex items-center gap-2 flex-wrap">
                     {item.isBestSeller && (
                      <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md shadow-lg shadow-amber-200 flex items-center gap-1.5 animate-pulse-glow">
                        <span className="text-xs">⭐</span> Best Seller
                      </span>
                     )}
                    
                     <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] rounded-md flex items-center gap-1.5 border ${isVeg ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                       <span className={`w-2 h-2 rounded-full border-2 ${isVeg ? 'bg-emerald-500 border-emerald-200' : 'bg-rose-500 border-rose-200'}`}></span>
                       {isVeg ? 'Vegetarian' : 'Non-Veg'}
                     </span>
                  </div>

                  {/* Content */}
                  <div className="pt-3 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex-1 min-w-0 pr-3">
                          <h3 className="text-lg font-black text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-sm">
                              {item.foodType}
                            </span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end flex-shrink-0">
                            {item.offerPrice ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-indigo-600 leading-none">₹{item.offerPrice.toFixed(0)}</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-slate-400 line-through">₹{item.price.toFixed(0)}</span>
                                  <span className="text-[9px] font-black text-rose-500">-{Math.round(((item.price - item.offerPrice) / item.price) * 100)}%</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xl font-black text-indigo-600 leading-none">₹{item.price.toFixed(0)}</span>
                            )}
                       </div>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 mb-5 line-clamp-2 leading-relaxed opacity-70 italic">
                      {item.description || 'A unique culinary journey designed by our master chefs for your pleasure.'}
                    </p>

                    {/* Add to Cart */}
                    <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                       <AnimatePresence mode="wait">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full h-11 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-900 hover:text-white active:scale-95 transition-all flex items-center rounded-xl justify-center gap-2 group/btn shadow-lg shadow-slate-200 overflow-hidden relative"
                            >
                              <div className="absolute inset-0 bg-slate-900 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                              <FaPlus className="relative z-10 w-2.5 h-2.5 transition-transform group-hover/btn:rotate-90" />
                              <span className="relative z-10">Add to Order</span>
                            </button>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center w-full h-11 bg-indigo-600 rounded-xl p-1 shadow-xl shadow-indigo-100 overflow-hidden relative"
                            >
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="w-10 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <div className="flex-1 flex flex-col items-center justify-center">
                                <span className="text-xs font-black text-white tabular-nums leading-none tracking-tight">{qty}</span>
                                <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest mt-0.5">Selected</span>
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-10 h-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                              >
                                <FaPlus className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/60 z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto glass-card rounded-t-2xl z-[120] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden will-change-transform border-white/40"
            >
              <div className="w-16 h-1.5 bg-gray-200/50 rounded-full mx-auto my-1 shrink-0 shadow-inner" />
              
              {/* Top Header Bar with Close Button */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                  {/* Best Seller Badge */}
                  {selectedItem.isBestSeller && (
                    <motion.div 
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-md shadow-xl shadow-amber-200/40 uppercase tracking-widest flex items-center gap-2"
                    >
                      <span className="text-xs">⭐</span>
                      <span>Best Seller</span>
                    </motion.div>
                  )}
                  {/* Veg/Non-Veg Badge */}
                  <div className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 animate-pulse ${(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'border-emerald-400 bg-emerald-500' : 'border-red-400 bg-red-500'}`} />
                    {(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'Vegetarian' : 'Non-Veg'}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-12 h-12 glass rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-200 shadow-sm active:scale-90"
                >
                  <FaTimes className="text-gray-900 w-5 h-5" />
                </button>
              </div>
                <div className="overflow-y-auto px-5 pb-36 flex-1 scrollbar-hide">
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden shadow-2xl mb-6 group/gallery bg-slate-50">
                  <AnimatePresence mode="wait">
                    {((selectedItem.images && selectedItem.images.length > 0) || selectedItem.image) ? (
                      <div className="relative w-full h-full overflow-hidden">
                        {/* Image Gallery */}
                        <div className="relative h-full w-full">
                          <AnimatePresence mode="wait">
                            {((selectedItem.images && selectedItem.images.length > 0) ? selectedItem.images : [selectedItem.image]).map((img, idx) => (
                              idx === currentImageIndex && (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                  const swipeThreshold = 50;
                                  const images = selectedItem.images || [selectedItem.image];
                                  if (info.offset.x < -swipeThreshold) {
                                    setCurrentImageIndex((prev) => (prev + 1) % images.length);
                                  } else if (info.offset.x > swipeThreshold) {
                                    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                                  }
                                }}
                                className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
                              >
                                <Image 
                                  src={img || ''} 
                                  alt={`${selectedItem.name} ${idx + 1}`} 
                                  fill 
                                  className="object-cover pointer-events-none" 
                                  priority
                                />
                              </motion.div>
                            )
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {/* Gallery Indicator */}
                      {((selectedItem.images && selectedItem.images.length > 1) || (!selectedItem.images?.length && false)) && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-none">
                          {((selectedItem.images && selectedItem.images.length > 0) ? selectedItem.images : [selectedItem.image]).map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/40'
                              }`} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                      <FaUtensils className="w-20 h-20 opacity-40" />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                      {selectedItem.name}
                    </h2>
                  </div>
                  <div className="flex flex-col items-end bg-gray-900 text-white p-3 sm:p-4 rounded-xl sm:rounded-[2rem] shadow-xl">
                    {selectedItem.offerPrice ? (
                      <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap justify-end">
                        <span className="text-xl sm:text-2xl md:text-3xl font-black leading-none">₹{selectedItem.offerPrice}</span>
                        <span className="text-sm sm:text-base text-gray-400 line-through">₹{selectedItem.price}</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400">{Math.round(((selectedItem.price - selectedItem.offerPrice) / selectedItem.price) * 100)}% off</span>
                      </div>
                    ) : (
                      <span className="text-xl sm:text-2xl md:text-3xl font-black leading-none">₹{selectedItem.price}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                      <div className="w-4 h-px bg-slate-200" /> 
                      Product Description
                    </h4>
                    <p className="text-[15px] text-slate-600 leading-relaxed font-medium italic opacity-90">
                      {selectedItem.description || 'Experience culinary perfection with this signature dish. Each component is meticulously selected and prepared to offer an unforgettable experience of textures and flavors.'}
                    </p>
                  </div>
                </div>
              </div>
                 <div className="absolute bottom-0 left-0 right-0 p-5 pb-8 glass-card border-t border-white/50 backdrop-blur-3xl z-20">
                  <div className="flex items-center gap-4">
                    {/* Left: Quantity Management */}
                    <div className="flex-1">
                      {getItemQuantity(selectedItem._id) === 0 ? (
                        <button 
                          onClick={() => addToCart(selectedItem)}
                          className="w-full h-14 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all group/pop"
                        >
                          <FaPlus className="w-3 h-3 text-emerald-400" />
                          <span>Add to Order</span>
                        </button>
                      ) : (
                        <div className="h-14 bg-indigo-600 rounded-2xl flex items-center p-1 shadow-2xl shadow-indigo-200">
                          <button onClick={() => removeFromCart(selectedItem._id)} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-all"><FaMinus className="w-3.5 h-3.5" /></button>
                          <div className="flex-1 text-center">
                            <p className="text-base font-black text-white tabular-nums leading-none tracking-tight">{getItemQuantity(selectedItem._id)}</p>
                            <p className="text-[7px] font-black text-indigo-200 uppercase tracking-widest mt-1">Selected</p>
                          </div>
                          <button onClick={() => addToCart(selectedItem)} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-all"><FaPlus className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
 
                    {/* Right: Cart Button */}
                    <button 
                      onClick={() => {
                        setSelectedItem(null);
                        onGoToCart?.();
                      }}
                      className="relative w-14 h-14 bg-indigo-50 border-2 border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100/50 hover:scale-105 active:scale-90 transition-all group/cart"
                      title="Go to Cart"
                    >
                      <FaShoppingCart className="w-5 h-5" />
                      {totalCartCount > 0 && (
                        <span className="absolute -top-2.5 -right-2.5 min-w-[26px] h-6 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-[3px] border-white shadow-lg shadow-rose-200 animate-bounce-slow">
                          {totalCartCount}
                        </span>
                      )}
                    </button>
                  </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100]"
            />
            
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] shadow-2xl p-8 max-h-[85vh] overflow-y-auto will-change-transform"
            >
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Filter Menu</h3>
                    <p className="text-sm text-gray-400 font-medium">Select food type</p>
                 </div>
                 <button 
                   onClick={() => setIsFilterModalOpen(false)}
                   className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                 >
                   <FaTimes className="text-gray-900" />
                 </button>
              </div>

              <div className="mb-8">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Food Type</p>
                 <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveFoodType('')}
                      className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                        !activeFoodType
                          ? 'bg-gray-900 text-white border-gray-900 shadow-xl'
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      All
                    </button>

                    {foodTypes.map((type) => {
                      const isActive = activeFoodType === type;
                      const isVeg = type.toLowerCase() === 'veg';
                      const isNonVeg = type.toLowerCase() === 'non-veg';
                      
                      return (
                        <button
                          key={type}
                          onClick={() => setActiveFoodType(type)}
                          className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                            isActive
                              ? isVeg ? 'bg-green-600 text-white border-green-600 shadow-lg' : isNonVeg ? 'bg-red-600 text-white border-red-600 shadow-lg' : 'bg-gray-900 text-white border-gray-900 shadow-lg'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {isVeg ? <FaLeaf className="w-3 h-3" /> : <FaDotCircle className={`w-3 h-3 ${isNonVeg ? 'text-white' : 'text-gray-300'}`} />}
                          {type}
                        </button>
                      );
                    })}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button
                   onClick={() => setActiveFoodType('')}
                   className="flex-1 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                 >
                   Clear Filter
                 </button>
                 <button
                   onClick={() => setIsFilterModalOpen(false)}
                   className="flex-[2] py-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
                 >
                   Apply
                 </button>
              </div>
              
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-6"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          customerName={session.customerName || ''}
          mobileNumber={session.mobileNumber || ''}
          numberOfPersons={session.numberOfPersons || 1}
          onSave={(updates) => {
            if (session.onUpdateSession) {
              session.onUpdateSession(updates);
            }
          }}
        />
    </div>
  );
}

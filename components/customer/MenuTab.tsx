'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaPlus, FaMinus, FaLeaf, FaDotCircle, FaSlidersH, FaTimes, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';

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
    <div className="relative">
      <main className="max-w-4xl mx-auto">
        {/* Merged Header - Edge to Edge, No Rounded Corners */}
        {(restaurantInfo || session.tableNumber || session.customerName) && (
          <div className="bg-slate-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
            </div>
            
            <div className="relative z-10">
              {/* Top Section: Restaurant + Table */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {restaurantInfo?.logo ? (
                    <img 
                      src={restaurantInfo.logo} 
                      alt="Logo" 
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                      <FaUtensils className="w-5 h-5 text-indigo-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-white leading-none">
                        {restaurantInfo?.name || 'Restaurant'}
                      </h1>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-indigo-300 mt-1">
                      {restaurantInfo?.motto || 'A world of flavor'}
                    </p>
                  </div>
                </div>
                
                {session.tableNumber && (
                  <div className="text-right">
                    <p className="text-[9px] text-indigo-300 uppercase tracking-wider">Table</p>
                    <p className="text-2xl font-black text-white leading-none">#{session.tableNumber}</p>
                  </div>
                )}
              </div>
              
              {/* Bottom Section: Welcome + Persons */}
              {session.customerName && (
                <div className="flex items-center justify-between px-4 py-3 bg-black/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👋</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-300 uppercase tracking-wider">Welcome</p>
                      <p className="text-lg font-black text-white leading-none">{session.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{session.numberOfPersons || 1}</p>
                    <p className="text-[9px] text-indigo-300 uppercase">{session.numberOfPersons === 1 ? 'Person' : 'Persons'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Filter Bar */}
      <div className="sticky top-[72px] z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-100/80 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-hidden">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                <FaSlidersH className="text-white w-3.5 h-3.5" />
             </div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
                <span className="text-gray-900">Filter:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {activeFoodType || 'All Food'}
                </span>
             </div>
          </div>
          <button 
            onClick={() => setIsFilterModalOpen(true)}
            className="flex-shrink-0 px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
          >
            Refine
          </button>
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
            filteredItems.map((item) => {
              const qty = getItemQuantity(item._id);
              const isVeg = item.isVeg ?? (item.foodType?.toLowerCase() === 'veg');

              return (
                <motion.div 
                  key={item._id} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50">
                    <div className="absolute inset-0 scale-105 group-hover:scale-110 transition-transform duration-500 ease-out">
                      {(item.images?.length || 0) > 0 || item.image ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="w-full h-full"
                        >
                          <Image
                            src={item.images?.[0] || item.image || ''}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-slate-50 text-slate-200">
                          <FaUtensils className="w-10 h-10 opacity-20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>

                  {/* Badges Row - At top of content */}
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
                     {item.isBestSeller && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wide rounded-sm">
                        ⭐ Best Seller
                      </span>
                     )}
                    
                     <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wide rounded-sm flex items-center gap-1 ${isVeg ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                       {isVeg ? 'Veg' : 'Non-Veg'}
                     </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 pt-2 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1.5">
                       <div className="flex-1 min-w-0 pr-2">
                          <h3 className="text-base font-black text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.foodType}</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end flex-shrink-0 bg-white px-2 py-1 rounded-xl">
                            {item.offerPrice ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-gray-900 leading-none">₹{item.offerPrice.toFixed(0)}</span>
                                <span className="text-xs text-gray-400 line-through">₹{(item.price || 0).toFixed(0)}</span>
                                <span className="text-xs font-bold text-emerald-600">{Math.round(((item.price - item.offerPrice) / item.price) * 100)}% off</span>
                              </div>
                            ) : (
                              <span className="text-lg font-black text-gray-900 leading-none">₹{(item.price || 0).toFixed(0)}</span>
                            )}
                       </div>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 leading-relaxed opacity-80">
                      {item.description || 'A masterpiece of culinary art, prepared fresh for your exquisite palate.'}
                    </p>

                    {/* Add to Cart */}
                    <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                       <AnimatePresence mode="wait">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full py-3 bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center rounded-lg justify-center gap-2 group/btn"
                            >
                              <FaPlus className="w-2.5 h-2.5 text-indigo-400 group-hover/btn:rotate-90 transition-transform" />
                              Add to Order
                            </button>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center w-full bg-indigo-600 p-0.5 shadow-lg shadow-indigo-100"
                            >
                              <button
                                onClick={() => removeFromCart(item._id)}
                                className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                              >
                                <FaMinus className="w-3 h-3" />
                              </button>
                              <div className="flex-1 flex flex-col items-center">
                                <span className="text-xs font-black text-white tabular-nums leading-none">{qty}</span>
                                <span className="text-[7px] font-black text-indigo-200 uppercase tracking-tighter">In Order</span>
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
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
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-[3rem] z-[120] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden will-change-transform"
            >
              {/* Top Header Bar with Close Button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {/* Best Seller Badge */}
                  {selectedItem.isBestSeller && (
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black rounded-lg shadow-lg uppercase tracking-tighter flex items-center gap-1"
                    >
                      <span>⭐</span>
                      <span>Best Seller</span>
                    </motion.div>
                  )}
                  {/* Veg/Non-Veg Badge */}
                  <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'border-emerald-500 bg-emerald-500' : 'border-red-500 bg-red-500'}`} />
                    {(selectedItem.isVeg ?? (selectedItem.foodType?.toLowerCase() === 'veg')) ? 'Vegetarian' : 'Non-Veg'}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <FaTimes className="text-gray-900 w-5 h-5" />
                </button>
              </div>

              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />
              
              <div className="overflow-y-auto px-6 pb-24 flex-1">
                <div className="relative aspect-[16/10] w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 group/gallery bg-slate-50">
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

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">Product Description</h4>
                    <p className="text-base text-gray-600 leading-relaxed font-medium">
                      {selectedItem.description || 'Experience culinary perfection with this signature dish. Each component is meticulously selected and prepared to offer an unforgettable experience of textures and flavors.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 pt-2 bg-gradient-to-t from-white via-white to-transparent">
                  <div className="flex items-center gap-4">
                    {/* Left: Quantity Management */}
                    <div className="flex-1">
                      {getItemQuantity(selectedItem._id) === 0 ? (
                        <button 
                          onClick={() => addToCart(selectedItem)}
                          className="w-full h-12 sm:h-14 bg-gray-900 text-white text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                        >
                          <FaPlus className="w-3 h-3 text-indigo-400" />
                          <span className="hidden sm:inline">Add to Order</span>
                          <span className="sm:hidden">Add</span>
                        </button>
                      ) : (
                        <div className="h-12 sm:h-14 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center p-1 shadow-xl">
                          <button onClick={() => removeFromCart(selectedItem._id)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white"><FaMinus className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                          <div className="flex-1 text-center">
                            <p className="text-sm font-black text-white">{getItemQuantity(selectedItem._id)}</p>
                            <p className="text-[7px] sm:text-[8px] font-black text-indigo-200 uppercase tracking-tighter hidden sm:block">In Cart</p>
                          </div>
                          <button onClick={() => addToCart(selectedItem)} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white"><FaPlus className="w-3 h-3 sm:w-4 sm:h-4" /></button>
                        </div>
                      )}
                    </div>

                    {/* Right: Cart Button */}
                    <button 
                      onClick={() => {
                        setSelectedItem(null);
                        onGoToCart?.();
                      }}
                      className="relative w-12 h-12 sm:w-14 sm:h-14 bg-orange-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                      title="Go to Cart"
                    >
                      <FaShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                      {totalCartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm tabular-nums">
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
    </div>
  );
}

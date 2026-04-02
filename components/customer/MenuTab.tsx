'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUtensils, FaPlus, FaMinus, FaLeaf, FaDotCircle, FaInfoCircle, FaSlidersH, FaTimes, FaCheck } from 'react-icons/fa';
import { MenuItem, CartItem } from '@/types/order';


interface MenuTabProps {
  menuItems: Record<string, MenuItem[]>;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  getItemQuantity: (itemId: string) => number;
  restaurantInfo: { name: string; id: string } | null;
  session: any;
}

export default function MenuTab({
  menuItems,
  cart,
  addToCart,
  removeFromCart,
  getItemQuantity,
  restaurantInfo,
  session
}: MenuTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeFoodType, setActiveFoodType] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const categories = Object.keys(menuItems).sort();

  // 🥬 EXTRACT ACTUAL FOOD TYPES FROM DB DATA
  const foodTypes = Array.from(
    new Set(
      Object.values(menuItems)
        .flat()
        .map(item => item.foodType)
        .filter(Boolean) as string[]
    )
  ).sort();

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const element = categoryRefs.current[category];
    if (element) {
      const offset = 140; // Spacing for new slim sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const toggleFoodType = (foodType: string) => {
    setActiveFoodType(activeFoodType === foodType ? '' : foodType);
  };

  return (
    <div className="relative">
      <main className="max-w-4xl mx-auto px-4 py-4">
        {/* 🏢 1. Ultra-Compact Restaurant Header (Top) */}
        {(restaurantInfo || session.tableNumber) && (
          <div className="mb-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-900 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20">
                  <FaUtensils className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-none mb-0.5">{restaurantInfo?.name || 'Restaurant'}</h2>
                  <div className="flex items-center space-x-1 opacity-70">
                    <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Active</span>
                  </div>
                </div>
              </div>
              {session.tableNumber && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 text-center">
                  <p className="text-[8px] font-black text-indigo-300 uppercase leading-none mb-0.5">Table</p>
                  <p className="text-lg font-black text-white">#{session.tableNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 🟢 2. SLIM FILTER SUMMARY STICKY BAR (Now Ultra Compact) */}
      <div className="sticky top-[72px] z-30 bg-gray-50/95 backdrop-blur-md border-b border-gray-100/80 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-hidden">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                <FaSlidersH className="text-white w-3.5 h-3.5" />
             </div>
             <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">
                <span className="text-gray-900">Filters:</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {activeFoodType || 'All Food'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {activeCategory || 'All Categories'}
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

      {/* 🍱 3. COMPACT HD ITEM CARDS */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {Object.entries(menuItems).map(([category, items]) => {
          const filteredItems = activeFoodType
            ? items.filter(item => item.foodType?.toLowerCase() === activeFoodType.toLowerCase())
            : items;

          // If a category is selected manually or via filter, skip others if needed
          if (activeCategory && category !== activeCategory) return null;
          if (activeFoodType && filteredItems.length === 0) return null;

          return (
            <div
              key={category}
              ref={(el) => { categoryRefs.current[category] = el; }}
              className="mb-8 scroll-mt-[140px]"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-6 w-1.5 bg-indigo-600 rounded-full"></div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">{category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                  const qty = getItemQuantity(item._id);
                  const isVeg = item.foodType?.toLowerCase() === 'veg';

                  return (
                    <motion.div 
                      key={item._id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                      {/* Large HD Image (Compact Aspect) */}
                      <div className="relative aspect-[21/9] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-gray-50 group-hover:scale-105 transition-transform duration-700">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-200">
                              <FaUtensils className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                        </div>
                        
                        {/* Status Badges Overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                           {item.discountPercentage && item.discountPercentage > 0 && (
                            <div className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded shadow-lg uppercase">
                              -{item.discountPercentage}%
                            </div>
                           )}
                           <div className={`w-4 h-4 rounded border border-white/30 backdrop-blur-md shadow flex items-center justify-center ${isVeg ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                           </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-3 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-base font-black text-gray-900 truncate leading-tight pr-2">{item.name}</h3>
                          <div className="flex flex-col items-end flex-shrink-0">
                              {item.offerPrice ? (
                                <>
                                  <span className="text-lg font-black text-indigo-600 leading-none">₹{item.offerPrice.toFixed(0)}</span>
                                  <span className="text-[9px] text-gray-400 line-through mt-0.5 italic">Was {item.price.toFixed(0)}</span>
                                </>
                              ) : (
                                <span className="text-lg font-black text-gray-900 leading-none">₹{item.price.toFixed(0)}</span>
                              )}
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mb-3 line-clamp-1">
                          {item.description || 'Freshly prepared masterpiece.'}
                        </p>

                        {/* Additional Info Tags */}
                        {(item.ingredients || item.preparationMethod) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {item.ingredients && (
                              <div className="bg-gray-50 rounded-lg px-2 py-1 flex items-center space-x-1.5 min-w-0">
                                <FaLeaf className="w-2.5 h-2.5 text-green-500 flex-shrink-0" />
                                <span className="text-[9px] text-gray-500 font-bold truncate">{item.ingredients}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Slim CTA Selector */}
                        <div className="mt-auto">
                           <div className="flex items-center bg-gray-900 rounded-xl p-1 shadow">
                              <AnimatePresence mode="wait">
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-full py-1 text-white font-black uppercase text-[9px] tracking-widest rounded-lg"
                                  >
                                    Add Item
                                  </button>
                                ) : (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center w-full justify-between"
                                  >
                                    <button
                                      onClick={() => removeFromCart(item._id)}
                                      className="w-7 h-7 flex items-center justify-center text-white bg-white/10 rounded-lg"
                                    >
                                      <FaMinus className="w-2 w-2" />
                                    </button>
                                    <span className="text-xs font-black text-white tabular-nums">{qty}</span>
                                    <button
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 flex items-center justify-center text-white bg-indigo-600 rounded-lg shadow-lg"
                                    >
                                      <FaPlus className="w-2 w-2" />
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* 🔘 4. PREMIUM FILTER MODAL (Bottom Sheet) */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[101] shadow-2xl p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Advanced Filtering</h3>
                    <p className="text-sm text-gray-400 font-medium">Fine-tune your culinary journey</p>
                 </div>
                 <button 
                   onClick={() => setIsFilterModalOpen(false)}
                   className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                 >
                   <FaTimes className="text-gray-900" />
                 </button>
              </div>

              {/* Dynamic Food Type Toggle from DB */}
              <div className="mb-8">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Dietary Preference</p>
                 <div className="flex flex-wrap gap-2">
                    {/* Default 'All' */}
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

                    {/* Actual Types from DB */}
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

              {/* Categories Selector */}
              <div className="mb-8">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Categories</p>
                 <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveCategory('')}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${
                        !activeCategory
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl'
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      Show All
                    </button>
                    {categories.filter(cat => cat !== 'Other').map((category) => {
                      const isActive = activeCategory === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setActiveCategory(category)}
                          className={`py-4 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 relative overflow-hidden flex items-center justify-center text-center ${
                            isActive
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl'
                              : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="truncate">{category}</span>
                          {isActive && <FaCheck className="ml-2 w-3 h-3 flex-shrink-0" />}
                        </button>
                      );
                    })}
                 </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-4">
                 <button
                   onClick={() => {
                     setActiveCategory('');
                     setActiveFoodType('');
                   }}
                   className="flex-1 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                 >
                   Clear All
                 </button>
                 <button
                   onClick={() => setIsFilterModalOpen(false)}
                   className="flex-[2] py-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-transform"
                 >
                   Apply Filters
                 </button>
              </div>
              
              {/* Device Notch Handle for visual polish */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-6"></div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

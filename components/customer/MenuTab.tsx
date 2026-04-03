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
   restaurantInfo: { name: string; id: string; logo?: string } | null;
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
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
          <div className="mb-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-white/5">
             {/* Dynamic Background Glow */}
             <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
             
             <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                {restaurantInfo?.logo ? (
                  <div className="p-1 bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
                    <img 
                      src={restaurantInfo.logo} 
                      alt="Logo" 
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                    <FaUtensils className="w-6 h-6 text-indigo-400 opacity-40" />
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black tracking-tighter text-white leading-none">
                      {restaurantInfo?.name || 'Restaurant'}
                    </h2>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" title="System Online"></div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                    Live Digital Menu Experience
                  </p>
                </div>
              </div>
              
              {session.tableNumber && (
                <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[1.5rem] px-5 py-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px] shadow-2xl">
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Table</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-indigo-500">#</span>
                    <p className="text-2xl font-black text-white leading-none">{session.tableNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 👋 Welcome Card - Short & Full Width */}
        {session.customerName && (
          <div className="mb-4 bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-800 rounded-2xl px-5 py-3 text-white shadow-lg flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <span className="text-lg">👋</span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Welcome</p>
                <p className="text-lg font-black leading-none">{session.customerName}</p>
              </div>
            </div>
            <div className="text-[10px] font-black text-indigo-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              {session.numberOfPersons || 1} {session.numberOfPersons === 1 ? 'Person' : 'Persons'}
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

      {/* 🍱 3. MODERN HD ITEM CARDS */}
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
              className="mb-10 scroll-mt-[140px]"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-6 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">{category}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => {
                  const qty = getItemQuantity(item._id);
                  const isVeg = item.foodType?.toLowerCase() === 'veg';

                  return (
                    <motion.div 
                      key={item._id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex flex-col bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50 overflow-hidden hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-500 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      {/* Premium Image Section */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-gray-50 group-hover:scale-110 transition-transform duration-1000 ease-out">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-200">
                              <FaUtensils className="w-12 h-12 opacity-20" />
                            </div>
                          )}
                        </div>
                        
                        {/* Status Badges Overlay */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                           {item.discountPercentage && item.discountPercentage > 0 && (
                            <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-xl uppercase tracking-tighter">
                              -{item.discountPercentage}% OFF
                            </div>
                           )}
                           <div className={`w-6 h-6 rounded-lg border border-white/40 backdrop-blur-md shadow-xl flex items-center justify-center ${isVeg ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
                             <div className="w-2.5 h-2.5 rounded-full bg-white shadow-inner"></div>
                           </div>
                        </div>

                        {/* Bottom Info Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>

                      {/* Premium Content Section */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex-1 min-w-0 pr-4">
                              <h3 className="text-lg font-black text-gray-900 truncate leading-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                              <p className="text-[11px] font-bold text-indigo-400/80 uppercase tracking-[0.1em] mt-0.5">{item.category}</p>
                           </div>
                           <div className="flex flex-col items-end flex-shrink-0 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100">
                                {item.offerPrice ? (
                                  <>
                                    <span className="text-lg font-black text-indigo-600 leading-none">₹{item.offerPrice.toFixed(0)}</span>
                                    <span className="text-[9px] text-gray-400 line-through mt-0.5 italic">₹{item.price.toFixed(0)}</span>
                                  </>
                                ) : (
                                  <span className="text-lg font-black text-gray-900 leading-none">₹{item.price.toFixed(0)}</span>
                                )}
                           </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-5 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                          {item.description || 'A masterpiece of culinary art, prepared fresh for your exquisite palate.'}
                        </p>

                        {/* CTA / Quick Selector */}
                        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                           <AnimatePresence mode="wait">
                              {qty === 0 ? (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-full py-3.5 bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                  <FaPlus className="w-2.5 h-2.5 text-indigo-400 group-hover/btn:rotate-90 transition-transform" />
                                  Add to Cart
                                </button>
                              ) : (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex items-center w-full bg-indigo-600 rounded-2xl p-1 shadow-lg shadow-indigo-200"
                                >
                                  <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
                                  >
                                    <FaMinus className="w-3 h-3" />
                                  </button>
                                  <div className="flex-1 flex flex-col items-center">
                                    <span className="text-xs font-black text-white tabular-nums leading-none">{qty}</span>
                                    <span className="text-[8px] font-black text-indigo-200 uppercase tracking-tighter">In Cart</span>
                                  </div>
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-xl transition-colors"
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
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* 🔎 4. ITEM DETAIL MODAL (Amazon Style Detail) */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white rounded-t-[3rem] z-[120] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Head Handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4 shrink-0" />
              
              <div className="overflow-y-auto px-6 pb-24 flex-1">
                {/* Hero Stage */}
                <div className="relative aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
                  {selectedItem.image ? (
                    <Image src={selectedItem.image} alt={selectedItem.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                      <FaUtensils className="w-20 h-20 opacity-40" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className={`px-4 py-2 rounded-xl border border-white/40 backdrop-blur-md shadow-xl flex items-center gap-2 text-white font-black text-xs uppercase bg-${selectedItem.foodType?.toLowerCase() === 'veg' ? 'green' : 'red'}-500/80`}>
                      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                      {selectedItem.foodType}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-6">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">
                      {selectedItem.name}
                    </h2>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">
                      {selectedItem.category}
                    </span>
                  </div>
                  <div className="flex flex-col items-end bg-gray-900 text-white p-4 rounded-[2rem] shadow-xl">
                    {selectedItem.offerPrice ? (
                      <>
                        <span className="text-2xl font-black leading-none">₹{selectedItem.offerPrice}</span>
                        <span className="text-[10px] text-gray-400 line-through mt-1 italic">M.R.P: ₹{selectedItem.price}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-black leading-none">₹{selectedItem.price}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Full Description */}
                  <div>
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">Product Description</h4>
                    <p className="text-base text-gray-600 leading-relaxed font-medium">
                      {selectedItem.description || 'Experience culinary perfection with this signature dish. Each component is meticulously selected and prepared to offer an unforgettable experience of textures and flavors.'}
                    </p>
                  </div>

                  {/* Facts Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {selectedItem.ingredients && (
                      <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100/50">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                             <FaLeaf className="w-4 h-4" />
                           </div>
                           <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest">Ingredients</h4>
                        </div>
                        <p className="text-sm text-orange-800/80 font-bold leading-relaxed pr-2">
                          {selectedItem.ingredients}
                        </p>
                      </div>
                    )}
                    {selectedItem.preparationMethod && (
                      <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                             <FaUtensils className="w-4 h-4" />
                           </div>
                           <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Preparation</h4>
                        </div>
                        <p className="text-sm text-indigo-800/80 font-bold leading-relaxed pr-2">
                          {selectedItem.preparationMethod}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pt-2 bg-gradient-to-t from-white via-white to-transparent">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <FaTimes className="text-gray-900" />
                    </button>
                    {getItemQuantity(selectedItem._id) === 0 ? (
                      <button 
                        onClick={() => {
                          addToCart(selectedItem);
                        }}
                        className="flex-1 h-14 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                      >
                        <FaPlus className="w-3 h-3 text-indigo-400" />
                        Add to Order
                      </button>
                    ) : (
                      <div className="flex-1 h-14 bg-indigo-600 rounded-2xl flex items-center p-1 shadow-xl">
                        <button onClick={() => removeFromCart(selectedItem._id)} className="w-12 h-12 flex items-center justify-center text-white"><FaMinus /></button>
                        <div className="flex-1 text-center">
                          <p className="text-sm font-black text-white">{getItemQuantity(selectedItem._id)}</p>
                          <p className="text-[8px] font-black text-indigo-200 uppercase">In Cart</p>
                        </div>
                        <button onClick={() => addToCart(selectedItem)} className="w-12 h-12 flex items-center justify-center text-white"><FaPlus /></button>
                      </div>
                    )}
                  </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🔘 5. PREMIUM FILTER MODAL (Bottom Sheet) */}
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

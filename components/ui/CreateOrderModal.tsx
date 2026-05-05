'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/services/swr';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getTodayISTDateString } from '@/utils/date';
import {
    FaTimes, FaPlus, FaMinus, FaTrash, FaUtensils, FaUser, FaPhone,
    FaHashtag, FaChair, FaShoppingBag, FaUsers, FaSearch, FaChevronRight,
    FaRegClipboard, FaCheckCircle, FaSpinner, FaArrowLeft, FaTable, FaUserFriends
} from 'react-icons/fa';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrderSchema, CreateOrderInput } from '@/lib/validations';

interface MenuItem {
    _id: string;
    name: string;
    price: number;
    category: string;
    foodType?: string;
    description?: string;
    images?: string[];
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
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');
    const [isMobile, setIsMobile] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Form state
    const {
        register,
        handleSubmit: handleFormSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<any>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            customerName: '',
            customerPhone: '',
            tableNumber: undefined,
            numberOfPersons: 1,
            orderType: 'dine-in',
            specialInstructions: ''
        }
    });

    const orderType = watch('orderType');
    const tableNumber = watch('tableNumber');
    const restaurantId = user?._id || user?.id;

    const { data: menuData, isLoading: isMenuLoading } = useSWR<{ data: MenuItem[] }>(
        isOpen && restaurantId ? `/menu/${restaurantId}` : null,
        fetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    );

    const menuItems = useMemo(() => {
        return menuData?.data?.filter(item => item.isActive) || [];
    }, [menuData]);

    const categories = useMemo(() => {
        const cats = ['All', ...new Set(menuItems.map(item => item.category || 'Other'))];
        return cats;
    }, [menuItems]);

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchQuery, selectedCategory]);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast.success(`Added ${item.name}`, { icon: '🛒', duration: 1000 });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item._id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    // GST Data
    const { data: gstConfigRes } = useSWR(isOpen && user ? '/gst-config' : null, fetcher);
    const gstConfig = gstConfigRes?.data || null;

    const calculateSubtotal = () => {
        return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    };

    const getOrderTotals = () => {
        const subtotal = calculateSubtotal();
        if (!gstConfig) return { subtotal, serviceCharge: 0, cgst: 0, sgst: 0, igst: 0, total: subtotal };

        let serviceCharge = 0;
        if (gstConfig.serviceChargeEnabled) {
            serviceCharge = (subtotal * gstConfig.serviceChargePercentage) / 100;
        }

        const taxableAmount = subtotal + serviceCharge;
        let cgst = 0, sgst = 0, igst = 0;

        if (gstConfig.gstEnabled) {
            cgst = (taxableAmount * gstConfig.cgstPercentage) / 100;
            sgst = (taxableAmount * gstConfig.sgstPercentage) / 100;
            igst = (taxableAmount * gstConfig.igstPercentage) / 100;
        }

        const grandTotal = Math.round(taxableAmount + cgst + sgst + igst);
        return {
            subtotal,
            serviceCharge,
            cgst,
            sgst,
            igst,
            total: grandTotal
        };
    };

    const totals = getOrderTotals();

    // Table Data
    const { data: tableRes } = useSWR(isOpen && user ? '/table' : null, fetcher);
    const tablesList = tableRes?.data || [];
    const occupancySwrKey = isOpen && user ? `/order?status=PLACED,ACCEPTED,COMPLETED&date=${getTodayISTDateString()}` : null;
    const { data: occupancyRes } = useSWR(occupancySwrKey, fetcher);
    const pendingOrders = occupancyRes?.data || [];

    const isTableOccupied = (tNum: number) => {
        return pendingOrders.some(
            (order: any) =>
                order.orderType === 'dine-in' &&
                order.tableNumber === tNum &&
                (order.status === 'PLACED' || order.status === 'ACCEPTED' || (order.status === 'COMPLETED' && order.paymentStatus !== 'VERIFIED'))
        );
    };

    const onSubmit = async (values: any) => {
        const data = values as CreateOrderInput;
        if (cart.length === 0) return;
        if (!restaurantId) {
            toast.error('Session expired. Please refresh.');
            return;
        }

        try {
            setIsSubmitting(true);
            const orderData: any = {
                customerName: data.customerName,
                customerPhone: data.customerPhone || '',
                orderType: data.orderType,
                specialInstructions: data.specialInstructions || '',
                items: cart.map(i => ({
                    itemId: i._id,
                    name: i.name,
                    price: Number(i.price),
                    quantity: Number(i.quantity)
                })),
                totalAmount: Number(totals.total),
                subtotal: Number(totals.subtotal),
                serviceChargeAmount: Number(totals.serviceCharge),
                cgstAmount: Number(totals.cgst),
                sgstAmount: Number(totals.sgst),
                igstAmount: Number(totals.igst),
                gstEnabled: gstConfig?.gstEnabled || false,
                serviceChargeEnabled: gstConfig?.serviceChargeEnabled || false,
                taxableAmount: Number(totals.subtotal + totals.serviceCharge),
                deviceId: 'counter-order',
                sessionId: `counter-${Date.now()}`,
                status: 'PLACED',
                restaurantId: restaurantId
            };

            if (data.orderType === 'dine-in') {
                if (data.tableNumber) orderData.tableNumber = Number(data.tableNumber);
                if (data.numberOfPersons) orderData.numberOfPersons = Number(data.numberOfPersons);
            }

            console.log('[CreateOrder] Payload:', orderData);
            await api.post('/order/create-admin', orderData);
            toast.success('Order created successfully!');
            setCart([]);
            reset();
            setStep(1);
            onOrderCreated();
            onClose();
        } catch (error: any) {
            const serverMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message;
            toast.error(serverMsg || 'Failed to create order');
            console.error('[CreateOrder] API Error:', error.response?.data);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this to debug validation blocking
    const onInternalFormError = (errs: any) => {
        console.warn('[CreateOrder] Validation Bloacker:', errs);
        const firstErrorKey = Object.keys(errs)[0];
        if (firstErrorKey) {
            toast.error(`Validation failed: ${errs[firstErrorKey].message || firstErrorKey}`);
        }
    };

    const handleClose = () => {
        setStep(1);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-sm lg:p-4 lg:items-center lg:justify-center">
                    {/* Background Overlay for Tablet/Desktop */}
                    <div className="hidden lg:block absolute inset-0 -z-10" onClick={handleClose} />

                    <motion.div
                        initial={{ opacity: 0, y: '100dvh' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100dvh' }}
                        className="flex-1 w-full lg:max-w-[1200px] lg:h-[90vh] lg:flex-none lg:rounded-[2.5rem] bg-white shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header Section */}
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-800 p-4 lg:p-6 flex items-center justify-between text-white shrink-0 shadow-lg z-20">
                            <div className="flex items-center gap-3 lg:gap-4">
                                {step === 2 ? (
                                    <button onClick={() => setStep(1)} className="p-2 bg-white/10 rounded-xl lg:rounded-2xl backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all">
                                        <FaArrowLeft className="text-xl lg:text-2xl text-indigo-300" />
                                    </button>
                                ) : (
                                    <div className="p-2 lg:p-3 bg-white/10 rounded-xl lg:rounded-2xl backdrop-blur-xl border border-white/10">
                                        <FaShoppingBag className="text-xl lg:text-2xl text-indigo-300" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-lg lg:text-2xl font-black tracking-tight uppercase italic">Digital Counter</h2>
                                    <p className="text-indigo-200/60 text-[9px] lg:text-xs font-bold uppercase tracking-widest px-1">
                                        {step === 1 ? 'Step 1: Item Selection' : 'Step 2: Customer & Table Details'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-90">
                                <FaTimes className="text-xl lg:text-2xl" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit(onSubmit, onInternalFormError)} className="flex-1 flex overflow-hidden lg:flex-row relative">
                            {step === 1 ? (
                                <>
                                    {/* Desktop: Show Both | Mobile: Show Active Only */}
                                    {(!isMobile || mobileView === 'menu') && (
                                        <div className="flex-[1.8] flex flex-col bg-slate-50 border-r border-slate-200/60 min-w-0 h-full">
                                            {/* Filters & Search */}
                                            <div className="p-3 lg:p-5 space-y-3 lg:space-y-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm shrink-0">
                                                <div className="relative group">
                                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search menu..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-10 lg:pl-12 pr-4 py-2 lg:py-3 bg-slate-100/50 border-2 border-transparent focus:border-indigo-500/30 rounded-xl lg:rounded-2xl outline-none text-xs lg:text-sm font-medium"
                                                    />
                                                </div>
                                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`px-4 py-1.5 rounded-lg text-[10px] lg:text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Items List */}
                                            <div className="flex-1 overflow-y-auto p-3 lg:p-4 pb-20 lg:pb-4">
                                                {isMenuLoading ? (
                                                    <div className="h-full flex items-center justify-center"><FaSpinner className="animate-spin text-2xl" /></div>
                                                ) : (
                                                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-4 font-inter">
                                                        {filteredItems.map(item => (
                                                            <div key={item._id} onClick={() => addToCart(item)} className="bg-white p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-100 hover:border-indigo-200 shadow-sm cursor-pointer flex flex-col gap-2 transition-all active:scale-95">
                                                                <div className="w-full aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-50">
                                                                    {(item.image || (item.images && item.images[0])) ? <img src={item.image || item.images![0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FaUtensils className="text-slate-200" /></div>}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 text-[11px] lg:text-sm truncate">{item.name}</h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-indigo-600 font-extrabold text-[12px] lg:text-base">₹{item.price}</p>
                                                                    </div>
                                                                </div>
                                                                <button type="button" className="w-full py-1.5 bg-slate-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">Add +</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Cart Section for Step 1 */}
                                    {(!isMobile || mobileView === 'cart') && (
                                        <div className="flex-1 lg:max-w-[400px] flex flex-col bg-white h-full relative z-10">
                                            {/* Header */}
                                            <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                                                <h3 className="font-black text-slate-800 text-base lg:text-lg tracking-tight">Cart Items</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black">{cart.length} ITEMS</span>
                                                    {cart.length > 0 && <button type="button" onClick={() => setCart([])} className="text-rose-500 p-1"><FaTrash size={12} /></button>}
                                                </div>
                                            </div>

                                            {/* Content (Scrolls) */}
                                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100 flex flex-col">
                                                {/* Cart Items */}
                                                <div className="p-4 lg:p-6 space-y-4 pb-24">
                                                    {cart.length > 0 ? (
                                                        cart.map(item => (
                                                            <div key={item._id} className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0">
                                                                    {(item.image || (item.images && item.images[0])) ? <img src={item.image || item.images![0]} alt="" className="w-full h-full object-cover rounded-lg" /> : <FaUtensils className="p-3 text-slate-200" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-indigo-600 font-bold text-[10px]">₹{item.price}</p>
                                                                        <p className="text-gray-500 text-[9px]">× {item.quantity}</p>
                                                                        <p className="text-slate-800 font-bold text-[10px] ml-auto">₹{item.price * item.quantity}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center bg-slate-50 rounded-lg p-1 border">
                                                                    <button type="button" onClick={() => updateQuantity(item._id, -1)} className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-xs"><FaMinus size={8} /></button>
                                                                    <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                                                                    <button type="button" onClick={() => updateQuantity(item._id, 1)} className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-xs"><FaPlus size={8} /></button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                                            <FaShoppingBag className="text-3xl mb-2" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest">No items selected</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Proceed Button */}
                                                <div className="mt-auto p-4 lg:p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                                                    <div className="flex flex-col gap-1.5 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Subtotal</span>
                                                            <span className="text-sm font-bold text-slate-700">₹{totals.subtotal.toFixed(2)}</span>
                                                        </div>
                                                        {totals.serviceCharge > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Service Charge ({gstConfig?.serviceChargePercentage}%)</span>
                                                                <span className="text-sm font-bold text-slate-700">₹{totals.serviceCharge.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {totals.cgst > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">CGST ({gstConfig?.cgstPercentage}%)</span>
                                                                <span className="text-sm font-bold text-slate-700">₹{totals.cgst.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {totals.sgst > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">SGST ({gstConfig?.sgstPercentage}%)</span>
                                                                <span className="text-sm font-bold text-slate-700">₹{totals.sgst.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {totals.igst > 0 && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">IGST ({gstConfig?.igstPercentage}%)</span>
                                                                <span className="text-sm font-bold text-slate-700">₹{totals.igst.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Cart Total</span>
                                                            <span className="text-xl font-black text-slate-900 tracking-tighter">₹{totals.total}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => setStep(2)}
                                                        disabled={cart.length === 0}
                                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Proceed to Details <FaChevronRight className="text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile NavBar (Bottom) - Step 1 */}
                                    {isMobile && (
                                        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 p-2.5 flex gap-2.5 z-50">
                                            <button
                                                type="button"
                                                onClick={() => setMobileView('menu')}
                                                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${mobileView === 'menu' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                <FaUtensils /> Select Items
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMobileView('cart')}
                                                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all relative ${mobileView === 'cart' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                <FaShoppingBag /> {cart.length > 0 ? `Cart (₹${totals.total})` : 'Cart'}
                                                {cart.length > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white">{cart.length}</span>}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* STEP 2: Customer Details & Table Selection */
                                <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden bg-slate-50 relative">
                                    {/* Left Side: Form Details */}
                                    <div className="flex-1 lg:max-w-[450px] flex flex-col bg-white border-r border-slate-200/60 overflow-y-auto">
                                        <div className="p-4 lg:p-6 space-y-5">
                                            <h3 className="font-black text-slate-800 text-base lg:text-lg tracking-tight border-b pb-2">Customer Details</h3>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Customer Name *</label>
                                                    <div className="relative">
                                                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input type="text" {...register('customerName')} placeholder="Full Name" className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Phone Number</label>
                                                    <div className="relative">
                                                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            {...register('customerPhone')}
                                                            placeholder="10-digit number"
                                                            maxLength={10}
                                                            className={`w-full pl-9 pr-3 py-2.5 text-sm border ${errors.customerPhone ? 'border-rose-500 bg-rose-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all`}
                                                        />
                                                    </div>
                                                    {errors.customerPhone && <p className="text-[9px] font-bold text-rose-500 pl-1">Exactly 10 digits required</p>}
                                                </div>
                                            </div>

                                            <h3 className="font-black text-slate-800 text-base lg:text-lg tracking-tight border-b pb-2 pt-4">Order Type</h3>
                                            <div className="flex gap-2">
                                                {(['dine-in', 'takeaway'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => {
                                                            setValue('orderType', type);
                                                            if (type !== 'dine-in') {
                                                                setValue('tableNumber', undefined);
                                                                setValue('numberOfPersons', 1);
                                                            }
                                                        }}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${orderType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        {type === 'dine-in' ? <FaChair /> : <FaShoppingBag />} {type}
                                                    </button>
                                                ))}
                                            </div>

                                            {orderType === 'dine-in' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">Selected Table *</label>
                                                        <div className="relative">
                                                            <FaTable className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input 
                                                                type="number" 
                                                                {...register('tableNumber', { valueAsNumber: true })} 
                                                                placeholder="e.g. 1" 
                                                                readOnly
                                                                className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-xl outline-none bg-slate-50 ${errors.tableNumber ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`} 
                                                            />
                                                        </div>
                                                        {errors.tableNumber && <p className="text-[9px] font-bold text-rose-500 pl-1">Required for dine-in</p>}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">Persons *</label>
                                                        <div className="relative">
                                                            <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input type="number" {...register('numberOfPersons', { valueAsNumber: true })} min="1" className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1.5 pt-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase">Special Instructions</label>
                                                <textarea {...register('specialInstructions')} rows={2} placeholder="Any specific request..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none resize-none"></textarea>
                                            </div>
                                        </div>

                                        {/* Submit Area */}
                                        <div className="mt-auto p-4 lg:p-6 border-t border-slate-100 bg-slate-50">
                                            <div className="flex flex-col gap-1.5 mb-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Subtotal</span>
                                                    <span className="text-sm font-bold text-slate-700">₹{totals.subtotal.toFixed(2)}</span>
                                                </div>
                                                {totals.serviceCharge > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Service Charge ({gstConfig?.serviceChargePercentage}%)</span>
                                                        <span className="text-sm font-bold text-slate-700">₹{totals.serviceCharge.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {totals.cgst > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">CGST ({gstConfig?.cgstPercentage}%)</span>
                                                        <span className="text-sm font-bold text-slate-700">₹{totals.cgst.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {totals.sgst > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">SGST ({gstConfig?.sgstPercentage}%)</span>
                                                        <span className="text-sm font-bold text-slate-700">₹{totals.sgst.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {totals.igst > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">IGST ({gstConfig?.igstPercentage}%)</span>
                                                        <span className="text-sm font-bold text-slate-700">₹{totals.igst.toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Total Amount</span>
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">₹{totals.total}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                                {isSubmitting ? 'Processing...' : 'Place Order'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Right Side: Table Occupancy (Only shown if dine-in is selected) */}
                                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 lg:p-6">
                                        {orderType === 'dine-in' ? (
                                            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                            <FaTable className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-base font-black text-slate-800 tracking-tight">Select Table</h3>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Occupancy Status</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-600 rounded-lg shadow-sm border border-slate-100 text-[9px] font-black uppercase tracking-widest">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Available
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-500 rounded-lg shadow-sm border border-slate-100 text-[9px] font-black uppercase tracking-widest opacity-60">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Occupied
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {tablesList.map((table: any) => {
                                                        const isOccupied = isTableOccupied(table.tableNumber);
                                                        const isSelected = tableNumber === table.tableNumber;
                                                        
                                                        return (
                                                            <div
                                                                key={table._id}
                                                                onClick={() => {
                                                                    if (!isOccupied) {
                                                                        setValue('tableNumber', table.tableNumber, { shouldValidate: true });
                                                                    }
                                                                }}
                                                                className={`relative p-4 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1
                                                                    ${isOccupied 
                                                                        ? 'bg-rose-50 border-rose-100 opacity-60 cursor-not-allowed' 
                                                                        : isSelected 
                                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 cursor-pointer transform scale-[1.02]' 
                                                                            : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                                                                    }`}
                                                            >
                                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/30' : isOccupied ? 'bg-rose-100' : 'bg-slate-50'}`}>
                                                                    <FaTable className={`w-4 h-4 ${isSelected ? 'text-indigo-100' : isOccupied ? 'text-rose-400' : 'text-slate-400'}`} />
                                                                </div>
                                                                
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>Table</span>
                                                                    <span className={`text-2xl font-black tracking-tighter leading-none ${isOccupied ? 'text-rose-700' : isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                                        {table.tableNumber}
                                                                    </span>
                                                                </div>

                                                                <div className={`mt-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider
                                                                    ${isSelected ? 'bg-white/10 text-white' : isOccupied ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                                                                    <FaUserFriends className="w-2 h-2 opacity-60" /> {table.seats || 4}
                                                                </div>

                                                                {isSelected && (
                                                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                        <FaCheckCircle className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {tablesList.length === 0 && (
                                                        <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400">
                                                            <FaTable className="text-3xl mb-2 opacity-20" />
                                                            <p className="text-xs font-bold uppercase tracking-widest">No tables available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 p-10 text-center bg-white border border-slate-200 border-dashed rounded-3xl">
                                                <FaShoppingBag className="text-6xl mb-4 opacity-20" />
                                                <h3 className="text-lg font-black text-slate-600 uppercase tracking-widest mb-1">Takeaway Order</h3>
                                                <p className="text-xs font-bold text-slate-500">Table selection is not required for takeaway orders.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

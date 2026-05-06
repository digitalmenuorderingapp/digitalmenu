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
    FaShoppingBag, FaUsers, FaSearch, FaChevronRight, FaHashtag,
    FaCheckCircle, FaSpinner, FaArrowLeft, FaTable, FaUserFriends,
    FaStore, FaConciergeBell, FaChevronLeft, FaSearchPlus
} from 'react-icons/fa';
import { useForm } from 'react-hook-form';
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const onInternalFormError = (errs: any) => {
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
                <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/40 backdrop-blur-md lg:p-4 lg:items-center lg:justify-center">
                    <div className="hidden lg:block absolute inset-0 -z-10" onClick={handleClose} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="flex-1 w-full lg:max-w-[1400px] lg:h-[94vh] lg:flex-none lg:rounded-[3rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-white/40 relative"
                    >
                        {/* Hyper-Premium Mesh Gradient Background (Subtle) */}
                        <div className="absolute inset-0 -z-10 pointer-events-none opacity-40">
                            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]"></div>
                        </div>

                        {/* Executive Header (Brand & Action) */}
                        <div className="bg-white/60 backdrop-blur-xl border-b border-slate-100 px-6 py-4 lg:px-10 lg:py-6 flex items-center justify-between z-30">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl rotate-3 flex shrink-0">
                                    <FaConciergeBell className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">
                                        New Order
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live POS Terminal</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="group relative flex h-10 w-10 lg:h-11 lg:w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 border border-slate-100 hover:border-rose-100"
                                title="Close POS"
                            >
                                <FaTimes className="text-lg group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Progress Navigation (Dedicated Stepper Section) */}
                        <div className="bg-slate-50/50 backdrop-blur-md border-b border-slate-100 px-6 py-3 lg:px-10 flex items-center justify-center lg:justify-start z-20">
                            <div className="flex items-center gap-4 lg:gap-8">
                                {/* Step 1: Selection */}
                                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => step > 1 && setStep(1)}>
                                    <div className={`relative w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] transition-all duration-500 border-2
                                        ${step === 1 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                                            : step > 1 
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'bg-white border-slate-200 text-slate-400'}`}>
                                        {step > 1 ? <FaCheckCircle className="text-xs" /> : '01'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 ${step >= 1 ? 'text-indigo-600' : 'text-slate-300'}`}>Step 01</span>
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${step >= 1 ? 'text-slate-900' : 'text-slate-300'}`}>Selection</span>
                                    </div>
                                </div>

                                <div className="w-8 lg:w-12 h-0.5 bg-slate-200 rounded-full overflow-hidden relative">
                                    <motion.div 
                                        initial={{ width: '0%' }}
                                        animate={{ width: step === 2 ? '100%' : '0%' }}
                                        className="absolute inset-0 bg-indigo-600"
                                    />
                                </div>

                                {/* Step 2: Logistics */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[9px] transition-all duration-500 border-2
                                        ${step === 2 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                                            : 'bg-white border-slate-200 text-slate-400'}`}>
                                        02
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 ${step === 2 ? 'text-indigo-600' : 'text-slate-300'}`}>Step 02</span>
                                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${step === 2 ? 'text-slate-900' : 'text-slate-300'}`}>Logistics</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleFormSubmit(onSubmit, onInternalFormError)} className="flex-1 flex flex-col overflow-hidden relative">
                            {step === 1 ? (
                                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                                    {/* Menu Browser (Top Content Area) */}
                                    <div className="flex-1 flex flex-col min-w-0 h-full relative">
                                        {/* Floating Glass Search & Category Bar */}
                                        <div className="sticky top-6 inset-x-6 z-20 px-6 pointer-events-none">
                                            <div className="bg-white/70 backdrop-blur-2xl border border-white/60 p-3 lg:p-4 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] pointer-events-auto flex flex-col md:flex-row gap-4 items-center">
                                                <div className="relative flex-1 w-full group">
                                                    <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search menu items..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full pl-14 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar max-w-full md:max-w-[400px]">
                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border-2 ${selectedCategory === cat
                                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105'
                                                                : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Grid with soft spacing */}
                                        <div className="flex-1 overflow-y-auto p-6 lg:px-10 lg:pt-36 lg:pb-12 custom-scrollbar pt-32">
                                            {isMenuLoading ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                                    <FaSpinner className="animate-spin text-5xl" />
                                                    <p className="text-[11px] font-black uppercase tracking-[0.4em]">Optimizing Menu</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 lg:gap-4">
                                                    {filteredItems.map((item, idx) =>                                                        <motion.div
                                                            key={item._id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.01 }}
                                                            onClick={() => addToCart(item)}
                                                            className="group bg-white rounded-xl border border-slate-100 hover:border-indigo-500 hover:shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.96] flex flex-col overflow-hidden"
                                                        >
                                                            {/* Hyper-Compact Image */}
                                                            <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                                                                {(item.image || (item.images && item.images[0])) ? (
                                                                    <img src={item.image || item.images![0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                                                                        <FaUtensils className="text-slate-200 text-xl" />
                                                                    </div>
                                                                )}
                                                                {/* Discrete Price Tag */}
                                                                <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-lg z-20">
                                                                    <span className="text-[9px] font-black text-white italic">₹{item.price}</span>
                                                                </div>
                                                            </div>

                                                            {/* Minimalist Metadata */}
                                                            <div className="p-2 lg:p-2.5 flex flex-col gap-0.5">
                                                                <h4 className="text-[11px] font-black text-slate-800 tracking-tight leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                                                    {item.name}
                                                                </h4>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Available</span>
                                                                    <div className="w-5 h-5 rounded-md bg-slate-50 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                                                                        <FaPlus className="text-[7px]" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stationary Bottom Cart Section */}
                                    <div className="bg-white/95 backdrop-blur-2xl border-t border-slate-100 shrink-0 z-40 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
                                        <div className="max-w-[1400px] mx-auto px-4 lg:px-10 py-3 lg:py-6 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
                                            {/* Left: Horizontal Cart Items (Full width on mobile) */}
                                            <div className="flex-1 w-full flex items-center gap-4 lg:gap-6 overflow-hidden">
                                                <div className="shrink-0">
                                                    <div className="flex items-center gap-2 lg:gap-3 mb-0.5 lg:mb-1">
                                                        <h3 className="text-sm lg:text-xl font-black text-slate-900 tracking-tighter italic">My Cart</h3>
                                                        <div className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[8px] lg:text-[10px] font-black shadow-lg shadow-indigo-600/20">{cart.length}</div>
                                                    </div>
                                                    <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">Verified Items</p>
                                                </div>

                                                <div className="w-px h-8 lg:h-10 bg-slate-100"></div>

                                                <div className="flex-1 flex items-center gap-2 lg:gap-3 overflow-x-auto no-scrollbar py-1 lg:py-2">
                                                    {cart.length > 0 ? (
                                                        cart.map((item) => (
                                                            <div key={item._id} className="shrink-0 bg-slate-50 px-3 py-2 lg:px-4 lg:py-2.5 rounded-xl lg:rounded-2xl border border-slate-100 flex items-center gap-3 lg:gap-4 shadow-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] lg:text-[11px] font-black text-slate-800 tracking-tight truncate max-w-[80px] lg:max-w-[120px]">{item.name}</span>
                                                                    <span className="text-[8px] lg:text-[10px] font-black text-indigo-600">₹{item.price * item.quantity}</span>
                                                                </div>
                                                                <div className="flex items-center bg-white rounded-lg lg:rounded-xl shadow-sm border border-slate-100 p-0.5">
                                                                    <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:text-rose-500"><FaMinus size={6} /></button>
                                                                    <span className="w-4 lg:w-5 text-center text-[9px] lg:text-[10px] font-black text-slate-900">{item.quantity}</span>
                                                                    <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:text-indigo-600"><FaPlus size={6} /></button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Empty...</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Summary & Action (Full width on mobile) */}
                                            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 lg:gap-8 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-8">
                                                <div className="flex items-center justify-between sm:justify-start gap-4 lg:gap-6 w-full sm:w-auto">
                                                    <div className="flex items-center gap-4 lg:gap-6">
                                                        <div>
                                                            <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Subtotal</span>
                                                            <h4 className="text-[11px] lg:text-[13px] font-black text-slate-700 tracking-tighter">₹{totals.subtotal.toFixed(2)}</h4>
                                                        </div>
                                                        {totals.serviceCharge > 0 && (
                                                            <div>
                                                                <span className="text-[7px] lg:text-[8px] font-black text-emerald-600 uppercase tracking-widest block leading-none mb-1">Service</span>
                                                                <h4 className="text-[11px] lg:text-[13px] font-black text-emerald-700 tracking-tighter">₹{totals.serviceCharge.toFixed(2)}</h4>
                                                            </div>
                                                        )}
                                                        {(totals.total - totals.subtotal - totals.serviceCharge) > 0 && (
                                                            <div className="hidden sm:block">
                                                                <span className="text-[7px] lg:text-[8px] font-black text-rose-400 uppercase tracking-widest block leading-none mb-1">Taxes</span>
                                                                <h4 className="text-[11px] lg:text-[13px] font-black text-rose-700 tracking-tighter">₹{(totals.total - totals.subtotal - totals.serviceCharge).toFixed(2)}</h4>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-slate-900 text-white px-3 py-1.5 lg:px-5 lg:py-2.5 rounded-lg lg:rounded-2xl shadow-xl">
                                                        <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">Payable</span>
                                                        <h4 className="text-[13px] lg:text-[15px] font-black tracking-tighter">₹{totals.total}</h4>
                                                    </div>
                                                </div>

                                                <button 
                                                    type="button" 
                                                    disabled={cart.length === 0}
                                                    onClick={() => setStep(2)} 
                                                    className="w-full sm:w-auto px-6 lg:px-8 py-3 lg:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] shadow-xl lg:shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 lg:gap-3 disabled:opacity-50 group"
                                                >
                                                    Proceed <FaChevronRight className="text-[8px] lg:text-[10px] group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 h-full w-full flex flex-col bg-slate-50 relative animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
                                    {/* Main Scrollable Content Area - With Padding for Absolute Footer */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-6 pb-40 lg:pb-32">
                                            {/* SECTION 1: TABLE SELECTION (TOP - COMPACT) */}
                                            <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-4 lg:p-6 shadow-sm border border-white/60">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                    <div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setStep(1)}
                                                            className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest mb-2 hover:translate-x-[-4px] transition-transform"
                                                        >
                                                            <FaChevronLeft /> Back to Menu
                                                        </button>
                                                        <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">1. Select Table</h3>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Choose table for dine-in</p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                                                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/50 rounded-xl border border-slate-200/50">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-emerald-600 tracking-widest">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Free
                                                            </div>
                                                            <div className="w-px h-3 bg-slate-200"></div>
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-rose-500 tracking-widest">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Busy
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
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
                                                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border-2 transition-all ${orderType === type
                                                                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                                                        }`}
                                                                >
                                                                    {type === 'dine-in' ? <FaTable className="text-[10px]" /> : <FaShoppingBag className="text-[10px]" />}
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {orderType === 'dine-in' ? (
                                                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2 lg:gap-3">
                                                        {tablesList.map((table: any, idx: number) => {
                                                            const isOccupied = isTableOccupied(table.tableNumber);
                                                            const isSelected = tableNumber === table.tableNumber;

                                                            return (
                                                                <motion.div
                                                                    key={table._id}
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    transition={{ delay: idx * 0.005 }}
                                                                    onClick={() => {
                                                                        if (!isOccupied) {
                                                                            setValue('tableNumber', table.tableNumber, { shouldValidate: true });
                                                                        }
                                                                    }}
                                                                    className={`relative p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-1
                                                                        ${isOccupied
                                                                            ? 'bg-rose-50 border-rose-100 opacity-60 cursor-not-allowed grayscale-[0.5]'
                                                                            : isSelected
                                                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl z-10 scale-105'
                                                                                : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 cursor-pointer shadow-sm'
                                                                        }`}
                                                                >
                                                                    <span className={`text-[7px] font-black uppercase tracking-widest block ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>T-</span>
                                                                    <span className={`text-base font-black tracking-tighter leading-none ${isOccupied ? 'text-rose-700' : isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                                        {table.tableNumber}
                                                                    </span>
                                                                    {isSelected && (
                                                                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                                            <FaCheckCircle className="text-[8px]" />
                                                                        </div>
                                                                    )}
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="py-8 lg:py-12 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
                                                            <FaShoppingBag className="text-xl text-indigo-500" />
                                                        </div>
                                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Takeaway Order</h4>
                                                    </div>
                                                )}
                                            </div>

                                            {/* SECTION 2: CUSTOMER DETAILS (MIDDLE - COMPACT) */}
                                            <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-4 lg:p-6 shadow-sm border border-white/60">
                                                <div className="mb-6">
                                                    <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">2. Customer Details</h3>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Billing information</p>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 items-end">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                                                        <div className="relative group">
                                                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                            <input
                                                                type="text"
                                                                {...register('customerName')}
                                                                placeholder="e.g. John Doe"
                                                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                                                        <div className="relative group">
                                                            <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                            <input
                                                                type="text"
                                                                {...register('customerPhone')}
                                                                placeholder="10-digit mobile"
                                                                maxLength={10}
                                                                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.customerPhone ? 'border-rose-500' : 'border-slate-200'} rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {orderType === 'dine-in' && (
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Persons *</label>
                                                            <div className="relative group">
                                                                <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                                <input
                                                                    type="number"
                                                                    {...register('numberOfPersons', { valueAsNumber: true })}
                                                                    min="1"
                                                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Order Notes</label>
                                                        <div className="relative group">
                                                            <FaConciergeBell className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                                            <input
                                                                {...register('specialInstructions')}
                                                                placeholder="Special requests"
                                                                className="w-full pl-14 pr-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                    </div>

                                    {/* SECTION 3: ORDER TOTALS & SUBMIT (ABSOLUTE BOTTOM) */}
                                    <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 lg:px-10 lg:py-5 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] z-50">
                                        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-10">
                                            {/* Ultra-Compact Info Grid / Desktop Row */}
                                            <div className="flex flex-wrap items-center gap-3 lg:gap-10 w-full lg:w-auto">
                                                <div className="shrink-0 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                        {orderType === 'dine-in' ? <FaTable className="text-xs" /> : <FaShoppingBag className="text-xs" />}
                                                    </div>
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">Order Info</span>
                                                        <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                                                            {orderType} {tableNumber && <span className="text-indigo-600">/ T{tableNumber}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

                                                <div className="shrink-0">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">Subtotal</span>
                                                    <h4 className="text-[14px] font-black text-slate-700 tracking-tighter">₹{totals.subtotal.toFixed(2)}</h4>
                                                </div>

                                                {totals.serviceCharge > 0 && (
                                                    <div className="shrink-0">
                                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block leading-none mb-0.5">Service ({gstConfig?.serviceChargePercentage}%)</span>
                                                        <h4 className="text-[14px] font-black text-slate-700 tracking-tighter">₹{totals.serviceCharge.toFixed(2)}</h4>
                                                    </div>
                                                )}

                                                {(totals.cgst > 0 || totals.igst > 0) && (
                                                    <div className="shrink-0 flex items-center gap-4">
                                                        <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest block leading-none mb-0.5">Taxes (GST)</span>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-[14px] font-black text-slate-700 tracking-tighter">₹{(totals.cgst + totals.sgst + totals.igst).toFixed(2)}</h4>
                                                                <div className="flex flex-col text-[7px] font-black text-slate-400 leading-none uppercase tracking-tighter">
                                                                    {totals.cgst > 0 && <span>C:{totals.cgst.toFixed(1)} S:{totals.sgst.toFixed(1)}</span>}
                                                                    {totals.igst > 0 && <span>IGST:{totals.igst.toFixed(1)}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting || (orderType === 'dine-in' && !tableNumber)}
                                                className="w-full lg:w-auto overflow-hidden bg-indigo-600 text-white rounded-xl lg:rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center group"
                                            >
                                                <div className="px-6 lg:px-10 py-3 lg:py-4 flex items-center gap-3 border-r border-white/20">
                                                    <span className="text-[10px] lg:text-[11px] uppercase tracking-[0.2em]">{isSubmitting ? 'Processing' : 'Confirm Order'}</span>
                                                    <FaChevronRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                                                </div>
                                                <div className="px-5 lg:px-8 py-3 lg:py-4 bg-white/10 backdrop-blur-sm">
                                                    <span className="text-[13px] lg:text-[15px] tracking-tighter">₹{totals.total}</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </form>
                        </motion.div>

                    {/* Custom Scrollbar Styles */}
                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 5px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #e2e8f0;
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #cbd5e1;
                        }
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>
                </div>
            )}
        </AnimatePresence>
    );
}

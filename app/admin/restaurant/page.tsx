'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import {
  FaUtensils,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaEdit,
  FaSpinner,
  FaSave,
  FaTimes,
  FaStore,
  FaTrash,
  FaExclamationTriangle,
  FaEnvelope,
  FaCamera,
  FaImage,
  FaCopy,
  FaCheck,
  FaCrown,
  FaWhatsapp,
  FaCheckCircle,
  FaChartLine,
  FaClock,
  FaGift,
  FaCreditCard,
  FaInfoCircle
} from 'react-icons/fa';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS, Language } from '@/utils/translations';

interface RestaurantFormData {
  restaurantName: string;
  ownerName: string;
  address: string;
  phone: string;
  description: string;
}

export default function RestaurantPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isExportingReport, setIsExportingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<Language>('hi');
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    ownerName: '',
    address: '',
    phone: '',
    description: ''
  });

  // Persistence for language
  useEffect(() => {
    const saved = localStorage.getItem('digitalmenu_lang') as Language;
    if (saved && TRANSLATIONS[saved]) {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        restaurantName: user.restaurantName || '',
        ownerName: user.ownerName || '',
        address: user.address || '',
        phone: user.phone || '',
        description: user.description || ''
      });
      setLogoPreview(user.logo || null);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setOtp('');
    setOtpSent(false);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOtp('');
    setOtpSent(false);
  };

  const requestDeleteOtp = async () => {
    setIsSendingOtp(true);
    try {
      const response = await api.post('/auth/delete-account-otp');
      if (response.data.success && response.data.emailSent) {
        setOtpSent(true);
        toast.success(response.data.message || 'OTP sent to your email');
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleExportReport = async () => {
    setIsExportingReport(true);
    const loadingToast = toast.loading(t.export_report_sending || 'Generating Report...');
    try {
      const response = await api.post('/ledger/exportreporttomail');
      if (response.data.success) {
        toast.success(response.data.message || t.export_report_success, { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Failed to export report:', error);
      toast.error(error.response?.data?.message || t.export_report_error, { id: loadingToast });
    } finally {
      setIsExportingReport(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await api.post('/auth/delete-account', { otp });
      toast.success(response.data.message || 'Account deleted successfully');
      closeDeleteModal();
      logout();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleLogoFile(file);
    } else {
      toast.error('Please drop an image file');
    }
  }, []);

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.put('/auth/restaurant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        await refreshUser();
        setLogoPreview(response.data.logo);
        toast.success('Logo updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleLogoFile(file);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return;

    setIsUploadingLogo(true);
    try {
      const response = await api.delete('/auth/restaurant/logo');
      if (response.data.success) {
        await refreshUser();
        setLogoPreview(null);
        toast.success('Logo removed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put('/auth/restaurant', formData);
      await refreshUser();
      toast.success('Restaurant details updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update restaurant details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyId = () => {
    if (user?.shortId) {
      navigator.clipboard.writeText(user.shortId);
      setCopied(true);
      toast.success('Restaurant ID copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const t = TRANSLATIONS[lang] as any;

  // Subscription status calculation
  const getSubscriptionStatus = () => {
    if (!user?.subscription) {
      return { 
        name: 'Free Trial', 
        daysLeft: 14, 
        isExpired: false, 
        isTrial: true,
        status: 'trial',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        iconColor: 'text-amber-500'
      };
    }

    const { type, status, expiryDate, startDate } = user.subscription;

    // Lifetime/Free plan (legacy)
    if (type === 'free') {
      return { 
        name: 'Premium (Lifetime)', 
        daysLeft: null, 
        isExpired: false, 
        isTrial: false,
        status: 'active',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-500'
      };
    }

    // Trial subscription
    if (type === 'trial' && expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const expired = diffDays <= 0 || status === 'expired';

      return {
        name: 'Free Trial',
        daysLeft: Math.max(0, diffDays),
        isExpired: expired,
        isTrial: true,
        status: expired ? 'expired' : 'trial',
        expiryDate: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        color: expired ? 'text-red-600' : (diffDays < 3 ? 'text-orange-600' : 'text-amber-600'),
        bgColor: expired ? 'bg-red-50' : (diffDays < 3 ? 'bg-orange-50' : 'bg-amber-50'),
        borderColor: expired ? 'border-red-200' : (diffDays < 3 ? 'border-orange-200' : 'border-amber-200'),
        iconColor: expired ? 'text-red-500' : (diffDays < 3 ? 'text-orange-500' : 'text-amber-500')
      };
    }

    // Paid subscription
    if (expiryDate) {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isExpired = diffDays <= 0 || status === 'expired';

      return {
        name: 'Premium Plan',
        daysLeft: Math.max(0, diffDays),
        isExpired: isExpired,
        isTrial: false,
        status: isExpired ? 'expired' : 'active',
        expiryDate: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        color: isExpired ? 'text-red-600' : (diffDays < 7 ? 'text-orange-600' : 'text-green-600'),
        bgColor: isExpired ? 'bg-red-50' : (diffDays < 7 ? 'bg-orange-50' : 'bg-green-50'),
        borderColor: isExpired ? 'border-red-200' : (diffDays < 7 ? 'border-orange-200' : 'border-green-200'),
        iconColor: isExpired ? 'text-red-500' : (diffDays < 7 ? 'text-orange-500' : 'text-green-500')
      };
    }

    return { 
      name: 'Free Trial', 
      daysLeft: 14, 
      isExpired: false, 
      isTrial: true,
      status: 'trial',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-500'
    };
  };

  const subStatus = getSubscriptionStatus();

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FaStore className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
            <p className="text-gray-600">Manage your restaurant information and details</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Subscription Status Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          className={`rounded-3xl shadow-sm border p-6 flex flex-col justify-between overflow-hidden relative group transition-all duration-500 ${subStatus.bgColor} ${subStatus.borderColor} hover:shadow-xl`}
        >
          <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 ${subStatus.bgColor.replace('50', '200')} group-hover:scale-110 transition-transform duration-500`} />
          
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-white ${subStatus.iconColor}`}>
                {subStatus.isTrial ? <FaGift className="w-6 h-6" /> : <FaCrown className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{subStatus.name}</h2>
                <p className={`text-xs font-semibold ${subStatus.color}`}>
                  {subStatus.isExpired ? 'Expired' : subStatus.isTrial ? 'Trial Period' : 'Active Subscription'}
                </p>
              </div>
            </div>

            {/* Days Counter for Trial */}
            {subStatus.isTrial && !subStatus.isExpired && (
              <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Trial ends in</span>
                  <FaClock className={`w-4 h-4 ${subStatus.daysLeft && subStatus.daysLeft < 3 ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-3xl font-black ${subStatus.daysLeft && subStatus.daysLeft < 3 ? 'text-red-600' : 'text-amber-600'}`}>
                    {subStatus.daysLeft}
                  </span>
                  <span className="text-sm font-medium text-gray-500">days left</span>
                </div>
                {subStatus.expiryDate && (
                  <p className="text-xs text-gray-400 mt-1">Expires on {subStatus.expiryDate}</p>
                )}
                
                {/* Progress bar */}
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${subStatus.daysLeft && subStatus.daysLeft < 3 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, ((subStatus.daysLeft || 0) / 14) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expired Notice */}
            {subStatus.isExpired && (
              <div className="mb-6 p-4 bg-red-100 rounded-xl border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-700">Subscription Expired</span>
                </div>
                <p className="text-sm text-red-600">
                  Your trial has ended. Please subscribe to continue using all features.
                </p>
              </div>
            )}

            {/* Paid Subscription Info */}
            {!subStatus.isTrial && !subStatus.isExpired && subStatus.daysLeft !== null && (
              <div className="mb-6 p-4 bg-white rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Valid for</span>
                  <FaClock className={`w-4 h-4 ${subStatus.daysLeft < 7 ? 'text-orange-500' : 'text-green-500'}`} />
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-3xl font-black ${subStatus.daysLeft < 7 ? 'text-orange-600' : 'text-green-600'}`}>
                    {subStatus.daysLeft}
                  </span>
                  <span className="text-sm font-medium text-gray-500">days</span>
                </div>
                {subStatus.expiryDate && (
                  <p className="text-xs text-gray-400 mt-1">Renews on {subStatus.expiryDate}</p>
                )}
              </div>
            )}

            {/* Payment Instructions */}
            <div className="p-4 bg-white rounded-xl border shadow-sm mb-4">
              <div className="flex items-center space-x-2 mb-3">
                <FaCreditCard className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-gray-800">How to Subscribe</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>Contact us via WhatsApp or Email below</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Share your Restaurant ID for verification</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <span>Pay ₹500/year (UPI/Bank Transfer)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <span>Activation within 10 minutes</span>
                </div>
              </div>
            </div>

            {/* Restaurant ID */}
            <div className="mb-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Your Restaurant ID</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 font-mono font-black text-xl text-indigo-600 tracking-wider shadow-sm">
                  {user?.shortId || 'N/A'}
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-3 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                  title="Copy ID"
                >
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <FaInfoCircle className="w-3 h-3 mr-1" />
                Share this ID when contacting for subscription
              </p>
            </div>

            {/* Contact Buttons */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.open('https://wa.me/919563401099', '_blank')}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
              >
                <FaWhatsapp />
                <span>Subscribe via WhatsApp</span>
              </button>
              <button 
                onClick={() => window.location.href = 'mailto:digitalmenu.orderingapp@zohomail.in?subject=Subscription Request - Restaurant ID: ' + user?.shortId}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                <FaEnvelope className="text-gray-400" />
                <span>Subscribe via Email</span>
              </button>
              <button 
                onClick={handleExportReport}
                disabled={isExportingReport}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {isExportingReport ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaChartLine className="text-indigo-400" />
                )}
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Logo Card - Integrated Drag & Drop */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          className={`rounded-3xl shadow-sm border p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden transition-all duration-300 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10' 
              : 'bg-white border-gray-100 shadow-sm hover:shadow-xl'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 -z-10 opacity-60" />
          
          <div className="relative group">
            <div className={`w-48 h-48 rounded-3xl overflow-hidden bg-white border-4 p-1 shadow-2xl flex items-center justify-center transition-all duration-300 ${
              isDragging ? 'border-indigo-400 scale-105' : 'border-gray-50'
            }`}>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Restaurant Logo"
                  className="w-full h-full object-cover rounded-[1.25rem]"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-200 group-hover:text-indigo-200 transition-colors">
                  <FaImage className="w-20 h-20 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Preview</span>
                </div>
              )}
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center rounded-[1.25rem]">
                  <div className="flex flex-col items-center">
                    <FaSpinner className="w-10 h-10 text-white animate-spin mb-2" />
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Uploading...</span>
                  </div>
                </div>
              )}
              {/* Drag indicator overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[1px] flex items-center justify-center rounded-[1.25rem]">
                  <FaCamera className="w-12 h-12 text-indigo-600 animate-bounce" />
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute -bottom-4 -right-4 w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-indigo-700 hover:scale-110 transition-all disabled:opacity-50 z-20 group-hover:shadow-indigo-200"
            >
              <FaCamera className="w-6 h-6" />
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center space-y-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Brand Identity</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                Your logo is the first thing customers see. Drop an image here or click the camera to update your brand identity.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-white border-2 border-gray-100 text-indigo-600 rounded-xl text-sm font-bold hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
              >
                <span>Change Logo</span>
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 text-red-500 text-sm font-bold hover:text-red-700 transition-all hover:bg-red-50 rounded-xl"
                >
                  Remove Logo
                </button>
              )}
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Supports JPG, PNG up to 5MB</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid lg:grid-cols-1 gap-6 items-start"
      >
        {/* Restaurant Details Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500">
        <div className="p-8 border-b border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10 opacity-50" />
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
              <FaStore className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Restaurant Profile</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Public Information</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUtensils className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white hover:border-gray-400"
                  placeholder="Enter restaurant name"
                />
              </div>
              <p className="text-xs text-gray-500">This will be displayed on your digital menu</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white hover:border-gray-400"
                  placeholder="Enter owner name"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <div className="relative group max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPhone className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white hover:border-gray-400"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FaMapMarkerAlt className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <textarea
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white hover:border-gray-400 resize-none"
                placeholder="Enter restaurant address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white hover:border-gray-400 resize-none"
              placeholder="Brief description of your restaurant, cuisine type, specialties, etc. (optional)"
            />
            <p className="text-xs text-gray-500 text-right">{formData.description?.length || 0}/500 characters</p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center space-x-2 font-medium shadow-lg shadow-indigo-200"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>

    {/* Delete Account Section - Collapsed by default */}
    <div className="mt-12 pt-8 border-t border-gray-100 mb-20">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaTrash className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Delete Account</h3>
                <p className="text-xs text-gray-500">Permanently remove your restaurant data</p>
              </div>
            </div>
            <span className="transition group-open:rotate-180">
              <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
            </span>
          </summary>
          <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-100">
            <div className="flex items-start space-x-3 mb-4">
              <FaExclamationTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800 text-sm">Warning: This action cannot be undone</h4>
                <p className="text-xs text-red-600 mt-1">
                  All your restaurant data including menu items, orders, and ledger history will be permanently deleted. 
                  Before deletion, we will send you an Excel export of all your data via email.
                </p>
              </div>
            </div>
            <button
              onClick={openDeleteModal}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <FaTrash className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </details>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDeleteModal} />
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Account?</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>

                {!otpSent ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      To proceed with account deletion, we will send a verification code to your email ({user?.email}).
                      All your data will be exported to Excel and sent to you before deletion.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={closeDeleteModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestDeleteOtp}
                        disabled={isSendingOtp}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isSendingOtp ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <FaEnvelope className="w-4 h-4" />
                            <span>Send OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Enter the 6-digit verification code sent to <strong>{user?.email}</strong>
                    </p>
                    <div className="mb-4">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={closeDeleteModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDeleteAccount}
                        disabled={isDeleting || otp.length !== 6}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {isDeleting ? (
                          <>
                            <FaSpinner className="w-4 h-4 animate-spin" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-4 h-4" />
                            <span>Confirm Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={requestDeleteOtp}
                      disabled={isSendingOtp}
                      className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 underline w-full text-center disabled:text-gray-400 disabled:no-underline"
                    >
                      {isSendingOtp ? 'Sending OTP...' : 'Resend OTP'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

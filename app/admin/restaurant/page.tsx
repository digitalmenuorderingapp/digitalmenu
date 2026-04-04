'use client';

import { useEffect, useState, useRef } from 'react';
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
  FaCheckCircle
} from 'react-icons/fa';
import Image from 'next/image';
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
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<Language>('hi');
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate size (5MB)
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

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FaStore className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
            <p className="text-gray-600">Manage your restaurant information and details</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Identity & Subscription Card */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-indigo-100 p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                <FaCrown className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{t.sub_payment_manual}</h2>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t.sub_rest_id}</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 font-mono font-black text-xl text-indigo-600 tracking-wider">
                  {user?.shortId || 'N/A'}
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-3 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                  title={t.sub_copy_id}
                >
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <p className="text-sm font-bold text-indigo-900 leading-relaxed whitespace-pre-line">
                  {t.sub_payment_desc}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => window.open('https://wa.me/919563401099', '_blank')}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                >
                  <FaWhatsapp />
                  <span>{t.sub_contact_whatsapp}</span>
                </button>
                <button 
                  onClick={() => window.location.href = 'mailto:digitalmenu.orderingapp@zohomail.in'}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  <FaEnvelope className="text-gray-400" />
                  <span>{t.sub_contact_email}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-10" />
          <div className="relative group">
            <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white border-2 border-gray-100 shadow-xl flex items-center justify-center">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Restaurant Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaImage className="w-16 h-16 text-gray-200" />
              )}
              {isUploadingLogo && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <FaSpinner className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute -bottom-3 -right-3 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <FaCamera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-black text-gray-900 mb-2">Restaurant Logo</h3>
            <p className="text-sm text-gray-500 font-medium mb-4 max-w-sm">
              Your logo appears on the digital menu and customer receipts. 
              Higher quality images build more trust with customers.
            </p>
            <div className="flex items-center justify-center sm:justify-start space-x-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-gray-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Change Logo
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-4 py-2 text-red-600 text-sm font-bold hover:text-red-700 transition-all"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Removed redundant logo section here since we moved it above */}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <div className="relative">
                <FaUtensils className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Enter restaurant name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Name *
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="ownerName"
                  required
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Enter owner name"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <FaPhone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                name="address"
                required
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
                placeholder="Enter restaurant address"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none"
              placeholder="Brief description of your restaurant (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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
        </form>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 mt-6">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
              <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action cannot be undone. All your restaurant data including menu items, orders, and ledger history will be permanently deleted.
              Before deletion, we will send you an Excel export of all your data via email.
            </p>
          </div>

          <button
            onClick={openDeleteModal}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <FaTrash className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
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

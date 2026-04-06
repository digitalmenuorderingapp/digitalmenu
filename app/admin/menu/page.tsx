'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { socketService } from '@/services/socket';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
  FaImage,
  FaTimes,
  FaUtensils,
  FaCloudUploadAlt,
  FaSave,
} from 'react-icons/fa';
import { Skeleton, MenuItemSkeleton } from '@/components/ui/Skeleton';

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  images?: string[];
  image?: string; // Keep for backward compatibility if needed in UI
  price: number;
  offerPrice?: number;
  discountPercentage: number;
  isActive: boolean;
  category?: string;
  foodType?: string;
  restaurantId?: string;
  isVeg?: boolean;
  isBestSeller?: boolean;
}

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    offerPrice: '',
    isActive: true,
    foodType: 'Main Course',
    isVeg: true,
    isBestSeller: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu/admin/all');
      setMenuItems(response.data.data);
    } catch (error) {
      toast.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      offerPrice: '',
      isActive: true,
      foodType: 'Main Course',
      isVeg: true,
      isBestSeller: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setRemovedImages([]);
    setEditingItem(null);
  };

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        offerPrice: item.offerPrice?.toString() || '',
        isActive: item.isActive,
        foodType: item.foodType || 'Main Course',
        isVeg: item.isVeg ?? true,
        isBestSeller: item.isBestSeller ?? false,
      });
      setExistingImages(item.images || (item.image ? [item.image] : []));
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`);
          return false;
        }
        return true;
      });

      if (imageFiles.length + existingImages.length + validFiles.length > 5) {
        toast.error('Maximum 5 images allowed');
        return;
      }

      setImageFiles(prev => [...prev, ...validFiles]);
      
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(img => img !== url));
    setRemovedImages(prev => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    if (formData.offerPrice) data.append('offerPrice', formData.offerPrice);
    data.append('isActive', formData.isActive.toString());
    data.append('foodType', formData.foodType);
    data.append('isVeg', formData.isVeg.toString());
    data.append('isBestSeller', formData.isBestSeller.toString());
    
    // Add multiple images
    imageFiles.forEach(file => {
      data.append('images', file);
    });

    // Add removed images for backend cleanup
    removedImages.forEach(url => {
      data.append('removedImages', url);
    });

    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem._id}`, data);
        toast.success('Menu item updated');
        // Emit socket event to notify customers
        socketService.emit('menuUpdated', { restaurantId: editingItem.restaurantId });
      } else {
        const response = await api.post('/menu', data);
        toast.success('Menu item created');
        // Emit socket event to notify customers
        socketService.emit('menuUpdated', { restaurantId: response.data.data?.restaurantId });
      }
      closeModal();
      fetchMenuItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    if (deletingItemId) return;
    
    setDeletingItemId(id);
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Menu item deleted');
      fetchMenuItems();
      
      // Emit socket event to notify customers of menu change
      socketService.emit('menuUpdated', { restaurantId: menuItems.find(i => i._id === id)?.restaurantId });
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleToggle = async (item: MenuItem) => {
    if (togglingItemId) return; // Prevent multiple clicks
    setTogglingItemId(item._id);
    
    try {
      await api.patch(`/menu/toggle/${item._id}`);
      toast.success(`Item ${item.isActive ? 'deactivated' : 'activated'}`);
      fetchMenuItems();
      
      // Emit socket event to notify customers of menu change
      socketService.emit('menuUpdated', { restaurantId: item.restaurantId });
    } catch (error) {
      toast.error('Failed to toggle item');
    } finally {
      setTogglingItemId(null);
    }
  };

  const calculateDiscount = (price: number, offerPrice: number) => {
    if (!offerPrice || price <= 0) return 0;
    return Math.round(((price - offerPrice) / price) * 100);
  };

  // Remove full-page blocking loader

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Add, edit, and manage your restaurant menu items.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <MenuItemSkeleton key={i} />)
        ) : (
          menuItems.map((item) => (
            <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              item.isActive ? 'border-gray-100' : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="relative h-48 bg-gray-100">
              {(item.images?.length || 0) > 0 || item.image ? (
                <Image
                  src={item.images?.[0] || item.image || ''}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FaImage className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {!item.isActive && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                  Inactive
                </div>
              )}
              {item.offerPrice && item.discountPercentage > 0 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg">
                  -{item.discountPercentage}%
                </div>
              )}
              {item.isBestSeller && (
                <div className="absolute bottom-2 left-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1 border border-amber-400">
                  <span className="animate-pulse">⭐</span> BEST SELLER
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                  <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                </div>
                {item.foodType && (
                  <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                    {item.foodType}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {item.description || 'No description'}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.offerPrice ? (
                    <>
                      <span className="text-lg font-bold text-indigo-600">
                        ₹{item.offerPrice.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{item.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-indigo-600">
                      ₹{item.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={togglingItemId === item._id}
                    className={`p-3 rounded-xl transition-all ${
                      togglingItemId === item._id
                        ? 'bg-gray-100 cursor-not-allowed'
                        : item.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {togglingItemId === item._id ? (
                      <FaSpinner className="w-6 h-6 animate-spin" />
                    ) : item.isActive ? (
                      <FaToggleOn className="w-7 h-7" />
                    ) : (
                      <FaToggleOff className="w-7 h-7" />
                    )}
                  </button>
                  <button
                    onClick={() => openModal(item)}
                    className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Edit"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingItemId === item._id}
                    className={`p-3 rounded-xl transition-all ${
                      deletingItemId === item._id
                        ? 'bg-gray-100 cursor-not-allowed text-gray-400'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    title="Delete"
                  >
                    {deletingItemId === item._id ? (
                      <FaSpinner className="w-5 h-5 animate-spin" />
                    ) : (
                      <FaTrash className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {menuItems.length === 0 && (
        <div className="text-center py-12">
          <FaImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No menu items yet</h3>
          <p className="text-gray-500 mb-4">Add your first menu item to get started.</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Add Item
          </button>
        </div>
      )}

      {/* Modal - Add/Edit Menu Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
              onClick={closeModal} 
            />
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <FaUtensils className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {editingItem ? 'Update item details' : 'Create a new menu item'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Item Images ({existingImages.length + imageFiles.length}/5)
                    </label>
                    <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square group">
                        <Image
                          src={url}
                          alt={`Existing ${index}`}
                          fill
                          className="object-cover rounded-xl shadow-sm border border-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all transform hover:scale-110"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* New Previews */}
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square group animate-in fade-in zoom-in-0 duration-200">
                        <Image
                          src={preview}
                          alt={`New preview ${index}`}
                          fill
                          className="object-cover rounded-xl shadow-sm border border-gray-100 ring-2 ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all transform hover:scale-110"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-md">NEW</div>
                      </div>
                    ))}

                    {/* Upload Trigger */}
                    {(existingImages.length + imageFiles.length) < 5 && (
                      <label className="relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group overflow-hidden">
                        <div className="flex flex-col items-center text-center p-2">
                          <FaCloudUploadAlt className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-600">Add More</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={(existingImages.length + imageFiles.length) >= 5}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Basic Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Butter Chicken"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Product Description
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Give your dish a tempting description. Ingredients, special prep, or origin story—it all sells better!"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Price Row */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Offer Price
                      {formData.price && formData.offerPrice && Number(formData.offerPrice) < Number(formData.price) && (
                        <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          {Math.round((1 - Number(formData.offerPrice) / Number(formData.price)) * 100)}% OFF
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.offerPrice}
                        onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Food Type & Status Row */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.foodType}
                      onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    >
                      <option value="Cold Beverage">🧊 Cold Beverage</option>
                      <option value="Hot Beverage">☕ Hot Beverage</option>
                      <option value="Appetizers">🍤 Appetizers</option>
                      <option value="Soups">🍜 Soups</option>
                      <option value="Salads">🥗 Salads</option>
                      <option value="Main Course">🍽️ Main Course</option>
                      <option value="Sides">🍟 Sides</option>
                      <option value="Desserts">🍰 Desserts</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors w-full">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {formData.isActive ? (
                        <FaToggleOn className="w-5 h-5 text-green-500 ml-auto" />
                      ) : (
                        <FaToggleOff className="w-5 h-5 text-gray-400 ml-auto" />
                      )}
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${formData.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${formData.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {formData.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        </span>
                        <input
                          type="checkbox"
                          checked={formData.isVeg}
                          onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                          className="ml-auto w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                      </label>

                      <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.isBestSeller ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                        <span className="text-lg">⭐</span>
                        <span className={`text-sm font-semibold ${formData.isBestSeller ? 'text-amber-700' : 'text-gray-700'}`}>
                          Best Seller Tag
                        </span>
                        <input
                          type="checkbox"
                          checked={formData.isBestSeller}
                          onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                          className="ml-auto w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : editingItem ? (
                      <>
                        <FaSave className="w-5 h-5" />
                        <span>Update Item</span>
                      </>
                    ) : (
                      <>
                        <FaPlus className="w-5 h-5" />
                        <span>Create Item</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

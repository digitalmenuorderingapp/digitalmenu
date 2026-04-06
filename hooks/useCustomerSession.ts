import { useState, useEffect } from 'react';
import api from '@/services/api';

interface CustomerSession {
  restaurantName?: string;
  restaurantId?: string;
  tableNumber?: string;
  tableCapacity?: number;
  customerName?: string;
  mobileNumber?: string;
  numberOfPersons?: number;
  deviceId?: string;
  sessionId?: string;
  logo?: string;
  motto?: string;
}

interface RestaurantDetails {
  id: string;
  restaurantName: string;
  ownerName?: string;
  email: string;
  address?: string;
  phone?: string;
  motto?: string;
  tableCapacity?: number;
}

export function useCustomerSession() {
  const [session, setSession] = useState<CustomerSession>({});

  useEffect(() => {
    // Load all session data from localStorage
    const restaurantName = localStorage.getItem('restaurantName');
    const restaurantId = localStorage.getItem('restaurantId');
    const tableNumber = localStorage.getItem('tableNumber');
    const tableCapacity = localStorage.getItem('tableCapacity');
    const customerName = localStorage.getItem('customerName');
    const mobileNumber = localStorage.getItem('mobileNumber');
    const numberOfPersons = localStorage.getItem('numberOfPersons');

    // Get persistent device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }

    // Generate unique session ID for this customer session
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

    setSession({
      restaurantName: restaurantName || undefined,
      restaurantId: restaurantId || undefined,
      tableNumber: tableNumber || undefined,
      tableCapacity: tableCapacity ? parseInt(tableCapacity) : undefined,
      customerName: customerName || undefined,
      mobileNumber: mobileNumber || undefined,
      numberOfPersons: numberOfPersons ? parseInt(numberOfPersons) : undefined,
      deviceId,
      sessionId,
    });
  }, []);

  const updateSession = (updates: Partial<CustomerSession>) => {
    // Update localStorage (exclude deviceId and sessionId)
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'deviceId' || key === 'sessionId') return; // Don't save to localStorage

      if (value !== undefined && value !== null) {
        localStorage.setItem(key, String(value));
      } else {
        localStorage.removeItem(key);
      }
    });

    // Update state
    setSession(prev => ({ ...prev, ...updates }));
  };

  const clearSession = () => {
    // Clear all session data
    const keys = ['restaurantName', 'restaurantId', 'tableNumber', 'tableCapacity', 'customerName', 'mobileNumber', 'numberOfPersons'];
    keys.forEach(key => localStorage.removeItem(key));
    setSession({});
  };

  const hasValidSession = () => {
    return !!(session.restaurantName && session.tableNumber && session.deviceId);
  };

  const fetchRestaurantById = async (restaurantId: string): Promise<RestaurantDetails | null> => {
    try {
      const response = await api.get(`/public/restaurant/${restaurantId}`);
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error('Restaurant not found');
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return null;
    }
  };

  return {
    session,
    updateSession,
    clearSession,
    hasValidSession,
    fetchRestaurantById,
  };
}

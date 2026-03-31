
import axios from 'axios';
import { Order, OrderItem } from '../types';

// На продакшн-хостинге API работает на том же домене
const API_URL = '/api';
const LOCAL_STORAGE_KEY = 'printmaster_orders_backup';

/**
 * Strips heavy base64 data from order items to prevent localStorage QuotaExceededError.
 * Local backup is primarily for text data; images are handled by the server.
 */
const sanitizeOrderForStorage = (order: Order): Order => {
  return {
    ...order,
    items: order.items.map(item => ({
      ...item,
      images: [], // Remove legacy images array
      printImages: item.printImages ? Object.keys(item.printImages).reduce((acc, key) => {
        acc[key] = "[Image Data Removed for Local Storage]";
        return acc;
      }, {} as Record<string, string>) : {}
    }))
  };
};

export const apiService = {
  /**
   * Simple login method
   */
  login: async (password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/login`, { password }, { timeout: 5000 });
      return response.data.success === true;
    } catch (error) {
      console.warn("Auth server unreachable or incorrect password.");
      return false;
    }
  },

  getOrders: async (): Promise<Order[]> => {
    let remoteOrders: Order[] = [];
    try {
      const response = await axios.get(`${API_URL}/orders`, { timeout: 5000 });
      remoteOrders = response.data;
    } catch (error) {
      console.warn("Backend unreachable. Operating in Local Mode.");
    }

    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    const localOrders: Order[] = localData ? JSON.parse(localData) : [];

    const orderMap = new Map<string, Order>();
    remoteOrders.forEach(o => orderMap.set(o.orderNumber, o));
    localOrders.forEach(o => orderMap.set(o.orderNumber, o));

    return Array.from(orderMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  submitOrder: async (order: Order): Promise<void> => {
    // 1. Attempt to sync with server FIRST with full data
    try {
      await axios.post(`${API_URL}/orders`, order, { timeout: 30000 });
    } catch (error) {
      console.warn("Server sync failed, order will be saved locally (without images).");
    }

    // 2. Save a lightweight version to localStorage to prevent QuotaExceededError
    try {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localOrders: Order[] = localData ? JSON.parse(localData) : [];
      
      const sanitizedOrder = sanitizeOrderForStorage(order);
      localOrders.push(sanitizedOrder);
      
      const trimmedOrders = localOrders.slice(-50);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmedOrders));
    } catch (storageError) {
      console.error("Local storage backup failed entirely:", storageError);
    }
  },

  updateOrder: async (orderNumber: string, data: Partial<Order>): Promise<Order> => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let localOrders: Order[] = localData ? JSON.parse(localData) : [];
    
    let updatedOrder: Order | null = null;
    localOrders = localOrders.map(o => {
      if (o.orderNumber === orderNumber) {
        updatedOrder = { ...o, ...data };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localOrders));
      } catch (e) {
        console.warn("Failed to update localStorage due to quota.");
      }
    }

    try {
      const response = await axios.patch(`${API_URL}/orders/${orderNumber}`, data, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.warn("Order updated locally, but server sync failed.");
      if (!updatedOrder) throw new Error("Order not found in local storage.");
      return updatedOrder;
    }
  },

  getSchools: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/schools`, { timeout: 5000 });
      return response.data;
    } catch (e) {
      console.warn("Failed to fetch schools from server");
      return [];
    }
  },
  
  saveSchool: async (school: any): Promise<any> => {
    const response = await axios.post(`${API_URL}/schools`, school);
    return response.data.school;
  },

  deleteSchool: async (id: string): Promise<boolean> => {
    const response = await axios.delete(`${API_URL}/schools/${id}`);
    return response.data.success;
  },

  uploadSchoolLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await axios.post(`${API_URL}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.logoUrl;
  },

  getInventory: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/inventory`, { timeout: 5000 });
      return response.data;
    } catch(e) {
      return [];
    }
  },

  saveInventoryBulk: async (inventory: any[]): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/inventory/bulk`, inventory);
      return true;
    } catch(e) {
      return false;
    }
  }
};

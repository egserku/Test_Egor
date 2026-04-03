
import { db, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp, where, auth } from '../firebase';
import { Order, OrderItem, School, InventoryItem } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively removes undefined values from an object.
 * Firestore does not support undefined values.
 */
function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Preserve Firestore Timestamps
  if (data instanceof Timestamp) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  }
  return sanitized;
}

export const apiService = {
  /**
   * Subscribe to real-time order updates
   */
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          orderNumber: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Order;
      });
      callback(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
  },

  /**
   * Fetch all orders once (promise-based)
   */
  getOrders: async (): Promise<Order[]> => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          orderNumber: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Order;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'orders');
      return [];
    }
  },

  /**
   * Subscribe to real-time updates for a specific user's orders
   */
  subscribeToUserOrders: (uid: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          orderNumber: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
        } as Order;
      });
      callback(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
  },

  /**
   * Submit a new order to Firestore
   */
  submitOrder: async (order: Order, uid: string): Promise<void> => {
    try {
      const orderRef = doc(collection(db, 'orders'), order.orderNumber);
      await setDoc(orderRef, sanitizeData({
        ...order,
        uid,
        createdAt: Timestamp.now(), // Use Firestore Timestamp for server-side time
        status: 'New'
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${order.orderNumber}`);
    }
  },

  /**
   * Update an existing order
   */
  updateOrder: async (orderNumber: string, data: Partial<Order>): Promise<void> => {
    try {
      const orderRef = doc(db, 'orders', orderNumber);
      await updateDoc(orderRef, sanitizeData(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderNumber}`);
    }
  },

  /**
   * Subscribe to real-time school updates
   */
  subscribeToSchools: (callback: (schools: School[]) => void) => {
    return onSnapshot(collection(db, 'schools'), (snapshot) => {
      const schoolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as School));
      callback(schoolsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'schools');
    });
  },

  /**
   * Fetch all schools once (promise-based)
   */
  getSchools: async (): Promise<School[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'schools'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as School));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'schools');
      return [];
    }
  },

  /**
   * Save or update a school
   */
  saveSchool: async (school: Partial<School>): Promise<void> => {
    try {
      const schoolId = school.id || Date.now().toString();
      const schoolRef = doc(db, 'schools', schoolId);
      const { id, ...data } = school;
      await setDoc(schoolRef, sanitizeData(data), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `schools/${school.id}`);
    }
  },

  /**
   * Delete a school
   */
  deleteSchool: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'schools', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `schools/${id}`);
    }
  },

  /**
   * Subscribe to real-time inventory updates
   */
  subscribeToInventory: (callback: (inventory: InventoryItem[]) => void) => {
    return onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
      callback(inventoryData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'inventory');
    });
  },

  /**
   * Fetch all inventory once (promise-based)
   */
  getInventory: async (): Promise<InventoryItem[]> => {
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InventoryItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'inventory');
      return [];
    }
  },

  /**
   * Update inventory item quantity
   */
  updateInventoryQty: async (id: string, newQty: number): Promise<void> => {
    try {
      const itemRef = doc(db, 'inventory', id);
      await updateDoc(itemRef, { quantity: newQty });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
    }
  },

  /**
   * Add a new inventory item
   */
  addInventoryItem: async (item: InventoryItem): Promise<void> => {
    try {
      const { id, ...data } = item;
      await setDoc(doc(db, 'inventory', id), sanitizeData(data));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `inventory/${item.id}`);
    }
  },

  /**
   * Delete an inventory item
   */
  deleteInventoryItem: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
    }
  }
};

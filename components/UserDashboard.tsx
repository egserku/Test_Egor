
import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, User } from '../firebase';
import { Order, OrderStatus } from '../types';
import { apiService } from '../services/apiService';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';

export const UserDashboard: React.FC<{ 
  onBack: () => void,
  onEditDesign: (order: Order, itemIdx: number, place: string) => void 
}> = ({ onBack, onEditDesign }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    if (user) {
      const unsubscribeOrders = apiService.subscribeToUserOrders(user.uid, (data) => {
        setOrders(data);
        setLoading(false);
      });
      return () => {
        unsubscribeAuth();
        unsubscribeOrders();
      };
    }

    return () => unsubscribeAuth();
  }, [user]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-600';
      case 'Processing': return 'bg-amber-100 text-amber-600';
      case 'Completed': return 'bg-green-100 text-green-600';
      case 'Cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const updateQuantity = async (order: Order, itemIdx: number, newQty: number) => {
    if (newQty < 1) return;
    const updatedItems = [...order.items];
    updatedItems[itemIdx] = { ...updatedItems[itemIdx], quantity: newQty };
    try {
      await apiService.updateOrder(order.orderNumber, { items: updatedItems });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const updateMultiSizeQuantity = async (order: Order, itemIdx: number, size: string, newQty: number) => {
    if (newQty < 0) return;
    const updatedItems = [...order.items];
    const item = { ...updatedItems[itemIdx] };
    if (item.multiSize) {
      const newMultiSize = { ...item.multiSize, [size]: newQty };
      item.multiSize = newMultiSize;
      updatedItems[itemIdx] = item;
      try {
        await apiService.updateOrder(order.orderNumber, { items: updatedItems });
      } catch (error) {
        console.error("Failed to update multi-size quantity:", error);
      }
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">{t('user.login_required')}</h2>
        <Button onClick={onBack}>{t('common.back')}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('user.my_orders')}</h1>
          <p className="text-gray-500 font-medium">{user.email}</p>
        </div>
        <Button onClick={onBack} variant="outline" size="sm">{t('common.back')}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center shadow-xl border border-gray-100">
          <div className="text-6xl mb-6">📦</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('user.no_orders')}</h2>
          <p className="text-gray-500 mb-8">{t('user.no_orders_desc')}</p>
          <Button onClick={onBack} variant="primary">{t('home.cta')}</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.orderNumber} className="bg-white rounded-[32px] p-8 shadow-lg border border-gray-50 hover:shadow-xl transition-all">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t('common.order_number')}</span>
                  <span className="text-lg font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                  {t(`statuses.${order.status}`)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{t('admin.composition')}</h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                            <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm border border-gray-100">
                              {item.multiSize ? Object.values(item.multiSize).reduce((a, b) => a + b, 0) : item.quantity}
                            </span>
                            <span className="font-bold">{t(`products.${item.type.toLowerCase().replace('-', '_')}`)}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">
                              {item.color}
                              {item.size && `, ${item.size}`}
                            </span>
                          </div>

                          {/* Quantity Editor */}
                          {order.status === 'New' && (
                            <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-2">{t('order.quantity')}</span>
                              {item.multiSize ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {Object.entries(item.multiSize).map(([size, qty]) => (
                                    <div key={size} className="flex flex-col gap-1">
                                      <span className="text-[10px] font-bold text-gray-500">{size}</span>
                                      <div className="flex items-center gap-1">
                                        <button 
                                          onClick={() => updateMultiSizeQuantity(order, idx, size, qty - 1)}
                                          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-xs transition-colors"
                                        >-</button>
                                        <span className="text-xs font-mono font-bold w-6 text-center">{qty}</span>
                                        <button 
                                          onClick={() => updateMultiSizeQuantity(order, idx, size, qty + 1)}
                                          className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-xs transition-colors"
                                        >+</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => updateQuantity(order, idx, (item.quantity || 1) - 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                                  >-</button>
                                  <span className="text-sm font-mono font-bold w-8 text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(order, idx, (item.quantity || 1) + 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                                  >+</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Design Previews */}
                        {item.printImages && Object.keys(item.printImages).length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(item.printImages).map(([place, img]) => (
                              <div key={place} className="relative group">
                                <div className="aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                  <img src={img} alt={place} className="w-full h-full object-contain p-2" />
                                </div>
                                <div className="mt-1 flex flex-col gap-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t(`places.${place}`)}</span>
                                  {order.status === 'New' && (
                                    <button 
                                      onClick={() => onEditDesign(order, idx, place)}
                                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                                    >
                                      {t('common.edit')} 🎨
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {(!item.printImages || Object.keys(item.printImages).length === 0) && (
                          <p className="text-[10px] text-gray-400 italic">{t('user.no_design')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('admin.date')}</span>
                  <span className="text-sm font-bold text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

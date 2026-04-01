
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, ProductType, OrderSubtype, OrderItem } from '../types';
import { Button } from './ui/Button';
import { AdminSchoolsPanel } from './AdminSchoolsPanel';
import { AdminInventoryPanel } from './AdminInventoryPanel';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';

type SortField = 'date' | 'customer' | 'status';

// Status labels are now localized within the component

export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [activeTab, setActiveTab] = useState<'orders' | 'schools' | 'inventory'>('orders');
  
  const statusLabels: Record<OrderStatus, string> = {
    'New': t('statuses.New'),
    'Processing': t('statuses.Processing'),
    'Completed': t('statuses.Completed'),
    'Cancelled': t('statuses.Cancelled')
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Bulk selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribeToOrders((ordersData) => {
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      const currentOrder = orders.find(o => o.orderNumber === selectedOrder.orderNumber);
      if (currentOrder) {
        setSelectedOrder(currentOrder);
        setEditingNotes(currentOrder.internalNotes || '');
      }
    }
  }, [orders]);

  const fetchOrders = () => {
    // Real-time updates are handled by onSnapshot in useEffect
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const updateOrderData = async (orderNumber: string, data: Partial<Order>) => {
    try {
      await apiService.updateOrder(orderNumber, data);
      // Local state is updated via subscription
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  };

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return;
    setIsBulkUpdating(true);
    
    try {
      const promises = Array.from(selectedOrderIds).map(id => {
        return apiService.updateOrder(id, { status: newStatus, viewed: true });
      });
      
      await Promise.all(promises);
      setSelectedOrderIds(new Set());
      alert(t('admin.bulk_confirm', { count: selectedOrderIds.size }));
    } catch (error) {
      console.error("Bulk update error:", error);
      alert(t('admin.bulk_error'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleOrderSelection = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (visibleOrders: Order[]) => {
    if (selectedOrderIds.size === visibleOrders.length && visibleOrders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(visibleOrders.map(o => o.orderNumber)));
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    if (!order.viewed) {
      updateOrderData(order.orderNumber, { viewed: true });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setIsSavingNotes(true);
    try {
      await updateOrderData(selectedOrder.orderNumber, { internalNotes: editingNotes });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setFilterText('');
    setStatusFilter('all');
    setSelectedOrderIds(new Set());
  };

  const downloadImage = (base64: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesText = 
        order.customer.name.toLowerCase().includes(filterText.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(filterText.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(filterText.toLowerCase()) ||
        (order.internalNotes && order.internalNotes.toLowerCase().includes(filterText.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesText && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'customer') {
        comparison = a.customer.name.localeCompare(b.customer.name);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-700';
      case 'Processing': return 'bg-yellow-100 text-yellow-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getItemIcon = (type: ProductType) => {
    switch(type) {
      case ProductType.TSHIRT: return '👕';
      case ProductType.HOODIE: return '🧥';
      case ProductType.CAP: return '🧢';
      case ProductType.TANK_TOP: return '🎽';
      default: return '📦';
    }
  };

  const getStatusCount = (status: OrderStatus) => orders.filter(o => o.status === status).length;
  const getUnreadCount = (status: OrderStatus) => orders.filter(o => o.status === status && !o.viewed).length;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 animate-in fade-in duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800">{t('admin.title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => setActiveTab('orders')} variant={activeTab === 'orders' ? 'primary' : 'outline'}>{t('admin.tabs.orders')}</Button>
           <Button onClick={() => setActiveTab('schools')} variant={activeTab === 'schools' ? 'primary' : 'outline'}>{t('admin.tabs.schools')}</Button>
           <Button onClick={() => setActiveTab('inventory')} variant={activeTab === 'inventory' ? 'primary' : 'outline'}>{t('admin.tabs.inventory')}</Button>
        </div>
        {activeTab === 'orders' && (
          <Button onClick={fetchOrders} variant="outline" size="sm" className="w-full md:w-auto">
            🔄 {t('admin.refresh')}
          </Button>
        )}
      </div>

      {activeTab === 'inventory' ? <AdminInventoryPanel /> : activeTab === 'schools' ? <AdminSchoolsPanel /> : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {(Object.keys(statusLabels) as OrderStatus[]).map((status) => {
          const unread = getUnreadCount(status);
          return (
            <div 
              key={status} 
              onClick={() => setStatusFilter(status)}
              className={`p-5 rounded-2xl cursor-pointer transition-all border-2 relative overflow-hidden ${
                statusFilter === status 
                  ? 'bg-indigo-50 border-indigo-500 shadow-md scale-[1.02]' 
                  : 'bg-white border-gray-100 hover:border-indigo-200'
              }`}
            >
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{statusLabels[status]}</p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-gray-800">{getStatusCount(status)}</span>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`}></span>
              </div>
              {unread > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase">{unread} {t('common.new_order').toLowerCase().split(' ')[0]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-end gap-4 mb-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('common.category').split('/')[0]} / {t('admin.search_placeholder').split(',')[0]}</label>
          <input 
            type="text" 
            placeholder={t('admin.search_placeholder')}
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 text-sm shadow-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">{t('admin.status_filter')}</label>
          <select 
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none cursor-pointer text-sm shadow-sm font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('admin.all_statuses')}</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        {(statusFilter !== 'all' || filterText) && (
          <button 
            onClick={resetFilters}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-3 transition-colors"
          >
            {t('admin.clear')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">{t('order_form.processing')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                    onChange={() => handleSelectAll(filteredOrders)}
                  />
                </th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} onClick={() => handleSort('date')}>
                  {t('admin.status_filter').split(' ')[0]} {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>ID</th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} onClick={() => handleSort('customer')}>
                  {t('admin.client')} {sortField === 'customer' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('categories.team')}
                </th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} onClick={() => handleSort('status')}>
                  {t('admin.status')} {sortField === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className={`px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>...</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">{t('admin.no_orders')}</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.orderNumber} 
                    className={`transition-colors group cursor-pointer ${selectedOrderIds.has(order.orderNumber) ? 'bg-indigo-50' : 'hover:bg-indigo-50/50'}`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedOrderIds.has(order.orderNumber)}
                        onChange={() => toggleOrderSelection(order.orderNumber)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                      <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {!order.viewed && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shadow-sm shadow-indigo-200" title={t('common.new_order')}></span>
                        )}
                        <span className="font-mono text-[10px] font-bold text-indigo-500">
                          {order.orderNumber.split('-')[1]}
                        </span>
                        {order.internalNotes && (
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shadow-sm" title="Есть внутренняя заметка"></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-800">{order.customer.name}</div>
                      <div className="text-[10px] text-gray-400">{order.customer.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-sm shadow-sm" title={item.type}>
                            {getItemIcon(item.type)}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none appearance-none cursor-pointer border-none shadow-sm ${getStatusColor(order.status)}`}
                        value={order.status}
                        onClick={(e) => e.stopPropagation()} 
                        onChange={(e) => updateOrderData(order.orderNumber, { status: e.target.value as OrderStatus, viewed: true })}
                      >
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg">
                      👁️
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}

      {/* Floating Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6 z-[60] animate-in slide-in-from-bottom-4 duration-300 border border-gray-700">
          <div className="flex items-center gap-3 pr-6 border-r border-gray-700">
            <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {selectedOrderIds.size}
            </span>
            <span className="text-sm font-medium text-gray-300">выбрано</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleBulkStatusUpdate('Processing')}
              disabled={isBulkUpdating}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {statusLabels['Processing']}
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Completed')}
              disabled={isBulkUpdating}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {statusLabels['Completed']}
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Cancelled')}
              disabled={isBulkUpdating}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {statusLabels['Cancelled']}
            </button>
          </div>

          <button 
            onClick={() => setSelectedOrderIds(new Set())}
            className="text-gray-400 hover:text-white transition-colors"
            title="Отменить выбор"
          >
            ✕
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h3 className="text-xl font-bold text-gray-800">{t('admin.order_details')} {selectedOrder.orderNumber}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="grid md:grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{t('admin.client')}</h4>
                  <p className="font-bold text-gray-800 text-lg">{selectedOrder.customer.name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">✉️ {selectedOrder.customer.email}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">📞 {selectedOrder.customer.phone}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">{t('admin.delivery')}</h4>
                  <p className="text-sm text-gray-700"><strong>{t('customer.address_label')}:</strong> {selectedOrder.customer.address || '—'}</p>
                  <p className="text-sm text-gray-700 mt-1"><strong>{t('admin.client')}:</strong> {selectedOrder.customer.comments || '—'}</p>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">📝 {t('admin.internal_notes')}</h4>
                <textarea 
                  className="w-full p-4 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 ring-amber-400 text-sm h-24 resize-none shadow-inner"
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="..."
                />
                <div className="mt-2 flex justify-end">
                   <Button 
                    size="sm" 
                    variant="primary" 
                    className="bg-amber-600 hover:bg-amber-700 shadow-sm" 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || editingNotes === (selectedOrder.internalNotes || '')}
                  >
                    {isSavingNotes ? t('admin.saving') : t('admin.save_notes')}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  📦 {t('admin.composition')} <span className="text-sm font-normal text-gray-400">({selectedOrder.items.length})</span>
                </h4>
                {selectedOrder.items.map((item, idx) => {
                  const isTeamItem = item.subtype === OrderSubtype.TEAM;
                  const playersList = Array.isArray(item.players) ? item.players : [];
                  
                  return (
                    <div key={idx} className="border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 transition-all bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                          {getItemIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="text-lg font-bold text-gray-800 leading-tight">
                                {t(`products.${item.type.toLowerCase().replace('-', '_')}`)} 
                                <span className="text-indigo-600 ml-1">[{t(`categories.${item.subtype.toLowerCase() === 'школа' ? 'school' : item.subtype.toLowerCase() === 'команда' ? 'team' : 'personal'}`)}]</span>
                              </h5>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase">{item.color}</span>
                                {item.fabric && <span className="px-2 py-1 bg-amber-100 rounded-md text-[10px] font-bold text-amber-700 uppercase">{t('order_form.fabric_choice')}: {item.fabric}</span>}
                                {!isTeamItem && <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-600 uppercase">{t('order_form.sizes').split(' ')[0]}: {item.size}</span>}
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isTeamItem ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                  {isTeamItem ? `${t('admin.composition')}: ${playersList.length || item.quantity}` : `${t('order.quantity')}: ${item.quantity} ${t('order.pcs')}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-4">
                            {item.school && (<div><p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.school')}</p><p className="text-gray-800 font-medium">{item.school}</p></div>)}
                            {item.gender && !isTeamItem && (<div><p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.gender')}</p><p className="text-gray-800 font-medium">{item.gender}</p></div>)}
                            {item.sleeve && !isTeamItem && (<div><p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.sleeve')}</p><p className="text-gray-800 font-medium">{item.sleeve}</p></div>)}
                            {item.hoodieType && (<div><p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.hoodie_type')}</p><p className="text-gray-800 font-medium">{item.hoodieType}</p></div>)}
                            {item.capType && (<div><p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.cap_model')}</p><p className="text-gray-800 font-medium">{item.capType}</p></div>)}
                            {item.printPlaces && item.printPlaces.length > 0 && (
                               <div className="sm:col-span-2">
                                 <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t('admin.print_places')}</p>
                                 <div className="flex flex-wrap gap-1">{item.printPlaces.map(p => (<span key={p} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-xs text-gray-700 font-medium">{p}</span>))}</div>
                               </div>
                            )}
                          </div>

                          {/* Item-specific Wishes */}
                          {item.wishes && (
                            <div className="mb-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                              <p className="text-indigo-600 text-[10px] font-black uppercase mb-1 tracking-widest flex items-center gap-2">
                                <span>💬 {t('admin.wishes')}</span>
                              </p>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{item.wishes}</p>
                            </div>
                          )}
                          
                          {/* Player Roster */}
                          {isTeamItem && (
                            <div className="mt-6 border-t pt-4 animate-in slide-in-from-top-2 duration-300">
                              <p className="text-indigo-600 text-[10px] font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                                <span>📋 {t('admin.roster')}</span>
                                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px]">{playersList.length}</span>
                              </p>
                              
                              {playersList.length > 0 ? (
                                <div className="overflow-hidden border border-indigo-100 rounded-xl shadow-sm">
                                  <table className="min-w-full divide-y divide-indigo-50">
                                    <thead className="bg-indigo-50/50">
                                      <tr className="text-left text-[9px] font-black text-indigo-400 uppercase">
                                        <th className="px-3 py-2">{t('customer.name_label')}</th>
                                        <th className="px-3 py-2 text-center">#</th>
                                        <th className="px-3 py-2">{t('admin.gender')}</th>
                                        <th className="px-3 py-2 text-center">{t('order.size')}</th>
                                        <th className="px-3 py-2">{t('admin.sleeve')}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-50 text-[11px]">
                                      {playersList.map((player, pIdx) => (
                                        <tr key={player.id || pIdx} className="hover:bg-indigo-50/20 transition-colors">
                                          <td className="px-3 py-2 font-bold text-gray-800">{player.name || '—'}</td>
                                          <td className="px-3 py-2 text-center text-indigo-600 font-black">{player.number || '—'}</td>
                                          <td className="px-3 py-2 text-gray-500">{player.gender}</td>
                                          <td className="px-3 py-2 text-center font-black bg-indigo-50/30 text-indigo-700">{player.size}</td>
                                          <td className="px-3 py-2 text-gray-400">{player.sleeve}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="p-6 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center gap-2 text-center">
                                  <span className="text-2xl">⚠️</span>
                                  <p className="text-red-600 font-bold text-sm">{t('admin.no_roster')}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ЗАГРУЖЕННЫЕ ДИЗАЙНЫ (PRINT IMAGES) */}
                          {item.printImages && Object.keys(item.printImages).length > 0 && (
                            <div className="mt-6 border-t pt-4">
                              <p className="text-indigo-600 text-[10px] font-black uppercase mb-4 tracking-widest flex items-center gap-2">
                                <span>🖼️ {t('admin.mockups')}</span>
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {Object.entries(item.printImages).map(([place, imgData]) => {
                                  const isLightweight = imgData.includes("Removed for Local Storage");
                                  return (
                                    <div key={place} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter text-center mb-1">{place}</p>
                                      <div className="aspect-square bg-white rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center relative shadow-sm">
                                        {!isLightweight ? (
                                          <img 
                                            src={imgData} 
                                            alt={place} 
                                            className="w-full h-full object-contain cursor-pointer" 
                                            onClick={() => window.open(imgData, '_blank')}
                                          />
                                        ) : (
                                          <div className="text-center p-2">
                                            <span className="text-xl block mb-1">📵</span>
                                            <span className="text-[8px] text-gray-400 leading-none block uppercase font-black">{t('admin.no_orders')}</span>
                                          </div>
                                        )}
                                      </div>
                                      {!isLightweight && (
                                        <button 
                                          onClick={() => downloadImage(imgData, `Layout_${selectedOrder.orderNumber}_${place}.png`)}
                                          className="w-full py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                        >
                                          {t('admin.download')}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Legacy Support (item.images) */}
                          {item.images && item.images.length > 0 && !item.printImages && (
                            <div className="mt-4">
                               <p className="text-gray-400 text-[10px] font-black uppercase mb-2 tracking-widest">Legacy-файлы ({item.images.length})</p>
                               <div className="flex flex-wrap gap-2">{item.images.map((img, i) => (<a key={i} href={img} target="_blank" rel="noreferrer" className="block w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-all shadow-sm"><img src={img} alt="layout" className="w-full h-full object-cover" /></a>))}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex gap-2">
                <Button onClick={() => setSelectedOrder(null)} variant="outline">{t('admin.close')}</Button>
                <Button onClick={() => window.print()} variant="outline" className="hidden sm:inline-flex">🖨️ {t('admin.print')}</Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">{t('admin.status')}:</span>
                <select 
                  className={`text-sm font-bold rounded-xl px-4 py-2 outline-none border border-gray-200 shadow-sm transition-all focus:ring-2 ring-indigo-500 ${getStatusColor(selectedOrder.status)}`}
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderData(selectedOrder.orderNumber, { status: e.target.value as OrderStatus, viewed: true })}
                >
                  {Object.entries(statusLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

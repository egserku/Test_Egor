import React, { useState, useEffect } from 'react';
import { InventoryItem, ProductType } from '../types';
import { apiService } from '../services/apiService';
import { Button } from './ui/Button';
import { COLORS, PERSONAL_SIZES_KIDS, PERSONAL_SIZES_ADULTS, SCHOOL_SIZES_KIDS, SCHOOL_SIZES_ADULTS, SLEEVES } from '../constants';
import { useTranslation } from 'react-i18next';

const FABRICS = ['100% хлопок', 'DryFit'];

export const AdminInventoryPanel: React.FC = () => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    productType: ProductType.TSHIRT,
    color: COLORS[0].name,
    size: 'M',
    quantity: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const data = await apiService.getInventory();
    setInventory(data);
    setLoading(false);
  };

  const handleSave = async (updatedInv: InventoryItem[]) => {
    setIsSaving(true);
    const success = await apiService.saveInventoryBulk(updatedInv);
    if (success) {
      setInventory(updatedInv);
    } else {
      alert(t('admin.save_error'));
      await fetchInventory(); // Revert
    }
    setIsSaving(false);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    });
    setInventory(updated); // Optimistic UI
    
    // Debounce save or just save directly (it's internal admin tool)
    clearTimeout((window as any)._invSaveTimer);
    (window as any)._invSaveTimer = setTimeout(() => {
      handleSave(updated);
    }, 500);
  };

  const handleDelete = (id: string) => {
    if(!window.confirm(t('admin.pos_delete_confirm'))) return;
    const updated = inventory.filter(i => i.id !== id);
    handleSave(updated);
  };

  const handleAdd = () => {
    if (!newItem.productType || !newItem.color || !newItem.size) return alert(t('admin.upload_logo_error')); // Reuse for "fill all fields"
    // Check if exists (same type+color+size+sleeve+fabric)
    const exists = inventory.find(i =>
      i.productType === newItem.productType &&
      i.color === newItem.color &&
      i.size === newItem.size &&
      (i.sleeve || '') === (newItem.sleeve || '') &&
      (i.fabric || '') === (newItem.fabric || '')
    );
    if (exists) {
      alert(t('admin.item_exists_error'));
      return;
    }
    const itemToAdd: InventoryItem = {
      id: Date.now().toString(),
      productType: newItem.productType as ProductType,
      color: newItem.color!,
      size: newItem.size!,
      quantity: Number(newItem.quantity) || 0,
      sleeve: newItem.sleeve || undefined,
      fabric: newItem.fabric || undefined
    };
    handleSave([...inventory, itemToAdd]);
  };

  const allSizes = Array.from(new Set([...PERSONAL_SIZES_KIDS, ...PERSONAL_SIZES_ADULTS, ...SCHOOL_SIZES_KIDS, ...SCHOOL_SIZES_ADULTS]));

  const getQtyStyle = (qty: number) => {
    if (qty === 0) return { row: 'bg-red-50/40', badge: 'bg-red-100 text-red-700 border border-red-200', dot: '#ef4444' };
    if (qty < 5) return { row: 'bg-orange-50/40', badge: 'bg-orange-100 text-orange-700 border border-orange-200', dot: '#f97316' };
    return { row: '', badge: 'bg-green-100 text-green-700 border border-green-200', dot: '#22c55e' };
  };

  const filteredInventory = inventory.filter(item => {
    if (stockFilter === 'all') return true;
    if (stockFilter === 'in_stock') return item.quantity >= 5;
    if (stockFilter === 'low') return item.quantity > 0 && item.quantity < 5;
    if (stockFilter === 'out') return item.quantity === 0;
    return true;
  });

  // Group by product type
  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.productType]) acc[item.productType] = [];
    acc[item.productType].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const productNames: Record<ProductType, string> = {
    [ProductType.TSHIRT]: t('products.tshirt'),
    [ProductType.HOODIE]: t('products.hoodie'),
    [ProductType.CAP]: t('products.cap'),
    [ProductType.TANK_TOP]: t('products.tank_top')
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 mt-8 mb-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-800">{t('admin.inventory_title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.inventory_subtitle')}</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => setStockFilter('all')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${stockFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t('admin.all')}
          </button>
          <button 
            onClick={() => setStockFilter('in_stock')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${stockFilter === 'in_stock' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400 hover:text-green-500'}`}
          >
            {t('admin.in_stock_tab')}
          </button>
          <button 
            onClick={() => setStockFilter('low')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${stockFilter === 'low' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-orange-500'}`}
          >
            {t('admin.low_tab')}
          </button>
          <button 
            onClick={() => setStockFilter('out')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${stockFilter === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-red-500'}`}
          >
            {t('admin.out_tab')}
          </button>
        </div>
      </div>

      <div className="mb-10 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">➕ {t('admin.add_new_pos')}</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.product')}</label>
            <select 
              className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
              value={newItem.productType}
              onChange={e => setNewItem({...newItem, productType: e.target.value as ProductType})}
            >
              {Object.entries(productNames).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.color')}</label>
            <select 
              className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
              value={newItem.color}
              onChange={e => setNewItem({...newItem, color: e.target.value})}
            >
              {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.size')}</label>
            {newItem.productType === ProductType.CAP ? (
              <select className="w-full p-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-gray-100" disabled>
                <option>{t('order_form.unisex')}</option>
              </select>
            ) : (
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
                value={newItem.size}
                onChange={e => setNewItem({...newItem, size: e.target.value})}
              >
                {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.sleeve')}</label>
            {(newItem.productType === ProductType.CAP || newItem.productType === ProductType.TANK_TOP || newItem.productType === ProductType.HOODIE) ? (
              <select className="w-full p-2.5 rounded-xl border border-gray-200 text-sm bg-gray-100" disabled>
                <option>—</option>
              </select>
            ) : (
              <select
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
                value={newItem.sleeve || ''}
                onChange={e => setNewItem({...newItem, sleeve: e.target.value || undefined})}
              >
                <option value="">{t('admin.any')}</option>
                {[...SLEEVES.BOY, ...SLEEVES.GIRL].filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.fabric')}</label>
            {newItem.productType !== ProductType.TSHIRT && newItem.productType !== ProductType.TANK_TOP ? (
              <select className="w-full p-2.5 rounded-xl border border-gray-200 text-sm bg-gray-100" disabled>
                <option>—</option>
              </select>
            ) : (
              <select
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
                value={newItem.fabric || ''}
                onChange={e => setNewItem({...newItem, fabric: e.target.value || undefined})}
              >
                <option value="">{t('admin.any')}</option>
                {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
          <div className="w-20">
            <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.quantity').split(' ')[0]}</label>
            <input 
              type="number" 
              className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-bold bg-white text-center"
              value={newItem.quantity}
              onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})}
              min="0"
            />
          </div>
          <div className="w-full md:w-auto">
             <Button onClick={handleAdd} disabled={isSaving}>{t('admin.create')}</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center"><p className="text-gray-500 font-medium">{t('order_form.processing')}</p></div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
           <p className="text-gray-400 font-medium">{t('admin.empty_inventory')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedInventory).map(([type, items]) => (
            <div key={type} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                  <h4 className="font-black text-gray-800 uppercase tracking-wider">{productNames[type as ProductType]}</h4>
               </div>
               <div className="divide-y divide-gray-50 bg-white">
                  {items.sort((a,b) => a.color.localeCompare(b.color) || a.size.localeCompare(b.size)).map(item => {
                    const qStyle = getQtyStyle(item.quantity);
                    return (
                     <div key={item.id} className={`flex items-center justify-between px-6 py-4 transition-colors ${qStyle.row} hover:brightness-95`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                         <div className="w-4 h-4 flex-shrink-0 rounded-full shadow-inner border border-gray-200" style={{ backgroundColor: COLORS.find(c => c.name === item.color)?.hex || '#ccc' }}></div>
                         <span className="font-bold text-sm text-gray-700 flex-shrink-0">{item.color}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                         <span className="bg-indigo-50 text-indigo-700 font-black text-[10px] px-2.5 py-1 rounded-lg border border-indigo-100 uppercase">{item.size}</span>
                         {item.sleeve && <span className="bg-gray-100 text-gray-600 font-bold text-[10px] px-2 py-1 rounded-lg">{item.sleeve}</span>}
                         {item.fabric && <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-1 rounded-lg">{item.fabric}</span>}
                      </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => handleUpdateQty(item.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center transition-colors">−</button>
                           <div className="relative">
                             <input 
                               type="number" 
                               className={`w-20 text-center font-black text-lg outline-none bg-transparent rounded-xl py-1 ${item.quantity === 0 ? 'text-red-600' : item.quantity < 5 ? 'text-orange-600' : 'text-green-600'}`}
                               value={item.quantity}
                               onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  handleUpdateQty(item.id, val - item.quantity);
                               }}
                             />
                             <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${ item.quantity === 0 ? 'text-red-500' : item.quantity < 5 ? 'text-orange-500' : 'text-green-600'}`}>
                               {item.quantity === 0 ? `● ${t('order.out_of_stock_short')}` : item.quantity < 5 ? `● ${t('order.low_stock').split(' ')[0]}` : `● ${t('order.in_stock').split(' ')[0]}`}
                             </span>
                           </div>
                           <button onClick={() => handleUpdateQty(item.id, 1)} className="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold flex items-center justify-center transition-colors">+</button>
                        </div>
                        <div>
                           <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-4" title={t('admin.pos_delete_confirm')}>✕</button>
                        </div>
                     </div>
                    );
                   })}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

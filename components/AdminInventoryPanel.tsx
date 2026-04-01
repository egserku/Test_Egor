import React, { useState, useEffect } from 'react';
import { InventoryItem, ProductType } from '../types';
import { Button } from './ui/Button';
import { COLORS, PERSONAL_SIZES_KIDS, PERSONAL_SIZES_ADULTS, SCHOOL_SIZES_KIDS, SCHOOL_SIZES_ADULTS, SLEEVES } from '../constants';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';

const FABRICS = ['100% хлопок', 'DryFit'];

export const AdminInventoryPanel: React.FC = () => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    productType: ProductType.TSHIRT,
    color: COLORS[0].name,
    size: 'M',
    sleeve: 'Короткий',
    fabric: '100% хлопок',
    quantity: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [matrixConfig, setMatrixConfig] = useState({
    productType: ProductType.TSHIRT,
    sleeve: 'Короткий',
    fabric: '100% хлопок',
    sizeSet: 'adults' as 'adults' | 'kids'
  });
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    const unsubscribe = apiService.subscribeToInventory((inventoryData) => {
      setInventory(inventoryData);
      setLoading(false);
      
      // Update matrix data when inventory changes
      const newMatrix: Record<string, Record<string, number>> = {};
      inventoryData.forEach(item => {
        if (item.productType === matrixConfig.productType && 
            (item.sleeve || '') === (matrixConfig.sleeve || '') && 
            (item.fabric || '') === (matrixConfig.fabric || '')) {
          if (!newMatrix[item.color]) newMatrix[item.color] = {};
          newMatrix[item.color][item.size] = item.quantity;
        }
      });
      setMatrixData(newMatrix);
    });

    return () => unsubscribe();
  }, [matrixConfig.productType, matrixConfig.sleeve, matrixConfig.fabric]);

  const handleMatrixChange = (color: string, size: string, value: number) => {
    setMatrixData(prev => ({
      ...prev,
      [color]: {
        ...(prev[color] || {}),
        [size]: value
      }
    }));
  };

  const saveMatrix = async () => {
    setIsSaving(true);
    try {
      const updates: Promise<void>[] = [];
      
      for (const color of Object.keys(matrixData)) {
        for (const size of Object.keys(matrixData[color])) {
          const qty = matrixData[color][size];
          const existing = inventory.find(i => 
            i.productType === matrixConfig.productType && 
            i.color === color && 
            i.size === size &&
            (i.sleeve || '') === (matrixConfig.sleeve || '') &&
            (i.fabric || '') === (matrixConfig.fabric || '')
          );

          if (existing) {
            if (existing.quantity !== qty) {
              updates.push(apiService.updateInventoryQty(existing.id, qty));
            }
          } else if (qty > 0) {
            // Create new item if it doesn't exist and qty > 0
            const id = `${matrixConfig.productType}-${color}-${size}-${matrixConfig.sleeve || ''}-${matrixConfig.fabric || ''}`.replace(/[\s/]+/g, '_');
            updates.push(apiService.addInventoryItem({
              id,
              productType: matrixConfig.productType,
              color,
              size,
              quantity: qty,
              sleeve: matrixConfig.sleeve,
              fabric: matrixConfig.fabric
            }));
          }
        }
      }
      
      await Promise.all(updates);
      alert(t('admin.save_confirm'));
    } catch (error) {
      console.error("Matrix save error:", error);
      alert(t('admin.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const fetchInventory = () => {
    // Real-time updates are handled by onSnapshot
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleUpdateQty = async (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    try {
      await apiService.updateInventoryQty(id, newQty);
    } catch (error) {
      console.error("Inventory update error:", error);
      alert(t('admin.save_error'));
    }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm(t('admin.pos_delete_confirm'))) return;
    try {
      await apiService.deleteInventoryItem(id);
    } catch (error) {
      console.error("Inventory delete error:", error);
      alert(t('admin.delete_error'));
    }
  };

  const handleAdd = async () => {
    if (!newItem.productType || !newItem.color || !newItem.size) {
      alert(t('admin.fill_all_fields'));
      return;
    }    
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

    setIsSaving(true);
    try {
      const id = `${newItem.productType}-${newItem.color}-${newItem.size}-${newItem.sleeve || ''}-${newItem.fabric || ''}`.replace(/[\s/]+/g, '_');
      const itemToAdd: InventoryItem = {
        id,
        productType: newItem.productType as ProductType,
        color: newItem.color!,
        size: newItem.size!,
        quantity: Number(newItem.quantity) || 0,
      };
      
      if (newItem.sleeve) itemToAdd.sleeve = newItem.sleeve;
      if (newItem.fabric) itemToAdd.fabric = newItem.fabric;
      
      await apiService.addInventoryItem(itemToAdd);
      setNewItem({
        productType: ProductType.TSHIRT,
        color: COLORS[0].name,
        size: 'M',
        quantity: 0
      });
    } catch (error) {
      console.error("Inventory add error:", error);
      alert(t('admin.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const fillMatrixWith20 = () => {
    const newMatrix = { ...matrixData };
    COLORS.forEach(color => {
      // Create a new object for each color to avoid mutation
      newMatrix[color.name] = { ...(newMatrix[color.name] || {}) };
      matrixSizes.forEach(size => {
        newMatrix[color.name][size] = 20;
      });
    });
    setMatrixData(newMatrix);
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

  const matrixSizes = matrixConfig.sizeSet === 'adults' ? PERSONAL_SIZES_ADULTS : PERSONAL_SIZES_KIDS;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 mt-8 mb-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">{t('admin.inventory_title')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.inventory_subtitle')}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          <button 
            onClick={() => setViewMode('list')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            📋 {t('admin.all')}
          </button>
          <button 
            onClick={() => setViewMode('matrix')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'matrix' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            🔲 {t('admin.matrix_view') || 'Матрица'}
          </button>
        </div>

        {viewMode === 'list' && (
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
        )}
      </div>

      {viewMode === 'matrix' ? (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.product')}</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white"
                value={matrixConfig.productType}
                onChange={e => setMatrixConfig({...matrixConfig, productType: e.target.value as ProductType})}
              >
                {Object.entries(productNames).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.sleeve')}</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white disabled:bg-gray-100"
                value={matrixConfig.sleeve || ''}
                disabled={matrixConfig.productType === ProductType.CAP || matrixConfig.productType === ProductType.TANK_TOP || matrixConfig.productType === ProductType.HOODIE}
                onChange={e => setMatrixConfig({...matrixConfig, sleeve: e.target.value})}
              >
                {[...SLEEVES.BOY, ...SLEEVES.GIRL].filter((v, i, a) => a.indexOf(v) === i).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.fabric')}</label>
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-indigo-500 text-sm font-medium bg-white disabled:bg-gray-100"
                value={matrixConfig.fabric || ''}
                disabled={matrixConfig.productType !== ProductType.TSHIRT && matrixConfig.productType !== ProductType.TANK_TOP}
                onChange={e => setMatrixConfig({...matrixConfig, fabric: e.target.value})}
              >
                {FABRICS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{t('order.size')}</label>
              <div className="flex bg-white rounded-xl border border-gray-200 p-1">
                <button 
                  onClick={() => setMatrixConfig({...matrixConfig, sizeSet: 'adults'})}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${matrixConfig.sizeSet === 'adults' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  Adults
                </button>
                <button 
                  onClick={() => setMatrixConfig({...matrixConfig, sizeSet: 'kids'})}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${matrixConfig.sizeSet === 'kids' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                  Kids
                </button>
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fillMatrixWith20} className="w-full text-[10px] font-black uppercase py-2.5">
                🪄 {t('admin.fill_20') || 'Заполнить по 20'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm mb-8">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10 w-40">{t('order.color')}</th>
                  {matrixSizes.map(size => (
                    <th key={size} className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center min-w-[80px]">{size}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {COLORS.map(color => (
                  <tr key={color.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full shadow-inner border border-gray-200" style={{ backgroundColor: color.hex }}></div>
                        <span className="text-sm font-bold text-gray-700">{color.name}</span>
                      </div>
                    </td>
                    {matrixSizes.map(size => {
                      const qty = matrixData[color.name]?.[size] || 0;
                      return (
                        <td key={size} className="px-2 py-2">
                          <input 
                            type="number"
                            min="0"
                            className={`w-full p-2 text-center text-sm font-bold rounded-lg border transition-all outline-none focus:ring-2 focus:ring-indigo-500/20 ${qty === 0 ? 'bg-red-50 border-red-100 text-red-600' : qty < 5 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-white border-gray-100 text-gray-700'}`}
                            value={qty}
                            onChange={e => handleMatrixChange(color.name, size, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setViewMode('list')}>{t('common.back')}</Button>
            <Button onClick={saveMatrix} disabled={isSaving} className="px-12">
              {isSaving ? t('order_form.processing') : t('admin.save')}
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                onChange={e => setNewItem({...newItem, sleeve: e.target.value})}
              >
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
                onChange={e => setNewItem({...newItem, fabric: e.target.value})}
              >
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
          <div className="w-full md:w-auto flex gap-2">
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
    </>
  )}
</div>
);
};

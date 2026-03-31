
import React, { useState, useEffect, useRef } from 'react';
import { 
  ProductType, OrderSubtype, OrderItem, HoodieType, CapType,
} from '../types';
import { 
  COLORS, SCHOOL_LIST, PRINT_PLACES, SLEEVES,
  SCHOOL_SIZES_KIDS, SCHOOL_SIZES_ADULTS,
  PERSONAL_SIZES_KIDS, PERSONAL_SIZES_ADULTS
} from '../constants';
import { Button } from './ui/Button';
import { PlayerTable } from './PlayerTable';
import { getDesignFeedback } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { School, InventoryItem } from '../types';
import { useTranslation } from 'react-i18next';

import { ProductPreview } from './ProductPreview';

interface OrderFormProps {
  productType: ProductType;
  initialSubtype: OrderSubtype;
  onAddToCart: (item: OrderItem | OrderItem[]) => void;
  onCancel: () => void;
}

const FABRICS = ['100% хлопок', 'DryFit'];

export const OrderForm: React.FC<OrderFormProps> = ({ productType, initialSubtype, onAddToCart, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<OrderItem>>({
    quantity: 1,
    color: COLORS[0].name,
    printPlaces: [],
    images: [],
    printImages: {},
    players: [],
    gender: 'Мальчик' as any,
    size: 'M',
    sleeve: 'Короткий',
    fabric: FABRICS[0],
    wishes: ''
  });
  
  const [uploadingZones, setUploadingZones] = useState<Set<string>>(new Set());
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [multiColorSelections, setMultiColorSelections] = useState<Record<string, number>>({});
  const [multiSizeSelections, setMultiSizeSelections] = useState<Record<string, number>>({});
  const [tips, setTips] = useState<string | null>(null);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolsList, setSchoolsList] = useState<School[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isMultiColorMode = initialSubtype === OrderSubtype.SCHOOL && (productType === ProductType.TSHIRT || productType === ProductType.HOODIE);
  const isMultiSizeMode = initialSubtype === OrderSubtype.PERSONAL && (productType === ProductType.TSHIRT || productType === ProductType.HOODIE);
  const isTeamMode = initialSubtype === OrderSubtype.TEAM;

  const totalMultiSizeQty = Object.values(multiSizeSelections).reduce((acc, qty) => acc + qty, 0);

  useEffect(() => {
    let defaultPrintPlaces: string[] = [];
    if (initialSubtype === OrderSubtype.SCHOOL) defaultPrintPlaces = ['Спереди'];

    if (productType === ProductType.CAP) {
        setFormData(prev => ({ ...prev, capType: CapType.BASEBALL, printPlaces: ['Спереди'] }));
    } else if (productType === ProductType.HOODIE) {
        setFormData(prev => ({ ...prev, hoodieType: HoodieType.KANGAROO, printPlaces: defaultPrintPlaces, sleeve: 'Длинный', gender: 'Универсальный' }));
    } else if (productType === ProductType.TANK_TOP) {
        setFormData(prev => ({ ...prev, sleeve: 'Без рукавов', printPlaces: defaultPrintPlaces }));
    } else if (initialSubtype === OrderSubtype.PERSONAL && productType === ProductType.TSHIRT) {
        setFormData(prev => ({ ...prev, printPlaces: defaultPrintPlaces, sleeve: 'Короткий', gender: 'Универсальный' }));
    } else {
        setFormData(prev => ({ ...prev, printPlaces: defaultPrintPlaces, sleeve: 'Короткий' }));
    }
    getDesignFeedback(productType, initialSubtype).then(res => setTips(res || null));

    if (initialSubtype === OrderSubtype.SCHOOL) {
      apiService.getSchools().then(data => setSchoolsList(data));
    }
    apiService.getInventory().then(data => setInventory(data));
  }, [productType, initialSubtype]);

  const getStockForSize = (sizeName: string) => {
    if (!inventory.length) return null;
    return inventory.filter(i => {
      if (i.productType !== productType || i.color !== formData.color || i.size !== sizeName) return false;
      if (i.sleeve && formData.sleeve && i.sleeve !== formData.sleeve) return false;
      if (i.fabric && formData.fabric && i.fabric !== formData.fabric) return false;
      return true;
    }).reduce((acc, item) => acc + item.quantity, 0);
  };

  const getStockForColor = (colorName: string) => {
    if (!inventory.length) return null;
    return inventory.filter(i => {
      if (i.productType !== productType || i.color !== colorName) return false;
      // Filter by size if one is selected, to keep it consistent with the size grid
      if (formData.size && i.size !== formData.size) return false;
      if (i.sleeve && formData.sleeve && i.sleeve !== formData.sleeve) return false;
      if (i.fabric && formData.fabric && i.fabric !== formData.fabric) return false;
      return true;
    }).reduce((acc, item) => acc + item.quantity, 0);
  };

  const processFile = (place: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение.');
      return;
    }
    
    setUploadingZones(prev => new Set(prev).add(place));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        printPlaces: prev.printPlaces?.includes(place) ? prev.printPlaces : [...(prev.printPlaces || []), place],
        printImages: { ...(prev.printImages || {}), [place]: base64 }
      }));
      setUploadingZones(prev => {
        const next = new Set(prev);
        next.delete(place);
        return next;
      });
    };
    reader.onerror = () => {
      setUploadingZones(prev => {
        const next = new Set(prev);
        next.delete(place);
        return next;
      });
      alert('Ошибка при чтении файла.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (place: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(place, file);
  };

  const handleDragOver = (e: React.DragEvent, place: string) => {
    e.preventDefault();
    setDragOverZone(place);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, place: string) => {
    e.preventDefault();
    setDragOverZone(null);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(place, file);
  };

  const removePrintImage = (place: string) => {
    setFormData(prev => {
      const newImages = { ...prev.printImages };
      delete newImages[place];
      return {
        ...prev,
        printPlaces: prev.printPlaces?.filter(p => p !== place),
        printImages: newImages
      };
    });
  };

  const updateMultiSizeQty = (sizeName: string, delta: number) => {
    setMultiSizeSelections(prev => {
      const current = prev[sizeName] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[sizeName];
      else updated[sizeName] = next;
      return updated;
    });
  };

  const handleAdd = () => {
    const allImages = Object.values(formData.printImages || {});
    if (isMultiColorMode) {
      const colors = Object.keys(multiColorSelections);
      if (colors.length === 0) return;
      const items = colors.map(colorName => ({
        ...formData, id: Math.random().toString(36).substr(2, 9),
        type: productType, subtype: initialSubtype, color: colorName,
        quantity: multiColorSelections[colorName], images: allImages
      } as OrderItem));
      onAddToCart(items);
    } else if (isMultiSizeMode) {
      const sizes = Object.keys(multiSizeSelections);
      if (sizes.length === 0) return;
      const items = sizes.map(sizeName => ({
        ...formData, id: Math.random().toString(36).substr(2, 9),
        type: productType, subtype: initialSubtype, size: sizeName,
        quantity: multiSizeSelections[sizeName], images: allImages
      } as OrderItem));
      onAddToCart(items);
    } else {
      onAddToCart({ ...formData, id: Math.random().toString(36).substr(2, 9), type: productType, subtype: initialSubtype, images: allImages } as OrderItem);
    }
  };

  const getAvailablePrintZones = () => {
    if (productType === ProductType.CAP) return ['Спереди'];
    if (productType === ProductType.TANK_TOP) return ['Спереди', 'Сзади'];
    return PRINT_PLACES;
  };

  return (
    <div className="bg-white rounded-[40px] p-10 shadow-2xl max-w-3xl mx-auto border border-gray-50">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">{t(`categories.${initialSubtype.toLowerCase()}`)}</h2>
          <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest mt-1">
            {t(`products.${productType.toLowerCase().replace('-', '_')}`)}
          </p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors">✕</button>
      </div>

      <div className="space-y-10">
        <div className="animate-in fade-in duration-700">
          <ProductPreview 
            key={`${productType}-${formData.color}`}
            productType={productType}
            color={formData.color || COLORS[0].name}
            hoodieType={formData.hoodieType}
            printImages={formData.printImages || {}}
            gender={formData.gender}
          />
        </div>

        {tips && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
             <div className="flex items-center gap-2 mb-3">
               <span className="text-lg">✨</span>
               <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{t('order_form.design_tips')}</h4>
             </div>
             <div className="text-xs text-indigo-900/80 leading-relaxed font-medium space-y-1">
               {tips.split('\n').map((line, i) => <p key={i}>{line.trim()}</p>)}
             </div>
          </div>
        )}

        {(productType === ProductType.HOODIE || productType === ProductType.CAP) && !isTeamMode && (
          <div className="animate-in slide-in-from-left-4 duration-400">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.model')} {productType === ProductType.CAP ? t('products.cap').toLowerCase() : t('products.hoodie').toLowerCase()}</label>
            <div className="flex flex-wrap gap-4">
              {productType === ProductType.HOODIE ?
                [
                  { type: HoodieType.KANGAROO, img: '/assets/ui/hoodie_kangaroo.png', label: t('models.kangaroo') },
                  { type: HoodieType.ZIP, img: '/assets/ui/hoodie_zip.png', label: t('models.zip') },
                  { type: HoodieType.SWEATER, img: '/assets/ui/hoodie_sweater.png', label: t('models.sweater') }
                ].map(({ type, img, label }) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, hoodieType: type })}
                    className={`flex flex-col items-center px-3 py-2 rounded-2xl border-2 transition-all ${formData.hoodieType === type ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 bg-gray-50 text-gray-300 hover:border-gray-200'}`}
                  >
                    <img src={img} alt={label} className={`w-16 h-16 object-contain mb-2 ${formData.hoodieType === type ? '' : 'opacity-60'}`} />
                    <span className={`text-[11px] font-black uppercase ${formData.hoodieType === type ? 'text-indigo-700' : 'text-gray-400'}`}>{label}</span>
                  </button>
                ))
                :
                [
                  { type: CapType.BASEBALL, img: '/assets/ui/cap_baseball.png', label: t('models.baseball') },
                  { type: CapType.SNAPBACK, img: '/assets/ui/cap_snapback.png', label: t('models.snapback') },
                  { type: CapType.BEANIE, img: '/assets/ui/cap_beanie.png', label: t('models.beanie') }
                ].map(({ type, img, label }) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, capType: type })}
                    className={`flex flex-col items-center px-3 py-2 rounded-2xl border-2 transition-all ${formData.capType === type ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 bg-gray-50 text-gray-300 hover:border-gray-200'}`}
                  >
                    <img src={img} alt={label} className={`w-16 h-16 object-contain mb-2 ${formData.capType === type ? '' : 'opacity-60'}`} />
                    <span className={`text-[11px] font-black uppercase ${formData.capType === type ? 'text-indigo-700' : 'text-gray-400'}`}>{label}</span>
                  </button>
                ))
              }
            </div>
          </div>
        )}

        {isTeamMode && productType === ProductType.TSHIRT && (
          <div className="animate-in slide-in-from-left-4 duration-400">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.fabric_choice')}</label>
            <div className="flex gap-3">
              {FABRICS.map(f => (
                <button
                  key={f}
                  onClick={() => setFormData({ ...formData, fabric: f })}
                  className={`flex-1 h-14 rounded-2xl font-black text-[12px] uppercase border-2 transition-all ${
                    formData.fabric === f 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'border-gray-50 bg-gray-50 text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Секция загрузки макетов для Личного Дизайна: Всегда 4 зоны для T-shirt/Hoodie */}
        {initialSubtype === OrderSubtype.PERSONAL ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.upload_mockups')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {getAvailablePrintZones().map(place => {
                const hasImage = !!formData.printImages?.[place];
                const isUploading = uploadingZones.has(place);
                const isDragOver = dragOverZone === place;

                return (
                  <div 
                    key={place} 
                    onDragOver={(e) => handleDragOver(e, place)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, place)}
                    className={`bg-gray-50 p-6 rounded-[32px] border-2 transition-all group flex flex-col items-center text-center relative ${
                      isDragOver ? 'border-dashed border-indigo-400 bg-indigo-50/80 scale-105' : 
                      hasImage ? 'border-indigo-500 bg-indigo-50 shadow-lg' : 'border-gray-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="w-full flex justify-between items-start mb-4">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${hasImage ? 'text-indigo-600' : 'text-gray-400'}`}>{place}</span>
                       {hasImage && !isUploading && (
                         <button onClick={() => removePrintImage(place)} className="text-red-400 hover:text-red-600 text-[10px] font-black uppercase tracking-widest">Удалить</button>
                       )}
                    </div>
                    
                    <div className="w-32 h-32 mb-6 bg-white rounded-[32px] shadow-inner border border-gray-100 flex items-center justify-center overflow-hidden relative group-hover:scale-105 transition-transform">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[8px] font-black text-indigo-400 uppercase">{t('order_form.processing')}</span>
                          </div>
                        ) : hasImage ? (
                          <img src={formData.printImages?.[place]} alt={place} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center opacity-30">
                            <span className="text-4xl mb-2">📥</span>
                            <span className="text-[8px] font-black uppercase leading-none">{t('order_form.drag_here')}</span>
                          </div>
                        )}
                    </div>

                    <input type="file" accept="image/*" className="hidden" ref={el => { fileInputRefs.current[place] = el; }} onChange={(e) => handleFileUpload(place, e)} />
                    <button 
                      disabled={isUploading}
                      onClick={() => fileInputRefs.current[place]?.click()}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                        hasImage ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white shadow-md'
                      }`}
                    >
                      {isUploading ? 'Загрузка...' : hasImage ? 'Заменить файл' : 'Выбрать макет'}
                    </button>
                    {!hasImage && !isUploading && (
                      <p className="mt-3 text-[9px] text-gray-400 font-bold uppercase opacity-50">PNG, JPG до 5MB</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : initialSubtype === OrderSubtype.SCHOOL && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.search_school')}</label>
            <div className="mb-6">
              <input type="text" placeholder={t('order_form.search_school')} className="w-full h-14 px-6 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all text-sm font-medium" value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {schoolsList.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase())).map(school => (
                <div key={school.id} onClick={() => setFormData({ ...formData, school: school.name })} className={`cursor-pointer group flex flex-col items-center p-4 rounded-[28px] border-2 transition-all ${formData.school === school.name ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]' : 'border-gray-50 bg-gray-50 hover:border-indigo-200'}`}>
                  <div className="w-16 h-16 mb-3 bg-white rounded-2xl p-2 shadow-sm flex items-center justify-center overflow-hidden"><img src={school.logo} alt={school.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" /></div>
                  <span className={`text-[10px] text-center font-black uppercase tracking-tighter leading-tight ${formData.school === school.name ? 'text-indigo-700' : 'text-gray-400'}`}>{school.name}</span>
                </div>
              ))}
              {schoolsList.length === 0 && <p className="col-span-full py-8 text-center text-gray-500 text-xs">Список школ загружается или пуст...</p>}
            </div>
          </div>
        )}

        {productType !== ProductType.CAP && 
         productType !== ProductType.TANK_TOP && 
         productType !== ProductType.HOODIE && 
         !isTeamMode && 
         initialSubtype !== OrderSubtype.PERSONAL && (
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.for_who')}</label>
            <div className="flex gap-3">
              {[
                { value: 'Мальчик', label: t('order_form.boys') },
                { value: 'Девочка', label: t('order_form.girls') }
              ].map(g => (
                <button 
                  key={g.value} 
                  onClick={() => setFormData({ ...formData, gender: g.value as any })} 
                  className={`flex-1 h-14 rounded-2xl font-black text-[12px] uppercase border-2 transition-all ${formData.gender === g.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-300'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {productType === ProductType.TSHIRT && !isTeamMode && (
          <div className="animate-in slide-in-from-left-4 duration-400">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.sleeve_length')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { type: 'Короткий', img: '/assets/ui/sleeve_short.png', label: t('order_form.sleeve_short') },
                { type: 'Длинный', img: '/assets/ui/sleeve_long.png', label: t('order_form.sleeve_long') },
                { type: '3/4', img: '/assets/ui/sleeve_3_4.png', label: t('order_form.sleeve_3_4') }
              ].filter(s => 
                (initialSubtype === OrderSubtype.PERSONAL 
                  ? SLEEVES.BOY 
                  : (formData.gender === 'Девочка' ? SLEEVES.GIRL : SLEEVES.BOY)
                ).includes(s.type)
              ).map(({ type, img, label }) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, sleeve: type })}
                  className={`group relative flex flex-col items-center p-3 rounded-3xl border-2 transition-all duration-300 ${
                    formData.sleeve === type
                      ? 'border-indigo-600 bg-indigo-50 shadow-md scale-[1.02]'
                      : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="w-full aspect-square mb-3 relative overflow-hidden rounded-2xl bg-white/80 p-2 group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src={img} 
                      alt={label} 
                      className="w-full h-full object-contain mix-blend-multiply"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/shapes/svg?seed=' + type;
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-center ${
                    formData.sleeve === type ? 'text-indigo-700' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {formData.sleeve === type && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                      <span className="text-white text-[10px]">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isTeamMode && productType !== ProductType.CAP && (
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.sizes')} {inventory.length > 0 && <span className="ml-2 text-[9px] text-gray-400 font-normal normal-case opacity-60">{t('order_form.stock_info')}</span>}</label>
            <div className="flex flex-wrap gap-2">
              {(isMultiSizeMode ? [...PERSONAL_SIZES_KIDS, ...PERSONAL_SIZES_ADULTS] : (initialSubtype === OrderSubtype.SCHOOL ? [...SCHOOL_SIZES_KIDS, ...SCHOOL_SIZES_ADULTS] : [...PERSONAL_SIZES_KIDS, ...PERSONAL_SIZES_ADULTS])).map(size => {
                const isSelected = isMultiSizeMode ? (multiSizeSelections[size] || 0) > 0 : formData.size === size;
                const stock = getStockForSize(size);
                const isOut = stock !== null && stock <= 0;
                return (
                  <button 
                    key={size} 
                    disabled={isOut} 
                    onClick={() => {
                      if (isMultiSizeMode) {
                        updateMultiSizeQty(size, 1);
                      }
                      setFormData(prev => ({ ...prev, size }));
                    }} 
                    onContextMenu={(e) => { e.preventDefault(); if(isMultiSizeMode) updateMultiSizeQty(size, -1); }} 
                    className={`min-w-[54px] h-[54px] rounded-2xl font-bold text-sm transition-all flex flex-col items-center justify-center relative ${isOut ? 'bg-gray-50/50 text-gray-300 cursor-not-allowed border border-gray-100' : isSelected ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <span className={isOut ? 'opacity-40' : ''}>{size}</span>
                    {isMultiSizeMode && (multiSizeSelections[size] || 0) > 0 && <span className="absolute -top-2 -right-2 bg-indigo-200 text-indigo-900 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{multiSizeSelections[size]}</span>}
                    {stock !== null && !isOut && <span className={`absolute -bottom-1.5 text-[8px] font-black tracking-tight ${stock < 5 ? 'text-red-500' : 'text-gray-400'}`}>{stock}{t('order.pcs')}</span>}
                    {isOut && <span className="absolute -bottom-1.5 text-[8px] font-black tracking-tight text-gray-300 uppercase">{t('order_form.out_of_stock_short')}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.color')} {isMultiColorMode ? t('order_form.multi_color') : ''} {inventory.length > 0 && <span className="ml-2 text-[9px] text-gray-400 font-normal normal-case opacity-60">{t('order_form.stock_info')}</span>}</label>
          <div className="grid grid-cols-5 gap-3">
            {COLORS.map(c => {
              const isSelected = isMultiColorMode ? !!multiColorSelections[c.name] : formData.color === c.name;
              const stock = getStockForColor(c.name);
              const isOut = stock !== null && stock <= 0;
              return (
                <div key={c.hex} className="flex flex-col items-center gap-1">
                  <button 
                    disabled={isOut} 
                    onClick={() => {
                      if (isMultiColorMode) {
                        setMultiColorSelections(p => ({...p, [c.name]: p[c.name] ? p[c.name] : 1}));
                        setFormData(prev => ({ ...prev, color: c.name }));
                      } else {
                        setFormData(prev => ({ ...prev, color: c.name }));
                      }
                    }} 
                    className={`w-full aspect-square rounded-[24px] transition-all relative flex items-center justify-center ${isOut ? 'opacity-20 cursor-not-allowed grayscale' : isSelected ? 'ring-4 ring-indigo-500 ring-offset-4 scale-[1.05]' : 'hover:scale-[1.05]'}`} 
                    style={{ backgroundColor: c.hex, border: c.hex === '#FFFFFF' ? '1px solid #e5e7eb' : 'none' }}
                  >
                    {isSelected && <div className={`w-8 h-8 rounded-full flex items-center justify-center ${c.hex === '#FFFFFF' ? 'bg-indigo-600' : 'bg-white'}`}>{isMultiColorMode ? <span className={`${c.hex === '#FFFFFF' ? 'text-white' : 'text-gray-900'} font-black text-xs`}>{multiColorSelections[c.name]}</span> : <span className={`${c.hex === '#FFFFFF' ? 'text-white' : 'text-gray-900'} font-black text-lg`}>✓</span>}</div>}
                  </button>
                  {stock !== null && !isOut && <span className={`text-[8px] font-black tracking-tight ${stock < 10 ? 'text-red-500' : 'text-gray-400'}`}>{stock}{t('order.pcs')}</span>}
                  {isOut && <span className="text-[8px] font-black tracking-tight text-gray-300 uppercase">{t('order_form.out_of_stock_short')}</span>}
                </div>
              );
            })}
          </div>
          {isMultiColorMode && Object.keys(multiColorSelections).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
               {Object.entries(multiColorSelections).map(([cName, qty]) => (
                 <div key={cName} className="flex items-center justify-between bg-gray-50/50 p-4 rounded-[24px] border border-gray-100 shadow-sm">
                    <span className="text-[13px] font-black text-gray-700 uppercase">{cName}</span>
                    <div className="flex items-center bg-white/80 rounded-xl p-1 gap-4">
                       <button onClick={() => setMultiColorSelections(p => { const n = {...p}; if(qty <= 1) delete n[cName]; else n[cName] = qty-1; return n; })} className="w-8 h-8 flex items-center justify-center font-bold text-lg">−</button>
                       <span className="text-sm font-black">{qty}</span>
                       <button onClick={() => setMultiColorSelections(p => ({...p, [cName]: qty+1}))} className="w-8 h-8 flex items-center justify-center font-bold text-lg">+</button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {isTeamMode && <PlayerTable players={formData.players || []} onChange={(players) => setFormData({ ...formData, players })} productType={productType} />}

        <div className="animate-in slide-in-from-bottom-4 duration-400">
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('order_form.wishes_label')}</label>
          <textarea 
            value={formData.wishes}
            onChange={(e) => setFormData({ ...formData, wishes: e.target.value })}
            placeholder={t('order_form.wishes_placeholder')}
            className="w-full h-32 p-6 bg-gray-50 border border-gray-100 rounded-[32px] outline-none focus:bg-white focus:border-indigo-400 transition-all text-sm font-medium resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="mt-14 flex flex-col items-center">
        {(isMultiSizeMode || isMultiColorMode) && <p className="mb-6 text-sm font-black text-gray-400 uppercase tracking-widest">{t('order_form.total')}: <span className="text-indigo-600 font-black text-lg">{isMultiSizeMode ? totalMultiSizeQty : Object.values(multiColorSelections).reduce((a, b) => a + b, 0)} {t('order.pcs')}.</span></p>}
        <Button onClick={handleAdd} variant="primary" size="lg" fullWidth className="h-16 rounded-3xl font-black text-[14px] uppercase tracking-[0.1em] shadow-xl hover:shadow-indigo-200" disabled={(initialSubtype === OrderSubtype.SCHOOL && !formData.school) || (isMultiSizeMode && totalMultiSizeQty === 0) || (isMultiColorMode && Object.keys(multiColorSelections).length === 0) || (isTeamMode && !formData.players?.length) || (initialSubtype === OrderSubtype.PERSONAL && formData.printPlaces?.length === 0)}>
          {formData.id ? t('order_form.update_data') : t('order_form.add_to_cart')}
        </Button>
      </div>
    </div>
  );
};

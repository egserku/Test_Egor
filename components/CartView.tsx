
import React from 'react';
import { OrderItem } from '../types';
import { Button } from './ui/Button';
import { useTranslation } from 'react-i18next';

interface CartViewProps {
  items: OrderItem[];
  onRemove: (id: string) => void;
  onNext: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ items, onRemove, onNext }) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  const getItemIcon = (type: string) => {
    switch(type) {
      case 'TSHIRT': return '👕';
      case 'HOODIE': return '🧥';
      case 'CAP': return '🧢';
      case 'TANK_TOP': return '🎽';
      default: return '📦';
    }
  };

  return (
    <div className="mt-12 bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        🛒 {t('cart.title')} <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">{items.length}</span>
      </h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl">
                {getItemIcon(item.type)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{t(`categories.${item.subtype.toLowerCase() === 'школа' ? 'school' : item.subtype.toLowerCase() === 'команда' ? 'team' : 'personal'}`)} - {t(`products.${item.type.toLowerCase().replace('-', '_')}`)}</p>
                <p className="text-xs text-gray-500 uppercase font-semibold">
                  {item.color} 
                  {item.size && ` • ${item.size}`}
                  {item.quantity && ` • x${item.quantity}`}
                  {item.multiSize && ` • ${Object.entries(item.multiSize).map(([s, q]) => `${s}(${q})`).join(', ')}`}
                  {item.fabric && ` • ${item.fabric}`}
                  {item.school && ` • ${item.school}`}
                  {item.players && ` • ${t('categories.team')} (${item.players.length})`}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">{t('cart.total_qty')}:</p>
          <p className="text-xl font-bold text-gray-800">
            {items.reduce((acc, item) => {
              if (item.players) return acc + item.players.length;
              if (item.multiSize) return acc + Object.values(item.multiSize).reduce((a, b) => a + b, 0);
              return acc + (item.quantity || 0);
            }, 0)} {t('order.pcs')}
          </p>
        </div>
        <Button onClick={onNext} variant="primary" size="lg">{t('cart.checkout_btn')}</Button>
      </div>
    </div>
  );
};

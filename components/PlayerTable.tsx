
import React from 'react';
import { Player, ProductType } from '../types';
import { Button } from './ui/Button';
import { TEAM_SIZES_KIDS, TEAM_SIZES_ADULTS } from '../constants';
import { useTranslation } from 'react-i18next';

interface PlayerTableProps {
  players: Player[];
  onChange: (players: Player[]) => void;
  productType?: ProductType;
}

export const PlayerTable: React.FC<PlayerTableProps> = ({ players, onChange, productType }) => {
  const { t } = useTranslation();
  
  const addPlayer = () => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      number: '',
      gender: 'Мальчик',
      sleeve: 'Короткий',
      size: 'S'
    };
    onChange([...players, newPlayer]);
  };

  const removePlayer = (id: string) => {
    onChange(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    onChange(players.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="mt-4 overflow-x-auto bg-white rounded-3xl shadow-inner p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">{t('order_form.team_list')}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('order_form.total_participants')}: {players.length}</p>
        </div>
      </div>
      
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="text-left rtl:text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <th className="px-3 py-4">{t('order.name')}</th>
            <th className="px-3 py-4 text-center">{t('order.number')}</th>
            <th className="px-3 py-4 text-center">{t('order.size')}</th>
            <th className="px-3 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {players.map((player) => (
            <tr key={player.id} className="hover:bg-indigo-50/30 transition-colors group">
              <td className="px-3 py-3">
                <input 
                  type="text" 
                  value={player.name}
                  onChange={(e) => updatePlayer(player.id, 'name', e.target.value)}
                  className="w-full border-b border-transparent focus:border-indigo-400 outline-none p-1 text-sm bg-transparent font-medium text-gray-800"
                  placeholder={t('order_form.name_placeholder')}
                />
              </td>
              <td className="px-3 py-3 text-center">
                <input 
                  type="text" 
                  value={player.number}
                  onChange={(e) => updatePlayer(player.id, 'number', e.target.value)}
                  className="w-12 border-b border-transparent focus:border-indigo-400 outline-none p-1 text-sm text-center bg-transparent font-black text-indigo-600"
                  placeholder={t('order_form.number_placeholder')}
                />
              </td>
              <td className="px-3 py-3 text-center">
                <select 
                   value={player.size}
                   onChange={(e) => updatePlayer(player.id, 'size', e.target.value)}
                   className="text-xs font-black outline-none bg-indigo-50/50 rounded-lg px-2 py-1 cursor-pointer hover:bg-indigo-100 transition-colors text-indigo-700"
                >
                  <optgroup label={t('order_form.kids')}>
                    {TEAM_SIZES_KIDS.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  <optgroup label={t('order_form.adults')}>
                    {TEAM_SIZES_ADULTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                </select>
              </td>
              <td className="px-3 py-3 text-right rtl:text-left">
                <button 
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-2"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {players.length === 0 && (
        <div className="py-12 text-center text-gray-300 text-[11px] font-bold uppercase tracking-widest italic bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 mt-4">
          {t('order_form.add_player_btn')}
        </div>
      )}

      <Button 
        onClick={addPlayer} 
        variant="outline" 
        size="sm" 
        className="mt-6 border-dashed w-full h-12 bg-white hover:bg-indigo-50 border-gray-200 text-gray-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-widest transition-all"
      >
        {t('order_form.add_player_btn')}
      </Button>
    </div>
  );
};


import React, { useState } from 'react';
import { CustomerData } from '../types';
import { Button } from './ui/Button';
import { useTranslation } from 'react-i18next';

interface CustomerInfoProps {
  onSubmit: (data: CustomerData) => void;
  onBack: () => void;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ onSubmit, onBack }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<CustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    comments: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});

  const validate = () => {
    const newErrors: any = {};
    if (!data.name) newErrors.name = t('customer.errors.name_required');
    if (!data.phone) newErrors.phone = t('customer.errors.phone_required');
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = t('customer.errors.email_invalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(data);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('customer.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">{t('customer.name_label')}</label>
          <input 
            type="text" 
            className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-indigo-400 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            value={data.name}
            onChange={e => setData({...data, name: e.target.value})}
            placeholder={t('customer.name_placeholder')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('customer.phone_label')}</label>
            <input 
              type="tel" 
              className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-indigo-400 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}
              value={data.phone}
              onChange={e => setData({...data, phone: e.target.value})}
              placeholder={t('customer.phone_placeholder')}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">{t('customer.email_label')}</label>
            <input 
              type="email" 
              className={`w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 ring-indigo-400 ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
              value={data.email}
              onChange={e => setData({...data, email: e.target.value})}
              placeholder={t('customer.email_placeholder')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">{t('customer.address_label')}</label>
          <input 
            type="text" 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none"
            value={data.address}
            onChange={e => setData({...data, address: e.target.value})}
            placeholder={t('customer.address_placeholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">{t('customer.comments_label')}</label>
          <textarea 
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none h-24"
            value={data.comments}
            onChange={e => setData({...data, comments: e.target.value})}
            placeholder={t('customer.comments_placeholder')}
          />
        </div>
        <div className="flex gap-4 pt-4">
          <Button onClick={onBack} variant="outline" fullWidth type="button">{t('customer.back_to_cart')}</Button>
          <Button variant="primary" fullWidth type="submit">{t('customer.confirm_order')}</Button>
        </div>
      </form>
    </div>
  );
};

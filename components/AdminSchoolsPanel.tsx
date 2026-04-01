import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { Button } from './ui/Button';
import { useTranslation } from 'react-i18next';
import { apiService } from '../services/apiService';

export const AdminSchoolsPanel: React.FC = () => {
  const { t } = useTranslation();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSchool, setEditingSchool] = useState<Partial<School> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = apiService.subscribeToSchools((schoolsData) => {
      setSchools(schoolsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchSchools = () => {
    // Real-time updates are handled by onSnapshot
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('admin.delete_confirm'))) return;
    try {
      await apiService.deleteSchool(id);
      // Local state is updated via subscription
    } catch (err) {
      console.error("Delete school error:", err);
      alert(t('admin.delete_error'));
    }
  };

  const handleSave = async () => {
    if (!editingSchool?.name) return alert(t('admin.enter_school_name'));
    
    setUploading(true);
    let finalLogoUrl = editingSchool.logo || '';

    try {
      if (fileToUpload) {
        // Convert file to base64 since we don't have Firebase Storage set up
        finalLogoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(fileToUpload);
        });
      } else if (!finalLogoUrl) {
         return alert(t('admin.upload_logo_error'));
      }

      const schoolData = {
        ...editingSchool,
        name: editingSchool.name,
        logo: finalLogoUrl
      };
      
      await apiService.saveSchool(schoolData);
      
      setEditingSchool(null);
      setFileToUpload(null);
    } catch (err) {
      console.error("Save school error:", err);
      alert(t('admin.save_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 mt-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">{t('admin.manage_schools')}</h2>
          <p className="text-gray-500 text-sm">{t('admin.schools_subtitle')}</p>
        </div>
        <Button onClick={() => setEditingSchool({ name: '' })} variant="primary">
          + {t('admin.add_school')}
        </Button>
      </div>

      {editingSchool !== null && (
        <div className="mb-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-inner">
          <h3 className="font-bold text-gray-800 mb-4">{editingSchool.id ? t('admin.edit_school') : t('admin.new_school')}</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('admin.school_name')}</label>
              <input 
                type="text" 
                value={editingSchool.name || ''} 
                onChange={e => setEditingSchool({...editingSchool, name: e.target.value})}
                className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 ring-indigo-500"
                placeholder={t('admin.school_name_placeholder')}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('admin.logo')}</label>
              <div className="flex items-center gap-4">
                {fileToUpload ? (
                  <span className="text-sm font-bold text-indigo-600 truncate">{fileToUpload.name}</span>
                ) : editingSchool.logo ? (
                  <img src={editingSchool.logo} alt="logo" className="h-12 w-12 object-contain bg-white rounded-lg p-1 border" />
                ) : null}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm w-full"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSave} disabled={uploading}>{uploading ? t('admin.saving') : t('common.next')}</Button>
              <Button onClick={() => { setEditingSchool(null); setFileToUpload(null); }} variant="outline">{t('common.back')}</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>{t('order_form.processing')}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {schools.map(school => (
            <div key={school.id} className="border border-gray-100 rounded-xl p-4 flex flex-col items-center bg-gray-50 relative group shadow-sm hover:shadow-md transition-all">
              <div className="h-20 w-20 bg-white rounded-lg p-2 mb-3 shadow-inner flex items-center justify-center">
                <img src={school.logo} alt={school.name} className="max-w-full max-h-full object-contain" />
              </div>
              <h4 className="text-xs font-bold text-center text-gray-800">{school.name}</h4>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded-lg shadow-sm">
                <button onClick={() => setEditingSchool(school)} className="p-1.5 text-blue-600 hover:text-blue-800" title={t('admin.edit_school')}>✏️</button>
                <button onClick={() => handleDelete(school.id)} className="p-1.5 text-red-600 hover:text-red-800" title={t('admin.delete_confirm')}>🗑️</button>
              </div>
            </div>
          ))}
          {schools.length === 0 && <p className="col-span-full py-8 text-center text-gray-500">{t('admin.no_schools')}</p>}
        </div>
      )}
    </div>
  );
};

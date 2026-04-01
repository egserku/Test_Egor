
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { useTranslation } from 'react-i18next';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Admin check is done via Security Rules, but we can also check email here for UI
        if (result.user.email === 'egserku@gmail.com') {
          sessionStorage.setItem('isAdminAuthenticated', 'true');
          onLoginSuccess();
        } else {
          setError(t('admin.not_authorized') || 'У вас нет прав администратора.');
          await auth.signOut();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(t('admin.unauthorized_domain') || 'Домен не авторизован в Firebase. Добавьте его в Authentication -> Settings -> Authorized domains.');
      } else {
        setError(`${t('admin.auth_error') || 'Ошибка авторизации.'} (${err.message || err.code || 'Unknown error'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-20 px-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
          <h2 className="text-2xl font-black text-gray-800">{t('admin.login_title')}</h2>
          <p className="text-gray-500 text-sm mt-2">{t('admin.login_subtitle')}</p>
        </div>

        <div className="space-y-6">
          <Button 
            variant="primary" 
            fullWidth 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? t('admin.checking') : (
              <div className="flex items-center justify-center gap-2">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                {t('admin.login_google') || 'Войти через Google'}
              </div>
            )}
          </Button>

          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

          <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest">
            PrintMaster Pro Security
          </p>
        </div>
      </div>
    </div>
  );
};

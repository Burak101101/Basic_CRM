'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, changePassword } from '@/services/authService';

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register: registerProfile, 
    handleSubmit: handleSubmitProfile, 
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }, 
    reset: resetProfile 
  } = useForm();
  
  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword 
  } = useForm();

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: any) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await updateProfile(data);
      setSuccessMessage('Profil bilgileriniz başarıyla güncellendi.');
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.detail || 'Profil güncellenirken bir sorun oluştu.');
    }
  };

  const onPasswordSubmit = async (data: any) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      if (data.new_password !== data.new_password_confirm) {
        setError('Yeni şifreler eşleşmiyor.');
        return;
      }
      
      await changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm
      });
      
      setSuccessMessage('Şifreniz başarıyla değiştirildi.');
      resetPassword();
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.response?.data?.detail || 'Şifre değiştirilirken bir sorun oluştu.');
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Profil Ayarları" 
        subtitle="Hesap bilgilerinizi görüntüleyin ve güncelleyin"
      />

      <div className="mt-6">
        <div className="bg-white border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            {[
              { name: 'Profil Bilgileri', value: 'profile' },
              { name: 'Şifre Değiştir', value: 'password' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`${
                  activeTab === tab.value
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {successMessage && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            <p>{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <Card className="mt-4">
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    Ad
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...registerProfile('first_name', { required: 'Ad zorunludur' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {profileErrors.first_name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.first_name.message as string}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Soyad
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...registerProfile('last_name', { required: 'Soyad zorunludur' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {profileErrors.last_name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.last_name.message as string}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  {...registerProfile('email', { required: 'E-posta zorunludur' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{profileErrors.email.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Kullanıcı Adı
                </label>
                <input
                  id="username"
                  type="text"
                  disabled
                  {...registerProfile('username')}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Kullanıcı adı değiştirilemez</p>
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isProfileSubmitting}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isProfileSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'password' && (
          <Card className="mt-4">
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
              <div>
                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">
                  Mevcut Şifre
                </label>
                <input
                  id="old_password"
                  type="password"
                  {...registerPassword('old_password', { required: 'Mevcut şifre zorunludur' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {passwordErrors.old_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.old_password.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre
                </label>
                <input
                  id="new_password"
                  type="password"
                  {...registerPassword('new_password', { 
                    required: 'Yeni şifre zorunludur',
                    minLength: {
                      value: 8,
                      message: 'Şifre en az 8 karakter olmalıdır'
                    }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {passwordErrors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  id="new_password_confirm"
                  type="password"
                  {...registerPassword('new_password_confirm', { 
                    required: 'Şifre doğrulama zorunludur',
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {passwordErrors.new_password_confirm && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password_confirm.message as string}</p>
                )}
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isPasswordSubmitting}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isPasswordSubmitting ? 'Kaydediliyor...' : 'Şifreyi Değiştir'}
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </AppWrapper>
  );
}

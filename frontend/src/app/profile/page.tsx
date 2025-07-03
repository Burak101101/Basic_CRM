'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { CompanyInfo } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { getCompanyInfo, updateCompanyInfo } from '@/services/authService';
import { updateProfile, changePassword } from '@/services/authService';
import { emailService, UserEmailSettings } from '@/services/emailService';
import { imapService } from '@/services/communicationService';
import { ImapSettings } from '@/types/communications';

export default function Profile() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: '',
    company_industry: '',
    company_position: '',
    company_size: '',
    company_website: '',
    company_linkedin_url: '',
    company_location: '',
    company_description: ''
  });

const [emailSettings, setEmailSettings] = useState<UserEmailSettings>({
    smtp_server: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    use_tls: true
  });

  const [imapSettings, setImapSettings] = useState<ImapSettings>({
    imap_server: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    use_ssl: true
  });

  const {
  register: registerCompany,
  handleSubmit: handleSubmitCompany,
  formState: { errors: companyErrors, isSubmitting: isCompanySubmitting },
  reset: resetCompany,
} = useForm<CompanyInfo>();
  
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

  const {
    register: registerEmailSettings,
    handleSubmit: handleSubmitEmailSettings,
    formState: { errors: emailSettingsErrors, isSubmitting: isEmailSettingsSubmitting },
    reset: resetEmailSettings
  } = useForm<UserEmailSettings>();
  
  const {
    register: registerImapSettings,
    handleSubmit: handleSubmitImapSettings,
    formState: { errors: imapSettingsErrors, isSubmitting: isImapSettingsSubmitting },
    reset: resetImapSettings
  } = useForm<ImapSettings>();

  // Kullanıcı giriş yapmamışsa yönlendir
  if (!loading && !user) {
    return (
      <AppWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Giriş Gerekli</h2>
            <p className="text-gray-600 mb-6">Bu sayfaya erişmek için giriş yapmanız gerekiyor.</p>
            <a
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Giriş Yap
            </a>
          </div>
        </div>
      </AppWrapper>
    );
  }

  // Loading durumu
  if (loading) {
    return (
      <AppWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </AppWrapper>
    );
  }
  

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
      });

      // E-posta ayarlarını yükle
      loadEmailSettings();
    }
  }, [user, resetProfile]);

  useEffect(() => {
    if (user) {
      loadImapSettings();
    }
  }, [user]);

  const loadEmailSettings = async () => {
    // Kullanıcı giriş yapmamışsa çalışma
    if (!user) {
      console.log('User not logged in, skipping email settings load');
      return;
    }

    try {
      console.log('Loading email settings for user:', user.email);
      const settings = await emailService.getUserEmailSettings();
      setEmailSettings(settings);
      resetEmailSettings(settings);
    } catch (err) {
      console.error('Email settings load error:', err);
      // Hata durumunda varsayılan değerleri kullan
      const defaultSettings = {
        smtp_server: '',
        smtp_port: 587,
        smtp_username: user?.email || '',
        smtp_password: '',
        use_tls: true
      };
      setEmailSettings(defaultSettings);
      resetEmailSettings(defaultSettings);
    }
  };

  const loadImapSettings = async () => {
    // Kullanıcı giriş yapmamışsa çalışma
    if (!user) {
      console.log('User not logged in, skipping IMAP settings load');
      return;
    }

    try {
      console.log('Loading IMAP settings for user:');
      const settings = await imapService.getUserImapSettings();
      setImapSettings(settings);
      resetImapSettings(settings);
      console.log('Loaded IMAP settings:', settings);
    } catch (err) {
      console.error('IMAP settings load error:', err);
      // Hata durumunda varsayılan değerleri kullan
      const defaultSettings = {
        imap_server: '',
        imap_port: 993,
        imap_username: user?.email || '',
        imap_password: '',
        use_ssl: true
      };
      setImapSettings(defaultSettings);
      resetImapSettings(defaultSettings);
    }
  };

  
  const loadCompanyInfo = async () => {
    if (!user) return;
    try {
      const data = await getCompanyInfo();
      setCompanyInfo(data);
      resetCompany(data);
    } catch (err) {
      console.error('Company info load error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadCompanyInfo();
    }
  }, [user]);

  const onCompanyInfoSubmit = async (data: CompanyInfo) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await updateCompanyInfo(data);
      setSuccessMessage('Şirket bilgileriniz başarıyla güncellendi.');
    } catch (err: any) {
      console.error('Company info update error:', err);
      setError(err.response?.data?.detail || 'Şirket bilgileri güncellenirken bir sorun oluştu.');
    }
  };

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

  const onImapSettingsSubmit = async (data: ImapSettings) => {
    if (!user) {
      setError('Lütfen önce giriş yapın.');
      return;
    }
  
    try {
      setError(null);
      setSuccessMessage(null);
      console.log('Updating IMAP settings:', data);
      await imapService.updateUserImapSettings(data);
      setImapSettings(data);
      setSuccessMessage('Gelen Kutusu ayarlarınız başarıyla güncellendi.');
    } catch (err: any) {
      console.error('IMAP settings update error:', err);
      setError(err.message || 'Gelen Kutusu ayarları güncellenirken bir sorun oluştu.');
    }
  };


  const onEmailSettingsSubmit = async (data: UserEmailSettings) => {
    if (!user) {
      setError('Lütfen önce giriş yapın.');
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      console.log('Updating email settings:', data);
      await emailService.updateUserEmailSettings(data);
      setEmailSettings(data);
      setSuccessMessage('E-posta ayarlarınız başarıyla güncellendi.');
    } catch (err: any) {
      console.error('Email settings update error:', err);
      setError(err.message || 'E-posta ayarları güncellenirken bir sorun oluştu.');
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
              { name: 'E-posta Ayarları', value: 'email' },
              { name: 'Şirket Bilgileri', value: 'company' },
              { name: 'Gelen Kutusu Ayarları', value: 'imap' },
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

        {activeTab === 'company' && (
          <Card className="mt-4">
            <form onSubmit={handleSubmitCompany(onCompanyInfoSubmit)} className="space-y-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                  Şirket Adı
                </label>
                <input
                  id="company_name"
                  type="text"
                  {...registerCompany('company_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_name && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_name.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="company_industry" className="block text-sm font-medium text-gray-700">
                  Sektör
                </label>
                <input
                  id="company_industry"
                  type="text"
                  {...registerCompany('company_industry')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_industry && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_industry.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_position" className="block text-sm font-medium text-gray-700">
                  Pozisyon
                </label>
                <input
                  id="company_position"
                  type="text"
                  {...registerCompany('company_position')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_position && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_position.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                  Şirket Büyüklüğü
                </label>
                <input
                  id="company_size"
                  type="text"
                  {...registerCompany('company_size')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_size && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_size.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_description" className="block text-sm font-medium text-gray-700">
                  Şirket Hakkında
                </label>
                <textarea
                  id="company_description"
                  {...registerCompany('company_description')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_description && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_description.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_website" className="block text-sm font-medium text-gray-700">
                  Web Sitesi
                </label>
                <input
                  id="company_website"
                  type="text"
                  {...registerCompany('company_website')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_website && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_website.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_linkedin_url" className="block text-sm font-medium text-gray-700">
                  LinkedIn URL
                </label>
                <input
                  id="company_linkedin_url"
                  type="text"
                  {...registerCompany('company_linkedin_url')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_linkedin_url && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_linkedin_url.message as string}</p>
                )}
              </div>

              <div>
                <label htmlFor="company_location" className="block text-sm font-medium text-gray-700">
                  Şirket Konumu
                </label>
                <input
                  id="company_location"
                  type="text"
                  {...registerCompany('company_location')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {companyErrors.company_location && (
                  <p className="mt-1 text-sm text-red-600">{companyErrors.company_location.message as string}</p>
                )}
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isCompanySubmitting}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isCompanySubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'email' && (
          <Card className="mt-4">
            <form onSubmit={handleSubmitEmailSettings(onEmailSettingsSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP E-posta Ayarları</h3>
                <p className="text-sm text-gray-600 mb-6">
                  E-posta gönderimi için SMTP sunucu ayarlarınızı yapılandırın. Gönderen bilgileri SMTP kullanıcı adınızdan otomatik alınacaktır.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Ayarları</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="smtp_server" className="block text-sm font-medium text-gray-700">
                      SMTP Sunucusu *
                    </label>
                    <input
                      id="smtp_server"
                      type="text"
                      {...registerEmailSettings('smtp_server', {
                        required: 'SMTP sunucusu zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="smtp.gmail.com"
                    />
                    {emailSettingsErrors.smtp_server && (
                      <p className="mt-1 text-sm text-red-600">{emailSettingsErrors.smtp_server.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700">
                      SMTP Port *
                    </label>
                    <input
                      id="smtp_port"
                      type="number"
                      {...registerEmailSettings('smtp_port', {
                        required: 'SMTP port zorunludur',
                        min: { value: 1, message: 'Port 1-65535 arasında olmalıdır' },
                        max: { value: 65535, message: 'Port 1-65535 arasında olmalıdır' }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="587"
                    />
                    {emailSettingsErrors.smtp_port && (
                      <p className="mt-1 text-sm text-red-600">{emailSettingsErrors.smtp_port.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="smtp_username" className="block text-sm font-medium text-gray-700">
                      SMTP Kullanıcı Adı *
                    </label>
                    <input
                      id="smtp_username"
                      type="text"
                      {...registerEmailSettings('smtp_username', {
                        required: 'SMTP kullanıcı adı zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="kullanici@gmail.com"
                    />
                    {emailSettingsErrors.smtp_username && (
                      <p className="mt-1 text-sm text-red-600">{emailSettingsErrors.smtp_username.message as string}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700">
                      SMTP Şifre *
                    </label>
                    <input
                      id="smtp_password"
                      type="password"
                      {...registerEmailSettings('smtp_password', {
                        required: 'SMTP şifre zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="E-posta şifreniz"
                    />
                    {emailSettingsErrors.smtp_password && (
                      <p className="mt-1 text-sm text-red-600">{emailSettingsErrors.smtp_password.message as string}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      <strong>Gmail için:</strong> Normal şifre değil, App Password kullanın (2FA gerekli)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      id="use_tls"
                      type="checkbox"
                      {...registerEmailSettings('use_tls')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="use_tls" className="ml-2 block text-sm text-gray-900">
                      TLS Kullan (Önerilen)
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Güvenli bağlantı için TLS kullanımı önerilir.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      SMTP Ayarları Hakkında
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Popüler e-posta sağlayıcıları için SMTP ayarları:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-2">
                        <li><strong>Gmail:</strong> smtp.gmail.com:587
                          <br /><span className="text-xs">⚠️ 2FA aktif olmalı, normal şifre değil App Password kullanın</span>
                        </li>
                        <li><strong>Outlook/Hotmail:</strong> smtp-mail.outlook.com:587
                          <br /><span className="text-xs">✅ Normal e-posta şifrenizi kullanabilirsiniz</span>
                        </li>
                        <li><strong>Yahoo:</strong> smtp.mail.yahoo.com:587
                          <br /><span className="text-xs">✅ Normal e-posta şifrenizi kullanabilirsiniz</span>
                        </li>
                        <li><strong>Yandex:</strong> smtp.yandex.com:587
                          <br /><span className="text-xs">✅ Normal e-posta şifrenizi kullanabilirsiniz</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isEmailSettingsSubmitting}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isEmailSettingsSubmitting ? 'Kaydediliyor...' : 'E-posta Ayarlarını Kaydet'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {activeTab === 'imap' && (
          <Card className="mt-4">
            <form onSubmit={handleSubmitImapSettings(onImapSettingsSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gelen Kutusu Ayarları</h3>
                <p className="text-sm text-gray-600 mb-6">
                  E-postalarınızı almak için Gelen Kutusu ayarlarınızı yapılandırın.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gelen Kutusu Ayarları</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="imap_server" className="block text-sm font-medium text-gray-700">
                      IMAP Sunucusu *
                    </label>
                    <input
                      id="imap_server"
                      type="text"
                      {...registerImapSettings('imap_server', {
                        required: 'IMAP sunucusu zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="imap.gmail.com"
                    />
                    {imapSettingsErrors.imap_server && (
                      <p className="mt-1 text-sm text-red-600">{imapSettingsErrors.imap_server.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="imap_port" className="block text-sm font-medium text-gray-700">
                      IMAP Port *
                    </label>
                    <input
                      id="imap_port"
                      type="number"
                      {...registerImapSettings('imap_port', {
                        required: 'IMAP port zorunludur',
                        min: { value: 1, message: 'Port 1-65535 arasında olmalıdır' },
                        max: { value: 65535, message: 'Port 1-65535 arasında olmalıdır' }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="993"
                    />
                    {imapSettingsErrors.imap_port && (
                      <p className="mt-1 text-sm text-red-600">{imapSettingsErrors.imap_port.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="imap_username" className="block text-sm font-medium text-gray-700">
                      IMAP Kullanıcı Adı *
                    </label>
                    <input
                      id="imap_username"
                      type="text"
                      {...registerImapSettings('imap_username', {
                        required: 'IMAP kullanıcı adı zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="kullanici@gmail.com"
                    />
                    {imapSettingsErrors.imap_username && (
                      <p className="mt-1 text-sm text-red-600">{imapSettingsErrors.imap_username.message as string}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="imap_password" className="block text-sm font-medium text-gray-700">
                      IMAP Şifre *
                    </label>
                    <input
                      id="imap_password"
                      type="password"
                      {...registerImapSettings('imap_password', {
                        required: 'IMAP şifre zorunludur'
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="E-posta şifreniz"
                    />
                    {imapSettingsErrors.imap_password && (
                      <p className="mt-1 text-sm text-red-600">{imapSettingsErrors.imap_password.message as string}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      <strong>Gmail için:</strong> Normal şifre değil, App Password kullanın (2FA gerekli)
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center">
                    <input
                      id="use_ssl"
                      type="checkbox"
                      {...registerImapSettings('use_ssl')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="use_ssl" className="ml-2 block text-sm text-gray-900">
                      SSL Kullan (Önerilen)
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Güvenli bağlantı için SSL kullanımı önerilir.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isImapSettingsSubmitting}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isImapSettingsSubmitting ? 'Kaydediliyor...' : 'Gelen Kutusu Ayarlarını Kaydet'}
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

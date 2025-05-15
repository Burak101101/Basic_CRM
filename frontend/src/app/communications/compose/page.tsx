'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { SendEmailRequest, EmailTemplate } from '@/types/communications';
import { getEmailTemplates, sendEmail, saveDraft } from '@/services/communicationService';
import { getContacts } from '@/services/contactService';
import { getCompanies } from '@/services/companyService';
import { Contact, CompanyList } from '@/types/customer';

export default function ComposeEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  const templateId = searchParams.get('template');
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SendEmailRequest>({
    defaultValues: {
      company_id: companyId ? parseInt(companyId) : undefined,
      contact_id: contactId ? parseInt(contactId) : undefined,
      template_id: templateId ? parseInt(templateId) : undefined,
      recipients: [{ name: '', email: '' }]
    }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipients, setRecipients] = useState<{name?: string; email: string}[]>([{ name: '', email: '' }]);
  const [ccRecipients, setCcRecipients] = useState<{name?: string; email: string}[]>([]);
  const [bccRecipients, setBccRecipients] = useState<{name?: string; email: string}[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  
  const selectedTemplateId = watch('template_id');
  const selectedCompanyId = watch('company_id');
  const selectedContactId = watch('contact_id');
  
  // Başlangıç verilerini yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [templatesData, contactsData, companiesData] = await Promise.all([
          getEmailTemplates(),
          getContacts(),
          getCompanies()
        ]);
        
        setTemplates(templatesData);
        setContacts(contactsData);
        setCompanies(companiesData);
        
        // Eğer URL'den iletişim kişisi ID'si geldiyse
        if (contactId) {
          const contact = contactsData.find(c => c.id === parseInt(contactId));
          if (contact && contact.email) {
            setRecipients([{ name: `${contact.first_name} ${contact.last_name}`, email: contact.email }]);
            setValue('recipients', [{ name: `${contact.first_name} ${contact.last_name}`, email: contact.email }]);
          }
        }
        
        // Eğer URL'den şablon ID'si geldiyse
        if (templateId) {
          const template = templatesData.find(t => t.id === parseInt(templateId));
          if (template) {
            setValue('subject', template.subject);
            setValue('content', template.content);
          }
        }
      } catch (err) {
        console.error('Veriler yüklenirken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [contactId, templateId, setValue]);
  
  // Şablon değiştiğinde içeriği güncelle
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setValue('subject', template.subject);
        setValue('content', template.content);
      }
    }
  }, [selectedTemplateId, templates, setValue]);
  
  // Kişi değiştiğinde alıcıyı güncelle
  useEffect(() => {
    if (selectedContactId) {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact && contact.email) {
        setRecipients([{ name: `${contact.first_name} ${contact.last_name}`, email: contact.email }]);
        setValue('recipients', [{ name: `${contact.first_name} ${contact.last_name}`, email: contact.email }]);
      }
    }
  }, [selectedContactId, contacts, setValue]);
  
  // Alıcı ekle/kaldır fonksiyonları
  const addRecipient = () => {
    const newRecipients = [...recipients, { name: '', email: '' }];
    setRecipients(newRecipients);
    setValue('recipients', newRecipients);
  };
  
  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      const newRecipients = recipients.filter((_, i) => i !== index);
      setRecipients(newRecipients);
      setValue('recipients', newRecipients);
    }
  };
  
  const updateRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
    setValue('recipients', newRecipients);
  };
  
  // CC alıcı ekle/kaldır fonksiyonları
  const addCcRecipient = () => {
    const newCcRecipients = [...ccRecipients, { name: '', email: '' }];
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };
  
  const removeCcRecipient = (index: number) => {
    const newCcRecipients = ccRecipients.filter((_, i) => i !== index);
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };
  
  const updateCcRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const newCcRecipients = [...ccRecipients];
    newCcRecipients[index][field] = value;
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };
  
  // BCC alıcı ekle/kaldır fonksiyonları
  const addBccRecipient = () => {
    const newBccRecipients = [...bccRecipients, { name: '', email: '' }];
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };
  
  const removeBccRecipient = (index: number) => {
    const newBccRecipients = bccRecipients.filter((_, i) => i !== index);
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };
  
  const updateBccRecipient = (index: number, field: 'name' | 'email', value: string) => {
    const newBccRecipients = [...bccRecipients];
    newBccRecipients[index][field] = value;
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };
  
  const onSubmit = async (data: SendEmailRequest) => {
    try {
      setError(null);
      
      // E-posta gönder
      await sendEmail(data);
      
      // İşlem tamamlandı, iletişim sayfasına yönlendir
      router.push('/communications');
    } catch (err) {
      console.error('E-posta gönderilirken hata:', err);
      setError('E-posta gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };
  
  const saveDraftEmail = async () => {
    try {
      setError(null);
      const formData = watch();
      
      // E-posta taslağını kaydet
      await saveDraft(formData);
      
      // İşlem tamamlandı, iletişim sayfasına yönlendir
      router.push('/communications?tab=drafts');
    } catch (err) {
      console.error('Taslak kaydedilirken hata:', err);
      setError('Taslak kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="E-posta Oluştur" 
        subtitle="Müşteri ve kişilere e-posta gönderin"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Şablon ve İlişki Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="template_id" className="block text-sm font-medium text-gray-700">
                  E-posta Şablonu
                </label>
                <select
                  id="template_id"
                  {...register('template_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Şablon Seçin --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                  İlişkili Firma
                </label>
                <select
                  id="company_id"
                  {...register('company_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Firma Seçin --</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                  İlişkili Kişi
                </label>
                <select
                  id="contact_id"
                  {...register('contact_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Kişi Seçin --</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alıcılar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alıcılar *
                </label>
                <button 
                  type="button"
                  onClick={addRecipient}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Alıcı Ekle
                </button>
              </div>
              
              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <div className="w-1/3">
                    <input
                      type="text"
                      value={recipient.name || ''}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Ad Soyad (opsiyonel)"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="E-posta adresi"
                      required
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeRecipient(index)}
                    disabled={recipients.length === 1}
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              <div className="flex items-center space-x-4 text-sm mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCc(!showCc)} 
                  className="text-gray-600 hover:text-indigo-600"
                >
                  {showCc ? 'CC Gizle' : 'CC Ekle'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowBcc(!showBcc)} 
                  className="text-gray-600 hover:text-indigo-600"
                >
                  {showBcc ? 'BCC Gizle' : 'BCC Ekle'}
                </button>
              </div>
            </div>
            
            {/* CC */}
            {showCc && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    CC
                  </label>
                  <button 
                    type="button"
                    onClick={addCcRecipient}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    CC Ekle
                  </button>
                </div>
                
                {ccRecipients.length === 0 ? (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-1/3">
                      <input
                        type="text"
                        onChange={(e) => {
                          const newCc = [{ name: e.target.value, email: '' }];
                          setCcRecipients(newCc);
                          setValue('cc', newCc);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ad Soyad (opsiyonel)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="email"
                        onChange={(e) => {
                          const newCc = [{ name: ccRecipients[0]?.name || '', email: e.target.value }];
                          setCcRecipients(newCc);
                          setValue('cc', newCc);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="E-posta adresi"
                      />
                    </div>
                    <div className="w-9"></div>
                  </div>
                ) : (
                  ccRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={recipient.name || ''}
                          onChange={(e) => updateCcRecipient(index, 'name', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ad Soyad (opsiyonel)"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="email"
                          value={recipient.email}
                          onChange={(e) => updateCcRecipient(index, 'email', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="E-posta adresi"
                          required
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeCcRecipient(index)}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* BCC */}
            {showBcc && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    BCC
                  </label>
                  <button 
                    type="button"
                    onClick={addBccRecipient}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    BCC Ekle
                  </button>
                </div>
                
                {bccRecipients.length === 0 ? (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-1/3">
                      <input
                        type="text"
                        onChange={(e) => {
                          const newBcc = [{ name: e.target.value, email: '' }];
                          setBccRecipients(newBcc);
                          setValue('bcc', newBcc);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Ad Soyad (opsiyonel)"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="email"
                        onChange={(e) => {
                          const newBcc = [{ name: bccRecipients[0]?.name || '', email: e.target.value }];
                          setBccRecipients(newBcc);
                          setValue('bcc', newBcc);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="E-posta adresi"
                      />
                    </div>
                    <div className="w-9"></div>
                  </div>
                ) : (
                  bccRecipients.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={recipient.name || ''}
                          onChange={(e) => updateBccRecipient(index, 'name', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Ad Soyad (opsiyonel)"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="email"
                          value={recipient.email}
                          onChange={(e) => updateBccRecipient(index, 'email', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="E-posta adresi"
                          required
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeBccRecipient(index)}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Konu */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Konu *
              </label>
              <input
                type="text"
                id="subject"
                {...register('subject', { required: 'Konu zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.subject ? 'border-red-300' : ''}`}
                placeholder="E-posta konusu"
              />
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
            </div>

            {/* İçerik */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                İçerik *
              </label>
              <textarea
                id="content"
                rows={10}
                {...register('content', { required: 'İçerik zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.content ? 'border-red-300' : ''}`}
                placeholder="E-posta içeriği"
              />
              {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-5 border-t">
              <button
                type="button"
                onClick={() => router.push('/communications')}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={saveDraftEmail}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Taslak Olarak Kaydet
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </form>
        )}
      </Card>
    </AppWrapper>
  );
}

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
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function NewEmail() {
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
        title="Yeni E-posta" 
        subtitle="E-posta oluşturun ve gönderin"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {/* Şablon seçimi */}
              <div>
                <label htmlFor="template_id" className="block text-sm font-medium text-gray-700">
                  E-posta Şablonu (İsteğe Bağlı)
                </label>
                <div className="mt-1">
                  <select
                    id="template_id"
                    {...register('template_id')}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Şablon Seçiniz</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* İlişkili firma ve kişi seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                    İlişkili Firma (İsteğe Bağlı)
                  </label>
                  <div className="mt-1">
                    <select
                      id="company_id"
                      {...register('company_id')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Firma Seçiniz</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">
                    İlişkili Kişi (İsteğe Bağlı)
                  </label>
                  <div className="mt-1">
                    <select
                      id="contact_id"
                      {...register('contact_id')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">Kişi Seçiniz</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name} ({contact.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Alıcılar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">
                    Alıcılar
                  </label>
                  <div className="flex space-x-2 text-sm">
                    {!showCc && (
                      <button type="button" onClick={() => setShowCc(true)} className="text-indigo-600 hover:text-indigo-900">
                        CC Ekle
                      </button>
                    )}
                    {!showBcc && (
                      <button type="button" onClick={() => setShowBcc(true)} className="text-indigo-600 hover:text-indigo-900">
                        BCC Ekle
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {recipients.map((recipient, index) => (
                    <div key={`recipient-${index}`} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Adı (İsteğe Bağlı)"
                        value={recipient.name || ''}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        className="appearance-none block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <input
                        type="email"
                        placeholder="E-posta Adresi"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        required
                        className="appearance-none block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className={`p-2 rounded-md ${recipients.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}
                        disabled={recipients.length === 1}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRecipient}
                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Alıcı Ekle
                  </button>
                </div>
              </div>

              {/* CC Alıcıları */}
              {showCc && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      CC
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCc(false);
                        setCcRecipients([]);
                        setValue('cc', []);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="space-y-2">
                    {ccRecipients.length > 0 ? (
                      ccRecipients.map((recipient, index) => (
                        <div key={`cc-recipient-${index}`} className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Adı (İsteğe Bağlı)"
                            value={recipient.name || ''}
                            onChange={(e) => updateCcRecipient(index, 'name', e.target.value)}
                            className="appearance-none block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <input
                            type="email"
                            placeholder="E-posta Adresi"
                            value={recipient.email}
                            onChange={(e) => updateCcRecipient(index, 'email', e.target.value)}
                            required
                            className="appearance-none block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeCcRecipient(index)}
                            className="p-2 rounded-md text-red-500 hover:bg-red-50"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Adı (İsteğe Bağlı)"
                          onChange={(e) => {
                            const newRecipients = [{ name: e.target.value, email: '' }];
                            setCcRecipients(newRecipients);
                          }}
                          className="appearance-none block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <input
                          type="email"
                          placeholder="E-posta Adresi"
                          onChange={(e) => {
                            const name = ccRecipients[0]?.name || '';
                            const newRecipients = [{ name, email: e.target.value }];
                            setCcRecipients(newRecipients);
                            setValue('cc', newRecipients);
                          }}
                          className="appearance-none block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}

                    {ccRecipients.length > 0 && (
                      <button
                        type="button"
                        onClick={addCcRecipient}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        CC Alıcı Ekle
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BCC Alıcıları */}
              {showBcc && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      BCC
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBcc(false);
                        setBccRecipients([]);
                        setValue('bcc', []);
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="space-y-2">
                    {bccRecipients.length > 0 ? (
                      bccRecipients.map((recipient, index) => (
                        <div key={`bcc-recipient-${index}`} className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Adı (İsteğe Bağlı)"
                            value={recipient.name || ''}
                            onChange={(e) => updateBccRecipient(index, 'name', e.target.value)}
                            className="appearance-none block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <input
                            type="email"
                            placeholder="E-posta Adresi"
                            value={recipient.email}
                            onChange={(e) => updateBccRecipient(index, 'email', e.target.value)}
                            required
                            className="appearance-none block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeBccRecipient(index)}
                            className="p-2 rounded-md text-red-500 hover:bg-red-50"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Adı (İsteğe Bağlı)"
                          onChange={(e) => {
                            const newRecipients = [{ name: e.target.value, email: '' }];
                            setBccRecipients(newRecipients);
                          }}
                          className="appearance-none block w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <input
                          type="email"
                          placeholder="E-posta Adresi"
                          onChange={(e) => {
                            const name = bccRecipients[0]?.name || '';
                            const newRecipients = [{ name, email: e.target.value }];
                            setBccRecipients(newRecipients);
                            setValue('bcc', newRecipients);
                          }}
                          className="appearance-none block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    )}

                    {bccRecipients.length > 0 && (
                      <button
                        type="button"
                        onClick={addBccRecipient}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        BCC Alıcı Ekle
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Konu */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Konu
                </label>
                <div className="mt-1">
                  <input
                    id="subject"
                    type="text"
                    {...register('subject', { required: "Konu alanı zorunludur" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="E-posta konusu"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>
              </div>

              {/* İçerik */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  İçerik
                </label>
                <div className="mt-1">
                  <textarea
                    id="content"
                    rows={12}
                    {...register('content', { required: "İçerik alanı zorunludur" })}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="E-posta içeriği"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={saveDraftEmail}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Taslak Olarak Kaydet
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </AppWrapper>
  );
}

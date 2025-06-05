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
import { PlusIcon, XMarkIcon, PaperClipIcon, FaceSmileIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function NewEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  const templateId = searchParams.get('template');
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');
  
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [priority, setPriority] = useState<'normal' | 'high' | 'low'>('normal');
  
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

        // Eğer URL'den direkt email ve name parametreleri geldiyse
        if (emailParam && nameParam) {
          setRecipients([{ name: decodeURIComponent(nameParam), email: emailParam }]);
          setValue('recipients', [{ name: decodeURIComponent(nameParam), email: emailParam }]);
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
  }, [contactId, templateId, emailParam, nameParam, setValue]);
  
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

  // Attachment handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files);
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

              {/* Konu ve Öncelik */}
              <div className="flex space-x-4">
                <div className="flex-1">
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
                <div className="w-32">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Öncelik
                  </label>
                  <div className="mt-1">
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'normal' | 'high' | 'low')}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="low">Düşük</option>
                      <option value="normal">Normal</option>
                      <option value="high">Yüksek</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* İçerik - Zengin Editör */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta İçeriği
                </label>

                {/* Formatting Toolbar */}
                <div className="border border-gray-300 rounded-t-md bg-gray-50 px-3 py-2 flex items-center space-x-1 text-sm">
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded font-bold text-gray-700" title="Kalın">
                    <strong>B</strong>
                  </button>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded italic text-gray-700" title="İtalik">
                    <em>I</em>
                  </button>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded underline text-gray-700" title="Altı Çizili">
                    U
                  </button>
                  <div className="border-l border-gray-300 h-6 mx-2"></div>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded text-gray-700" title="Liste">
                    • List
                  </button>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded text-gray-700" title="Numaralı Liste">
                    1. List
                  </button>
                  <div className="border-l border-gray-300 h-6 mx-2"></div>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded text-gray-700" title="Link">
                    🔗
                  </button>
                  <button type="button" className="px-3 py-1 hover:bg-gray-200 rounded text-gray-700" title="Emoji">
                    😊
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    id="content"
                    rows={14}
                    {...register('content', { required: "İçerik alanı zorunludur" })}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-b-md border-t-0 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-none"
                    placeholder="E-posta içeriğinizi buraya yazın...

Merhaba [İsim],

İyi günler dilerim.

Saygılarımla,
[Adınız]"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ekler
                  </label>
                  <label className="cursor-pointer inline-flex items-center px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    Dosya Ekle
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Gmail benzeri alt toolbar */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>

                  <button
                    type="button"
                    onClick={saveDraftEmail}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Taslak Olarak Kaydet
                  </button>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    İptal
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {priority !== 'normal' && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {priority === 'high' ? 'Yüksek Öncelik' : 'Düşük Öncelik'}
                    </span>
                  )}
                  {attachments.length > 0 && (
                    <span className="flex items-center">
                      <PaperClipIcon className="h-4 w-4 mr-1" />
                      {attachments.length} ek
                    </span>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </Card>
    </AppWrapper>
  );
}

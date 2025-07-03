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
import { getOpportunities } from '@/services/opportunityService';
import { Contact, CompanyList } from '@/types/customer';
import { OpportunityList } from '@/types/opportunities';
import { EmailEditor } from '@/components/common/TinyMCEEditor';
import { PlusIcon, XMarkIcon, PaperClipIcon, FaceSmileIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import AIButton from '@/components/ai/AIButton';
import AIResponseModal from '@/components/ai/AIResponseModal';
import { aiService } from '@/services/aiService';


export default function ComposeEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  const templateId = searchParams.get('template');
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SendEmailRequest>({
    defaultValues: {
      company_id: companyId ? parseInt(companyId) : undefined,
      template_id: templateId ? parseInt(templateId) : undefined,
      recipients: [{ email: '' }]
    }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipients, setRecipients] = useState<{email: string}[]>([{ email: '' }]);
  const [ccRecipients, setCcRecipients] = useState<{email: string}[]>([]);
  const [bccRecipients, setBccRecipients] = useState<{email: string}[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState('');


  const selectedTemplateId = watch('template_id');
  const selectedCompanyId = watch('company_id');

  // Seçili firmaya ait e-posta adreslerini getir
  const getCompanyEmails = () => {
    const emails: { label: string; email: string }[] = [];

    if (selectedCompanyId) {
      const company = companies.find(c => c.id === parseInt(selectedCompanyId.toString()));

      // Firma e-postası varsa ekle
      if (company?.email) {
        emails.push({
          label: `${company.name} (Firma)`,
          email: company.email
        });
      }

      // Firmaya ait kişilerin e-postalarını ekle
      const companyContacts = contacts.filter(contact =>
        contact.company === parseInt(selectedCompanyId.toString()) && contact.email
      );

      companyContacts.forEach(contact => {
        emails.push({
          label: `${contact.first_name} ${contact.last_name}`,
          email: contact.email!
        });
      });
    }

    return emails;
  };
  
  // Başlangıç verilerini yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [templatesData, contactsData, companiesData, opportunitiesData] = await Promise.all([
          getEmailTemplates(),
          getContacts(),
          getCompanies(),
          getOpportunities()
        ]);

        setTemplates(templatesData);
        setContacts(contactsData);
        setCompanies(companiesData);
        setOpportunities(opportunitiesData);
        
        // Eğer URL'den iletişim kişisi ID'si geldiyse
        if (contactId) {
          const contact = contactsData.find(c => c.id === parseInt(contactId));
          if (contact && contact.email) {
            setRecipients([{ email: contact.email }]);
            setValue('recipients', [{ email: contact.email }]);
          }
        }
        
        // Eğer URL'den şablon ID'si geldiyse
        if (templateId) {
          const template = templatesData.find(t => t.id === parseInt(templateId));
          if (template) {
            setValue('subject', template.subject);
            setContent(template.content);
            setValue('template_id', template.id); // Form'da da seçili göster
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
      const templateId = parseInt(selectedTemplateId.toString());
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setValue('subject', template.subject);
        setContent(template.content);
      }
    } else {
      // Şablon seçimi temizlendiğinde içeriği de temizle
      setValue('subject', '');
      setContent('');
    }
  }, [selectedTemplateId, templates, setValue]);

  // Handle AI reply content from sessionStorage
  useEffect(() => {
    const aiReplyContent = sessionStorage.getItem('aiReplyContent');
    const aiReplySubject = sessionStorage.getItem('aiReplySubject');
    const aiReplyTo = sessionStorage.getItem('aiReplyTo');

    if (aiReplyContent) {
      setContent(aiReplyContent);
      sessionStorage.removeItem('aiReplyContent');
    }

    if (aiReplySubject) {
      setValue('subject', aiReplySubject);
      sessionStorage.removeItem('aiReplySubject');
    }

    if (aiReplyTo) {
      setRecipients([{ email: aiReplyTo }]);
      sessionStorage.removeItem('aiReplyTo');
    }
  }, [setValue]);

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


  
  // Alıcı ekle/kaldır fonksiyonları
  const addRecipient = () => {
    const newRecipients = [...recipients, { email: '' }];
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

  const updateRecipient = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index].email = value;
    setRecipients(newRecipients);
    setValue('recipients', newRecipients);
  };
  
  // CC alıcı ekle/kaldır fonksiyonları
  const addCcRecipient = () => {
    const newCcRecipients = [...ccRecipients, { email: '' }];
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };

  const removeCcRecipient = (index: number) => {
    const newCcRecipients = ccRecipients.filter((_, i) => i !== index);
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };

  const updateCcRecipient = (index: number, value: string) => {
    const newCcRecipients = [...ccRecipients];
    newCcRecipients[index].email = value;
    setCcRecipients(newCcRecipients);
    setValue('cc', newCcRecipients);
  };

  // BCC alıcı ekle/kaldır fonksiyonları
  const addBccRecipient = () => {
    const newBccRecipients = [...bccRecipients, { email: '' }];
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };

  const removeBccRecipient = (index: number) => {
    const newBccRecipients = bccRecipients.filter((_, i) => i !== index);
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };

  const updateBccRecipient = (index: number, value: string) => {
    const newBccRecipients = [...bccRecipients];
    newBccRecipients[index].email = value;
    setBccRecipients(newBccRecipients);
    setValue('bcc', newBccRecipients);
  };
  
  const onSubmit = async (data: SendEmailRequest) => {
    try {
      setError(null);

      // İçeriği ekle
      const emailData = {
        ...data,
        content: content,
        recipients: recipients.filter(r => r.email),
        cc: showCc ? ccRecipients.filter(r => r.email) : undefined,
        bcc: showBcc ? bccRecipients.filter(r => r.email) : undefined
      };

      // E-posta gönder
      await sendEmail(emailData);

      // İşlem tamamlandı, iletişim sayfasına yönlendir
      router.push('/communications');
    } catch (err) {
      console.error('E-posta gönderilirken hata:', err);
      setError('E-posta gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };
  
  // AI handler functions
  const handleAIGenerate = async () => {
    try {
      setAiLoading(true);
      setError(null);

      const formData = watch();
      const aiRequest = {
        subject: formData.subject || '',
        company_id: formData.company_id ? parseInt(formData.company_id.toString()) : undefined,
        contact_id: formData.contact_id ? parseInt(formData.contact_id.toString()) : undefined,
        opportunity_id: formData.opportunity_id ? parseInt(formData.opportunity_id.toString()) : undefined,
        additional_context: ''
      };

      const generatedContent = await aiService.generateEmailContent(aiRequest);
      setAiGeneratedContent(generatedContent);
      setAiModalOpen(true);
    } catch (err: any) {
      console.error('AI içerik oluşturma hatası:', err);
      setError(err.message || 'AI içerik oluşturulurken bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIApprove = (approvedContent: string) => {
    setContent(approvedContent);
    setAiModalOpen(false);
    setAiGeneratedContent('');
  };

  const handleAIReject = () => {
    setAiModalOpen(false);
    setAiGeneratedContent('');
  };

  const saveDraftEmail = async () => {
    try {
      setError(null);
      const formData = watch();

      // İçeriği ekle
      const draftData = {
        ...formData,
        content: content,
        recipients: recipients.filter(r => r.email),
        cc: showCc ? ccRecipients.filter(r => r.email) : undefined,
        bcc: showBcc ? bccRecipients.filter(r => r.email) : undefined
      };

      // E-posta taslağını kaydet
      await saveDraft(draftData);

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
            {/* Şablon Seçimi */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">E-posta Şablonu Seçimi</h3>
              <div>
                <label htmlFor="template_id" className="block text-sm font-medium text-gray-700">
                  Şablon
                </label>
                <select
                  id="template_id"
                  {...register('template_id')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Şablon Seçin (Opsiyonel) --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Şablon seçtiğinizde konu ve içerik otomatik olarak doldurulacaktır.
                </p>
              </div>
            </div>

            {/* Firma Seçimi */}
            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
                İlişkili Firma *
              </label>
              <select
                id="company_id"
                {...register('company_id', { required: 'Firma seçimi zorunludur' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Firma Seçin --</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company_id && <p className="mt-1 text-sm text-red-600">{errors.company_id.message}</p>}
            </div>

            {/* Fırsat Seçimi */}
            <div>
              <label htmlFor="opportunity_id" className="block text-sm font-medium text-gray-700">
                İlişkili Fırsat
              </label>
              <select
                id="opportunity_id"
                {...register('opportunity_id')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Fırsat Seçin (Opsiyonel) --</option>
                {opportunities
                  .filter(opp => !selectedCompanyId || opp.company === parseInt(selectedCompanyId.toString()))
                  .map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title} - {opportunity.company_name} ({opportunity.value.toLocaleString('tr-TR')} TL)
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Bu e-posta belirli bir satış fırsatı ile ilişkilendirilecektir.
              </p>
            </div>

            {/* Alıcılar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alıcılar *
                </label>
                <div className="flex space-x-2">
                  {/* Hızlı E-posta Seçimi */}
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const newRecipient = { email: e.target.value };
                        setRecipients(prev => [...prev, newRecipient]);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    className="text-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    disabled={!selectedCompanyId}
                  >
                    <option value="">
                      {selectedCompanyId ? 'Hızlı E-posta Seç' : 'Önce firma seçin'}
                    </option>
                    {getCompanyEmails().map((emailOption, index) => (
                      <option key={index} value={emailOption.email}>
                        {emailOption.label} ({emailOption.email})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Alıcı Ekle
                  </button>
                </div>
              </div>

              {recipients.map((recipient, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, e.target.value)}
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
                    <div className="flex-1">
                      <input
                        type="email"
                        onChange={(e) => {
                          const newCc = [{ email: e.target.value }];
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
                      <div className="flex-1">
                        <input
                          type="email"
                          value={recipient.email}
                          onChange={(e) => updateCcRecipient(index, e.target.value)}
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
                    <div className="flex-1">
                      <input
                        type="email"
                        onChange={(e) => {
                          const newBcc = [{ email: e.target.value }];
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
                      <div className="flex-1">
                        <input
                          type="email"
                          value={recipient.email}
                          onChange={(e) => updateBccRecipient(index, e.target.value)}
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
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  İçerik *
                </label>
                <AIButton
                  onClick={handleAIGenerate}
                  loading={aiLoading}
                  size="sm"
                  variant="outline"
                >
                  AI ile Oluştur
                </AIButton>
              </div>
              <div className="mt-1">
                <EmailEditor
                  value={content}
                  onChange={setContent}
                  placeholder="E-posta içeriği yazın..."
                  height={400}
                />
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

      {/* AI Response Modal */}
      <AIResponseModal
        isOpen={aiModalOpen}
        onClose={handleAIReject}
        title="AI Tarafından Oluşturulan E-posta İçeriği"
        content={aiGeneratedContent}
        onApprove={handleAIApprove}
        onReject={handleAIReject}
        type="email"
      />
    </AppWrapper>
  );
}

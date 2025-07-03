'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import FileUpload from '@/components/common/FileUpload';
import { EventCreate, EVENT_TYPE_CHOICES, EVENT_PRIORITY_CHOICES } from '@/types/events';
import { createEvent } from '@/services/eventService';
import { getCompanies } from '@/services/companyService';
import { getContacts } from '@/services/contactService';
import { CompanyList, Contact } from '@/types/customer';
import { useAuth } from '@/contexts/AuthContext';  // Add this import at the top with other imports

interface EventFormData {
  title: string;
  description?: string;
  event_type: string;
  priority: string;
  company?: number;
  contacts?: number[];
  start_datetime: string;
  end_datetime?: string;
  reminder_datetime?: string;
  location?: string;
  meeting_url?: string;
  agenda?: string;
  notes?: string;
}

export default function NewEvent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();  // Add this line to get the current user
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<EventFormData>({
    defaultValues: {
      event_type: 'meeting',
      priority: 'medium',
      company: companyId ? parseInt(companyId) : undefined,
      contacts: contactId ? [parseInt(contactId)] : [],
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  // Watch for event type and company changes
  const watchedEventType = watch('event_type');
  const watchedCompany = watch('company');

  // Firma ve kişileri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, contactsData] = await Promise.all([
          getCompanies(),
          getContacts()
        ]);
        setCompanies(companiesData);
        setContacts(contactsData);
        setFilteredContacts(contactsData);
      } catch (err) {
        console.error('Veriler yüklenirken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Filter contacts based on selected company
  useEffect(() => {
    if (watchedCompany) {
      const companyContacts = contacts.filter(contact => contact.company === parseInt(watchedCompany.toString()));
      setFilteredContacts(companyContacts);
    } else {
      setFilteredContacts(contacts);
    }
  }, [watchedCompany, contacts]);

  // Helper functions for dynamic field visibility
  const shouldShowField = (fieldName: string): boolean => {
    switch (fieldName) {
      case 'location':
        return ['meeting', 'visit', 'presentation', 'demo'].includes(watchedEventType);
      case 'meeting_url':
        return ['meeting', 'presentation', 'demo'].includes(watchedEventType);
      case 'participants':
        return ['meeting', 'presentation', 'demo', 'call'].includes(watchedEventType);
      case 'agenda':
        return watchedEventType === 'meeting';
      default:
        return true;
    }
  };

  const getFieldValidation = (fieldName: string) => {
    const baseValidation: any = {};

    switch (fieldName) {
      case 'location':
        if (['meeting', 'visit'].includes(watchedEventType)) {
          baseValidation.required = 'Lokasyon zorunludur';
        }
        break;
      case 'meeting_url':
        if (watchedEventType === 'meeting') {
          baseValidation.pattern = {
            value: /^https?:\/\/.+/,
            message: 'Geçerli bir URL giriniz'
          };
        }
        break;
      case 'company':
        if (['meeting', 'visit', 'presentation'].includes(watchedEventType)) {
          baseValidation.required = 'Firma seçimi zorunludur';
        }
        break;
    }

    return baseValidation;
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) {
      setError('Kullanıcı oturumu bulunamadı.');
      return;
    }

    if (!data.start_datetime) {
      setError('Başlangıç tarihi zorunludur.');
      return;
    }

    // Dynamic validation based on event type
    if (['meeting', 'visit', 'presentation'].includes(data.event_type) && !data.company) {
      setError('Bu etkinlik türü için firma seçimi zorunludur.');
      return;
    }

    if (['meeting', 'visit'].includes(data.event_type) && !data.location) {
      setError('Bu etkinlik türü için lokasyon zorunludur.');
      return;
    }

    try {
      setError(null);

      // Dosya yükleme işlemi burada yapılacak (şimdilik sadece dosya isimlerini saklıyoruz)
      const attachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      // Prepare notes with agenda if it's a meeting
      let finalNotes = data.notes || '';
      if (data.event_type === 'meeting' && data.agenda) {
        finalNotes = finalNotes ? `${finalNotes}\n\nGündem:\n${data.agenda}` : `Gündem:\n${data.agenda}`;
      }

      const eventData: EventCreate = {
        title: data.title,
        description: data.description,
        event_type: data.event_type as any,
        priority: data.priority as any,
        company: data.company || null,
        contacts: data.contacts || [],
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        reminder_datetime: data.reminder_datetime,
        location: data.location,
        meeting_url: data.meeting_url,
        notes: finalNotes,
        attachments: attachments,
        assigned_to: user.id  // Automatically assign to current user
      };

      const createdEvent = await createEvent(eventData);
      
      // Bildirimi göster
      alert(`Etkinlik başarıyla oluşturuldu! ${data.contacts && data.contacts.length > 0 ? 'Seçilen katılımcılara bilgilendirme e-postası gönderildi.' : ''}`);
      
      // Etkinlik oluşturulduktan sonra ilgili sayfaya yönlendirme yap
      if (companyId) {
        router.push(`/companies/${companyId}`);
      } else if (contactId) {
        router.push(`/contacts/${contactId}`);
      } else {
        router.push('/events');
      }
    } catch (err) {
      console.error('Etkinlik oluşturulurken hata:', err);
      setError('Etkinlik oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (isLoadingData) {
    return (
      <AppWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded w-full mb-2"></div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title="Yeni Etkinlik Ekle" 
        subtitle={companyId ? "Firmaya etkinlik ekleyin" : contactId ? "Kişiye etkinlik ekleyin" : "Etkinlik ekleyin"}
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Başlık */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Başlık *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Başlık zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.title ? 'border-red-300' : ''}`}
              placeholder="Etkinlik başlığı"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Açıklama */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Açıklama
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Etkinlik açıklaması..."
            />
          </div>

          {/* Etkinlik Tipi ve Öncelik */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
                Etkinlik Tipi *
              </label>
              <select
                id="event_type"
                {...register('event_type', { required: 'Etkinlik tipi zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.event_type ? 'border-red-300' : ''}`}
              >
                {EVENT_TYPE_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
              {errors.event_type && <p className="mt-1 text-sm text-red-600">{errors.event_type.message}</p>}

              {/* Event Type Info */}
              {watchedEventType && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    {watchedEventType === 'meeting' && 'Toplantı için firma, lokasyon veya toplantı linki gereklidir. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'visit' && 'Ziyaret için firma ve lokasyon zorunludur. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'call' && 'Telefon görüşmesi için katılımcı seçimi önerilir. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'presentation' && 'Sunum için firma ve katılımcı seçimi önerilir. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'demo' && 'Demo için katılımcı seçimi ve toplantı linki önerilir. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'email' && 'E-posta iletişimi için özel alan gereksinimleri yoktur. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'follow_up' && 'Takip için özel alan gereksinimleri yoktur. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                    {watchedEventType === 'other' && 'Diğer etkinlik türleri için gereksinimler değişkendir. Seçilen katılımcılara bilgilendirme maili gönderilecektir.'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Öncelik
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {EVENT_PRIORITY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Firma ve Kişiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Firma {['meeting', 'visit', 'presentation'].includes(watchedEventType) && '*'}
              </label>
              <select
                id="company"
                {...register('company', getFieldValidation('company'))}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.company ? 'border-red-300' : ''}`}
              >
                <option value="">Firma seçin...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
            </div>

            {shouldShowField('participants') && (
              <div>
                <label htmlFor="contacts" className="block text-sm font-medium text-gray-700">
                  Katılımcılar
                </label>
                <select
                  id="contacts"
                  {...register('contacts')}
                  multiple
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  size={4}
                  disabled={!watchedCompany && filteredContacts.length === 0}
                >
                  {filteredContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} {contact.company_name && `(${contact.company_name})`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {watchedCompany ?
                    'Ctrl/Cmd tuşu ile birden fazla seçim yapabilirsiniz. Seçilen tüm katılımcılara mail gönderilecektir.' :
                    'Önce bir firma seçin'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Tarih ve Saat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700">
                Başlangıç Tarihi ve Saati *
              </label>
              <input
                type="datetime-local"
                id="start_datetime"
                {...register('start_datetime', { required: 'Başlangıç tarihi zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.start_datetime ? 'border-red-300' : ''}`}
              />
              {errors.start_datetime && <p className="mt-1 text-sm text-red-600">{errors.start_datetime.message}</p>}
            </div>

            <div>
              <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700">
                Bitiş Tarihi ve Saati
              </label>
              <input
                type="datetime-local"
                id="end_datetime"
                {...register('end_datetime')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="reminder_datetime" className="block text-sm font-medium text-gray-700">
                Hatırlatma Tarihi
              </label>
              <input
                type="datetime-local"
                id="reminder_datetime"
                {...register('reminder_datetime')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-blue-600">
                Hatırlatma tarihi belirtmezseniz, etkinlik başlangıcından 1 saat önce hatırlatma yapılacaktır.
              </p>
            </div>
          </div>

          {/* Lokasyon ve Meeting URL - Conditional Fields */}
          {(shouldShowField('location') || shouldShowField('meeting_url')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shouldShowField('location') && (
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Lokasyon {['meeting', 'visit'].includes(watchedEventType) && '*'}
                  </label>
                  <input
                    type="text"
                    id="location"
                    {...register('location', getFieldValidation('location'))}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.location ? 'border-red-300' : ''}`}
                    placeholder={watchedEventType === 'visit' ? 'Ziyaret adresi...' : 'Toplantı yeri...'}
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
                </div>
              )}

              {shouldShowField('meeting_url') && (
                <div>
                  <label htmlFor="meeting_url" className="block text-sm font-medium text-gray-700">
                    {watchedEventType === 'meeting' ? 'Toplantı Linki' : 'Bağlantı'}
                  </label>
                  <input
                    type="url"
                    id="meeting_url"
                    {...register('meeting_url', getFieldValidation('meeting_url'))}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.meeting_url ? 'border-red-300' : ''}`}
                    placeholder="https://..."
                  />
                  {errors.meeting_url && <p className="mt-1 text-sm text-red-600">{errors.meeting_url.message}</p>}
                </div>
              )}
            </div>
          )}

          {/* Meeting Agenda - Only for meetings */}
          {shouldShowField('agenda') && (
            <div>
              <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">
                Toplantı Gündemi
              </label>
              <textarea
                id="agenda"
                rows={3}
                {...register('agenda')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Toplantı gündem maddeleri..."
              />
            </div>
          )}

          {/* Notlar */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notlar
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ek notlar..."
            />
          </div>

          {/* Dosya Ekleri */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosya Ekleri
            </label>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
              maxFileSize={10}
            />
          </div>

          {/* Gizli form alanları */}
          {companyId && (
            <input type="hidden" {...register('company')} value={companyId} />
          )}

          <div className="flex justify-end space-x-3 pt-5 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Card>
    </AppWrapper>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { OpportunityCreate } from '@/types/opportunities';
import { getCompanies } from '@/services/companyService';
import { getCompanyContacts } from '@/services/companyService';
import { getOpportunityStatuses, createOpportunity } from '@/services/opportunityService';
import { CompanyList, ContactNested } from '@/types/customer';
import { OpportunityStatus } from '@/types/opportunities';

export default function NewOpportunity() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<OpportunityCreate>({
    defaultValues: {
      priority: 'medium',
      contacts: contactId ? [parseInt(contactId)] : []
    }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
  const [contacts, setContacts] = useState<ContactNested[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const selectedCompanyId = watch('company');

  // Firma ve durum verilerini yükle
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [companiesData, statusesData] = await Promise.all([
          getCompanies(),
          getOpportunityStatuses()
        ]);
        
        setCompanies(companiesData);
        setStatuses(statusesData);

        // URL'den gelen company ID'sini ayarla
        if (companyId) {
          const companyIdNumber = parseInt(companyId);
          setValue('company', companyIdNumber);
          
          // Seçilen firmanın kişilerini yükle
          const contactsData = await getCompanyContacts(companyIdNumber);
          setContacts(contactsData || []);
        }

        // Varsayılan durumu ayarla - genelde ilk durum (Yeni Fırsat)
        if (statusesData.length > 0) {
          const defaultStatus = statusesData.find(s => s.is_default) || statusesData[0];
          setValue('status', defaultStatus.id);
        }
      } catch (err) {
        console.error('Veriler yüklenirken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [setValue, companyId]);

  // Firma değiştiğinde kişileri güncelle
  useEffect(() => {
    const fetchContacts = async () => {
      if (selectedCompanyId) {
        try {
          const contactsData = await getCompanyContacts(selectedCompanyId);
          setContacts(contactsData || []);
          
          // Firma değiştiğinde seçili kişileri temizle (contactId harici)
          if (contactId) {
            setValue('contacts', [parseInt(contactId)]);
          } else {
            setValue('contacts', []);
          }
        } catch (err) {
          console.error('Kişiler yüklenirken hata:', err);
        }
      }
    };

    fetchContacts();
  }, [selectedCompanyId, setValue, contactId]);

  // Handle AI-generated proposals from sessionStorage
  useEffect(() => {
    const aiProposals = sessionStorage.getItem('aiOpportunityProposals');
    if (aiProposals) {
      try {
        const proposals = JSON.parse(aiProposals);
        if (proposals && proposals.length > 0) {
          // Use the first proposal to pre-fill the form
          const firstProposal = proposals[0];
          setValue('title', firstProposal.title);
          setValue('description', firstProposal.description);
          setValue('value', firstProposal.estimated_value);
          setValue('priority', firstProposal.priority);
        }
        sessionStorage.removeItem('aiOpportunityProposals');
      } catch (err) {
        console.error('AI önerilerini parse ederken hata:', err);
      }
    }
  }, [setValue]);

  const onSubmit = async (data: OpportunityCreate) => {
    try {
      setError(null);
      const newOpportunity = await createOpportunity(data);
      router.push(`/opportunities/${newOpportunity.id}`);
    } catch (err) {
      console.error('Fırsat oluşturulurken hata:', err);
      setError('Fırsat oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Yeni Satış Fırsatı" 
        subtitle="Yeni bir satış fırsatı ekleyin"
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
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Fırsat Başlığı *
              </label>
              <input
                type="text"
                id="title"
                {...register('title', { required: 'Fırsat başlığı zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.title ? 'border-red-300' : ''}`}
                placeholder="Örn: CRM Yazılım Satışı"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Firma *
              </label>
              <select
                id="company"
                {...register('company', { required: 'Firma seçimi zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.company ? 'border-red-300' : ''}`}
              >
                <option value="">-- Firma Seçin --</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
            </div>

            <div>
              <label htmlFor="contacts" className="block text-sm font-medium text-gray-700">
                İlgili Kişiler
              </label>
              <select
                id="contacts"
                multiple
                {...register('contacts')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={!selectedCompanyId}
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                    {contact.position ? ` - ${contact.position}` : ''}
                  </option>
                ))}
              </select>
              {!selectedCompanyId && (
                <p className="mt-1 text-sm text-gray-500">Kişi seçmek için önce firma seçin</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Fırsat hakkında detaylı bilgiler..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Değer (₺) *
                </label>
                <input
                  type="number"
                  id="value"
                  min={0}
                  step={1}
                  {...register('value', { 
                    required: 'Değer zorunludur',
                    min: { value: 0, message: 'Değer 0 veya daha büyük olmalıdır' }
                  })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.value ? 'border-red-300' : ''}`}
                  placeholder="10000"
                />
                {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Durum *
                </label>
                <select
                  id="status"
                  {...register('status', { required: 'Durum seçimi zorunludur' })}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.status ? 'border-red-300' : ''}`}
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Öncelik
                </label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="critical">Kritik</option>
                </select>
              </div>


            </div>

            <div>
              <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700">
                Tahmini Kapanış Tarihi *
              </label>
              <input
                type="date"
                id="expected_close_date"
                {...register('expected_close_date', { required: 'Tahmini kapanış tarihi zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.expected_close_date ? 'border-red-300' : ''}`}
              />
              {errors.expected_close_date && <p className="mt-1 text-sm text-red-600">{errors.expected_close_date.message}</p>}
            </div>

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
        )}
      </Card>
    </AppWrapper>
  );
}

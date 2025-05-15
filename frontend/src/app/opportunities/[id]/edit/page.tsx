'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { OpportunityDetail, OpportunityCreate } from '@/types/opportunities';
import { getOpportunityById, getOpportunityStatuses, updateOpportunity } from '@/services/opportunityService';
import { getCompanyContacts } from '@/services/companyService';
import { ContactNested } from '@/types/customer';
import { OpportunityStatus } from '@/types/opportunities';

interface EditOpportunityProps {
  params: {
    id: string;
  };
}

export default function EditOpportunity({ params }: EditOpportunityProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<OpportunityCreate>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [statuses, setStatuses] = useState<OpportunityStatus[]>([]);
  const [contacts, setContacts] = useState<ContactNested[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [opportunityData, statusesData] = await Promise.all([
          getOpportunityById(id),
          getOpportunityStatuses()
        ]);
        
        setOpportunity(opportunityData);
        setStatuses(statusesData);
        
        // Firmanın kişilerini çek
        if (opportunityData.company) {
          const contactsData = await getCompanyContacts(opportunityData.company);
          setContacts(contactsData || []);
        }
        
        // Form alanlarını mevcut değerlerle doldur
        reset({
          title: opportunityData.title,
          description: opportunityData.description || '',
          company: opportunityData.company,
          status: opportunityData.status,
          value: opportunityData.value,
          priority: opportunityData.priority,
          probability: opportunityData.probability,
          expected_close_date: opportunityData.expected_close_date,
          contacts: opportunityData.contacts.map(contact => contact.id)
        });
      } catch (err) {
        console.error('Fırsat detayları yüklenirken hata:', err);
        setError('Fırsat detayları yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  const onSubmit = async (data: OpportunityCreate) => {
    try {
      setError(null);
      await updateOpportunity(id, data);
      router.push(`/opportunities/${id}`);
    } catch (err) {
      console.error('Fırsat güncellenirken hata:', err);
      setError('Fırsat güncellenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title="Fırsat Düzenle" 
        subtitle={opportunity ? `"${opportunity.title}" fırsatını düzenleyin` : "Fırsat düzenleyin"}
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
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
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
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
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                  {contact.position ? ` - ${contact.position}` : ''}
                </option>
              ))}
            </select>
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

            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                Kazanma Olasılığı (%)
              </label>
              <input
                type="number"
                id="probability"
                min={0}
                max={100}
                step={5}
                {...register('probability', {
                  min: { value: 0, message: 'Olasılık en az 0 olmalıdır' },
                  max: { value: 100, message: 'Olasılık en fazla 100 olmalıdır' }
                })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.probability ? 'border-red-300' : ''}`}
              />
              {errors.probability && <p className="mt-1 text-sm text-red-600">{errors.probability.message}</p>}
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
      </Card>
    </AppWrapper>
  );
}

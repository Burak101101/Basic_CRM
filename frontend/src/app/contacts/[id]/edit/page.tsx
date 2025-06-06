'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { Contact } from '@/types/customer';
import { getContactById, updateContact } from '@/services/contactService';
import { getCompanies } from '@/services/companyService';
import { CompanyList } from '@/types/customer';

interface EditContactProps {
  params: {
    id: string;
  };
}

export default function EditContact({ params }: EditContactProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Contact>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyList[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [contact, companiesData] = await Promise.all([
          getContactById(id),
          getCompanies()
        ]);
        
        setCompanies(companiesData);
        // Form alanlarını mevcut değerlerle doldur
        reset(contact);
      } catch (err) {
        console.error('Kişi bilgileri yüklenirken hata:', err);
        setError('Kişi bilgileri yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, reset]);

  const onSubmit = async (data: Contact) => {
    try {
      setError(null);
      await updateContact(id, data);
      router.push(`/contacts/${id}`);
    } catch (err) {
      console.error('Kişi güncellenirken hata:', err);
      setError('Kişi güncellenirken bir sorun oluştu. Lütfen tekrar deneyin.');
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
        title="Kişi Düzenle" 
        subtitle="Kişi bilgilerini güncelleyin"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Firma *
            </label>
            <select
              id="company"
              {...register('company', { required: 'Firma seçimi zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.company ? 'border-red-300' : ''}`}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                Ad *
              </label>
              <input
                type="text"
                id="first_name"
                {...register('first_name', { required: 'Ad zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.first_name ? 'border-red-300' : ''}`}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Soyad *
              </label>
              <input
                type="text"
                id="last_name"
                {...register('last_name', { required: 'Soyad zorunludur' })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.last_name ? 'border-red-300' : ''}`}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
              Pozisyon
            </label>
            <input
              type="text"
              id="position"
              {...register('position')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefon
              </label>
              <input
                type="text"
                id="phone"
                {...register('phone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="is_primary"
                  type="checkbox"
                  {...register('is_primary')}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_primary" className="font-medium text-gray-700">
                  Ana İletişim Kişisi
                </label>
                <p className="text-gray-500">Bu kişiyi firmanın ana iletişim kişisi olarak belirle</p>
              </div>
            </div>
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

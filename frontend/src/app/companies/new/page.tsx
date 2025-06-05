'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { CompanyCreate } from '@/types/customer';
import { createCompany } from '@/services/companyService';

export default function NewCompany() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyCreate>();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: CompanyCreate) => {
    try {
      setError(null);
      const newCompany = await createCompany(data);
      router.push(`/companies/${newCompany.id}`);
    } catch (err) {
      console.error('Firma oluşturulurken hata:', err);
      setError('Firma oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Yeni Firma Ekle" 
        subtitle="Müşteri veri tabanınıza yeni bir firma ekleyin"
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Firma Adı *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Firma adı zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-300' : ''}`}
              placeholder="ABC Teknoloji Ltd. Şti."
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="tax_number" className="block text-sm font-medium text-gray-700">
              Vergi Numarası
            </label>
            <input
              type="text"
              id="tax_number"
              {...register('tax_number')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="1234567890"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                Sektör
              </label>
              <input
                type="text"
                id="industry"
                {...register('industry')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Teknoloji, Perakende, Sağlık, vb."
              />
            </div>
            <div>
              <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                Firma Büyüklüğü
              </label>
              <select
                id="company_size"
                {...register('company_size')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">-- Seçiniz --</option>
                <option value="small">Küçük (1-50 çalışan)</option>
                <option value="medium">Orta (51-250 çalışan)</option>
                <option value="large">Büyük (251-1000 çalışan)</option>
                <option value="enterprise">Kurumsal (1000+ çalışan)</option>
              </select>
            </div>
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
                placeholder="+90 (212) 123 4567"
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
                placeholder="info@abcteknoloji.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Adres
            </label>
            <textarea
              id="address"
              rows={3}
              {...register('address')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Firma adresi"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedin_url"
                {...register('linkedin_url')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="url"
                id="website_url"
                {...register('website_url')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="https://www.example.com"
              />
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

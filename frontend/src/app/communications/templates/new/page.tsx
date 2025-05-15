'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { EmailTemplate } from '@/types/communications';
import { createEmailTemplate } from '@/services/communicationService';

export default function NewEmailTemplate() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailTemplate>();
  const [error, setError] = useState<string | null>(null);
  const [variableInputs, setVariableInputs] = useState<string[]>(['']);
    const onSubmit = async (data: any) => {
    try {
      setError(null);
      
      // Filter out empty variable inputs
      const variables = variableInputs.filter(v => v.trim() !== '')
        .reduce((acc, curr) => {
          acc[curr] = `{${curr}}`;
          return acc;
        }, {} as Record<string, string>);
      
      const templateData = {
        ...data,
        variables
      };
      
      console.log('Şablon oluşturuluyor:', templateData);
      await createEmailTemplate(templateData);
      console.log('Şablon başarıyla oluşturuldu');
      router.push('/communications?tab=templates');
    } catch (err: any) {
      console.error('E-posta şablonu oluşturulurken hata:', err);
      setError(`E-posta şablonu oluşturulurken bir sorun oluştu: ${err?.response?.data?.detail || err.message || 'Bilinmeyen hata'}`);
    }
  };
  
  const addVariableInput = () => {
    setVariableInputs([...variableInputs, '']);
  };
  
  const removeVariableInput = (index: number) => {
    setVariableInputs(variableInputs.filter((_, i) => i !== index));
  };
  
  const updateVariableInput = (index: number, value: string) => {
    const newInputs = [...variableInputs];
    newInputs[index] = value;
    setVariableInputs(newInputs);
  };
  
  return (
    <AppWrapper>
      <PageHeader 
        title="Yeni E-posta Şablonu" 
        subtitle="Gönderimlerinde kullanabileceğiniz bir e-posta şablonu oluşturun"
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
              Şablon Adı *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Şablon adı zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-300' : ''}`}
              placeholder="Örn: Hoş Geldin E-postası"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              E-posta Konusu *
            </label>
            <input
              type="text"
              id="subject"
              {...register('subject', { required: 'E-posta konusu zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.subject ? 'border-red-300' : ''}`}
              placeholder="Örn: Firma adınız - Teklifimiz Hakkında"
            />
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Şablon İçeriği *
            </label>
            <textarea
              id="content"
              rows={10}
              {...register('content', { required: 'Şablon içeriği zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.content ? 'border-red-300' : ''}`}
              placeholder="Sayın {ad_soyad},

ABC Firması ile ilgili talebiniz hakkında sizinle iletişime geçiyorum.
..."
            />
            {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Değişkenler için {'{değişken_adı}'} formatını kullanın. Örn: {'{ad_soyad}'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Şablon Değişkenleri
              </label>
              <button 
                type="button"
                onClick={addVariableInput}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Değişken Ekle
              </button>
            </div>
            <div className="space-y-2">
              {variableInputs.map((variable, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={variable}
                    onChange={(e) => updateVariableInput(index, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Değişken adı (örn: ad_soyad)"
                  />
                  <button 
                    type="button"
                    onClick={() => removeVariableInput(index)}
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={variableInputs.length === 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Bu değişkenler şablon içeriğinde kullanılabilir.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-5 border-t">
            <button
              type="button"
              onClick={() => router.push('/communications?tab=templates')}
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

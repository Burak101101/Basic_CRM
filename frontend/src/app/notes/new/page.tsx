'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { NoteEditor } from '@/components/common/TinyMCEEditor';
import FileUpload from '@/components/common/FileUpload';
import { Note } from '@/types/customer';
import { createNote } from '@/services/noteService';

interface NoteFormData {
  title: string;
  content: string;
  rich_content?: string;
  company?: number;
  contact?: number;
  note_date?: string;
  reminder_date?: string;
}

export default function NewNote() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get('company');
  const contactId = searchParams.get('contact');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NoteFormData>({
    defaultValues: {
      company: companyId ? parseInt(companyId) : undefined,
      contact: contactId ? parseInt(contactId) : undefined
    }
  });
  
  const [error, setError] = useState<string | null>(null);
  const [richContent, setRichContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const onSubmit = async (data: NoteFormData) => {
    try {
      setError(null);

      // Dosya yükleme işlemi burada yapılacak (şimdilik sadece dosya isimlerini saklıyoruz)
      const attachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      await createNote({
        ...data,
        content: richContent || data.content,
        rich_content: richContent,
        company: data.company || null,
        contact: data.contact || null,
        attachments: attachments
      });
      
      // Not oluşturulduktan sonra ilgili sayfaya yönlendirme yap
      if (companyId) {
        router.push(`/companies/${companyId}`);
      } else if (contactId) {
        router.push(`/contacts/${contactId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Not oluşturulurken hata:', err);
      setError('Not oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Yeni Not Ekle" 
        subtitle={companyId ? "Firmaya not ekleyin" : contactId ? "Kişiye not ekleyin" : "Not ekleyin"}
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
              Başlık *
            </label>
            <input
              type="text"
              id="title"
              {...register('title', { required: 'Başlık zorunludur' })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.title ? 'border-red-300' : ''}`}
              placeholder="Not başlığı"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Content Editor */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              İçerik *
            </label>
            <div className="mt-1">
              <NoteEditor
                value={richContent}
                onChange={setRichContent}
                placeholder="Not içeriği buraya yazılacak..."
                height={400}
              />
              {!richContent && (
                <p className="mt-1 text-sm text-red-600">Not içeriği zorunludur</p>
              )}
            </div>
          </div>

          {/* Note Date */}
          <div>
            <label htmlFor="note_date" className="block text-sm font-medium text-gray-700">
              Not Tarihi
            </label>
            <input
              type="datetime-local"
              id="note_date"
              {...register('note_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Reminder Date */}
          <div>
            <label htmlFor="reminder_date" className="block text-sm font-medium text-gray-700">
              Hatırlatma Tarihi
            </label>
            <input
              type="datetime-local"
              id="reminder_date"
              {...register('reminder_date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* File Upload */}
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
          
          {contactId && (
            <input type="hidden" {...register('contact')} value={contactId} />
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

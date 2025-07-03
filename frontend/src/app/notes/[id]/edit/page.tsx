'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { NoteEditor } from '@/components/common/TinyMCEEditor';
import FileUpload from '@/components/common/FileUpload';
import { Note } from '@/types/customer';
import { getNoteById, updateNote } from '@/services/noteService';

interface EditNoteProps {
  params: {
    id: string;
  };
}

export default function EditNote({ params }: EditNoteProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Note>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<Note | null>(null);
  const [richContent, setRichContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const noteData = await getNoteById(id);
        setNote(noteData);
        reset({
          ...noteData,
          note_date: noteData.note_date ? noteData.note_date.slice(0, 16) : '',
          reminder_date: noteData.reminder_date ? noteData.reminder_date.slice(0, 16) : ''
        });

        // Rich content'i ayarla
        setRichContent(noteData.rich_content || noteData.content);
      } catch (err) {
        console.error('Not bilgileri yüklenirken hata:', err);
        setError('Not bilgileri yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [id, reset]);

  const onSubmit = async (data: Note) => {
    try {
      setError(null);
      // Dosya yükleme işlemi burada yapılacak (şimdilik sadece dosya isimlerini saklıyoruz)
      const attachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      await updateNote(id, {
        title: data.title,
        content: richContent || data.content,
        rich_content: richContent,
        company: note?.company, // note varsa company=note.company
        contact: note?.contact,
        note_date: data.note_date,
        reminder_date: data.reminder_date,
        attachments: attachments
      });
      
      // Not güncellendikten sonra ilgili sayfaya yönlendirme yap
      if (note?.company) {
        router.push(`/companies/${note.company}`);
      } else if (note?.contact) {
        router.push(`/contacts/${note.contact}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Not güncellenirken hata:', err);
      setError('Not güncellenirken bir sorun oluştu. Lütfen tekrar deneyin.');
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
            <div className="h-40 bg-gray-200 rounded w-full mb-2"></div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title="Not Düzenle" 
        subtitle={note?.company_name ? `"${note.company_name}" için not düzenle` : 
                 note?.contact_name ? `"${note.contact_name}" için not düzenle` : 
                 "Not düzenle"}
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

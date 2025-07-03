'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import Link from 'next/link';
import { EmailTemplate } from '@/types/communications';
import { getEmailTemplateById, deleteEmailTemplate } from '@/services/communicationService';
import { PencilSquareIcon, TrashIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface EmailTemplateDetailProps {
  params: {
    id: string;
  };
}



export default function EmailTemplateDetail({ params }: EmailTemplateDetailProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const data = await getEmailTemplateById(id);
        setTemplate(data);
      } catch (err) {
        console.error('Şablon yüklenirken hata:', err);
        setError('Şablon yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [id]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await deleteEmailTemplate(id);
      router.push('/communications?tab=templates');
    } catch (err) {
      console.error('Şablon silinirken hata:', err);
      setError('Şablon silinirken bir sorun oluştu.');
    }
  };

  if (isLoading) {
    return (
      <AppWrapper>
        <PageHeader
          title="Şablon Detayları"
          subtitle="Şablon yükleniyor..."
        />
        <div className="animate-pulse">
          <Card>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
          </Card>
        </div>
      </AppWrapper>
    );
  }

  if (error || !template) {
    return (
      <AppWrapper>
        <PageHeader
          title="Şablon Detayları"
          subtitle="Şablonu görüntülerken bir sorun oluştu."
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-red-500">{error || 'Şablon bulunamadı.'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
            >
              Geri Dön
            </button>
          </div>
        </Card>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader
        title={template.name}
        subtitle="Şablon Detayları"
        actionButton={
          <div className="flex space-x-2">
            <Link
              href={`/communications/compose?template=${template.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              E-posta Oluştur
            </Link>
            <Link
              href={`/communications/templates/${template.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Düzenle
            </Link>
            <button
              onClick={handleDelete}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                deleteConfirm
                  ? 'text-white bg-red-600 hover:bg-red-700'
                  : 'text-red-700 bg-red-100 hover:bg-red-200'
              }`}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              {deleteConfirm ? 'Emin misiniz?' : 'Sil'}
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Şablon Adı</h3>
            <p className="text-gray-700">{template.name}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Konu</h3>
            <p className="text-gray-700">{template.subject}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">İçerik</h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: template.content }}></div>
            </div>
          </div>
          
          {template.variables && Object.keys(template.variables).length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Değişkenler</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(template.variables).map((variable) => (
                  <span
                    key={variable}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        <div className="flex justify-between">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            Geri Dön
          </button>
          
          <div className="flex space-x-2">
            <Link
              href={`/communications/templates/${template.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Düzenle
            </Link>
            <Link
              href={`/communications/compose?template=${template.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              E-posta Oluştur
            </Link>
          </div>
        </div>
      </div>
    </AppWrapper>
  );
}

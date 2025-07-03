'use client';

import { useState } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import EmailComposer from '@/components/communications/EmailComposer';
import { emailService, EmailData } from '@/services/emailService';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function EmailsPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async (emailData: EmailData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await emailService.sendEmail(emailData);
      setSuccessMessage(`E-posta başarıyla gönderildi! ${result.recipients_count} alıcıya ulaştı.`);
      setShowComposer(false);
    } catch (err: any) {
      console.error('Email send error:', err);
      setError(err.message || 'E-posta gönderilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCompose = () => {
    setShowComposer(false);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="E-posta Yönetimi" 
        subtitle="E-posta gönder ve geçmişini görüntüle"
      />

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6">
        {!showComposer ? (
          <div className="text-center">
            <div className="mx-auto max-w-md">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">E-posta Gönder</h3>
              <p className="mt-1 text-sm text-gray-500">
                Müşterilerinize ve iş ortaklarınıza e-posta göndermek için başlayın.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowComposer(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Yeni E-posta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <EmailComposer
            onSend={handleSendEmail}
            onCancel={handleCancelCompose}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Email History Section - Placeholder for future implementation */}
      {!showComposer && (
        <div className="mt-12">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                E-posta Geçmişi
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Gönderilen e-postaların listesi burada görünecek.</p>
              </div>
              <div className="mt-5">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V9M16 13v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz e-posta yok</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    İlk e-postanızı gönderdikten sonra burada görünecek.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppWrapper>
  );
}

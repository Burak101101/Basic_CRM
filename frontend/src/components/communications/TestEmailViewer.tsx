'use client';

import React, { useState, useEffect } from 'react';
import { getTestEmails, getTestEmailDetail } from '@/services/communicationService';
import Card from '@/components/layout/Card';

interface TestEmail {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  date: string;
  content: string;
  file_path: string;
}

interface TestEmailsProps {
  onClose?: () => void;
}

export default function TestEmailViewer({ onClose }: TestEmailsProps) {
  const [emails, setEmails] = useState<TestEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TestEmail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTestEmails();
        setEmails(data);
      } catch (err) {
        console.error('Test e-postaları yüklenirken hata:', err);
        setError('Test e-postaları yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const handleSelectEmail = async (email: TestEmail) => {
    try {
      // Extract the email ID from the file path
      const filePathParts = email.file_path.split('/');
      const fileName = filePathParts[filePathParts.length - 1];
      const emailId = fileName.replace('.json', '');
      
      const emailDetail = await getTestEmailDetail(emailId);
      setSelectedEmail(emailDetail);
    } catch (err) {
      console.error('E-posta detayları yüklenirken hata:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Test E-postaları</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Kapat</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 border-r pr-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">E-posta Listesi</h4>
            {emails.length === 0 ? (
              <p className="text-sm text-gray-500">Henüz test e-postası yok.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-2 rounded cursor-pointer ${selectedEmail && selectedEmail.subject === email.subject ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'}`}
                  >
                    <div className="text-sm font-medium truncate">{email.subject}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(email.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div>
                <div className="border-b pb-4 mb-4">
                  <h2 className="text-lg font-medium">{selectedEmail.subject}</h2>
                  <div className="text-sm text-gray-500 mt-2">
                    <div><strong>Gönderen:</strong> {selectedEmail.from}</div>
                    <div><strong>Alıcılar:</strong> {selectedEmail.to.join(', ')}</div>
                    {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                      <div><strong>CC:</strong> {selectedEmail.cc.join(', ')}</div>
                    )}
                    {selectedEmail.bcc && selectedEmail.bcc.length > 0 && (
                      <div><strong>BCC:</strong> {selectedEmail.bcc.join(', ')}</div>
                    )}
                    <div><strong>Tarih:</strong> {formatDate(selectedEmail.date)}</div>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.content }}></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>E-posta seçin</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

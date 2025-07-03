'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, UserIcon, BuildingOfficeIcon, BriefcaseIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { EmailMessage, IncomingEmail } from '@/types/communications';
import { useRouter } from 'next/navigation';
import AIButton from '@/components/ai/AIButton';
import AIResponseModal from '@/components/ai/AIResponseModal';
import { aiService } from '@/services/aiService';

interface EmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: EmailMessage | IncomingEmail | null;
  type: 'sent' | 'incoming';
}

export default function EmailDetailModal({ isOpen, onClose, email, type }: EmailDetailModalProps) {
  const router = useRouter();

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGeneratedReply, setAiGeneratedReply] = useState('');

  if (!email) return null;

  // AI handler functions
  const handleAIReply = async () => {
    if (type !== 'incoming') return;

    try {
      setAiLoading(true);

      const aiRequest = {
        incoming_email_id: email.id,
        additional_context: ''
      };

      const generatedReply = await aiService.generateEmailReply(aiRequest);
      setAiGeneratedReply(generatedReply);
      setAiModalOpen(true);
    } catch (err: any) {
      console.error('AI yanıt oluşturma hatası:', err);
      // TODO: Show error message to user
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIApprove = (approvedContent: string) => {
    // Navigate to compose page with pre-filled reply
    const params = new URLSearchParams();
    if ((email as IncomingEmail).company) {
      params.set('company', (email as IncomingEmail).company!.toString());
    }
    if ((email as IncomingEmail).contact) {
      params.set('contact', (email as IncomingEmail).contact!.toString());
    }

    // Store the reply content in sessionStorage to be picked up by compose page
    sessionStorage.setItem('aiReplyContent', approvedContent);
    sessionStorage.setItem('aiReplySubject', `Re: ${email.subject}`);
    sessionStorage.setItem('aiReplyTo', (email as IncomingEmail).sender_email);

    router.push(`/communications/compose?${params.toString()}`);
    setAiModalOpen(false);
    onClose();
  };

  const handleAIReject = () => {
    setAiModalOpen(false);
    setAiGeneratedReply('');
  };

  const formatRecipients = (recipients: any) => {
    if (!recipients) return 'Alıcı yok';
    
    // String ise parse et
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients);
      } catch (e) {
        return recipients;
      }
    }
    
    // Array ise formatla
    if (Array.isArray(recipients)) {
      return recipients.map((r: any) => r?.email || r).join(', ');
    }
    
    return recipients;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      sent: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      sending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      unread: 'bg-blue-100 text-blue-800',
      read: 'bg-gray-100 text-gray-800',
      archived: 'bg-purple-100 text-purple-800'
    };

    const statusText = {
      sent: 'Gönderildi',
      draft: 'Taslak',
      sending: 'Gönderiliyor',
      failed: 'Başarısız',
      unread: 'Okunmamış',
      read: 'Okunmuş',
      archived: 'Arşivlenmiş'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClasses[status as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status as keyof typeof statusText] || status}
      </span>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    E-posta Detayı
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Kapat</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Header Bilgileri */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Konu</h4>
                        <p className="text-sm text-gray-700">{email.subject}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Durum</h4>
                        {getStatusBadge(email.status)}
                      </div>
                      
                      {type === 'sent' ? (
                        <>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Alıcılar</h4>
                            <p className="text-sm text-gray-700">{formatRecipients((email as EmailMessage).recipients)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Gönderen</h4>
                            <p className="text-sm text-gray-700">{(email as EmailMessage).sender}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Gönderen</h4>
                            <p className="text-sm text-gray-700">
                              {(email as IncomingEmail).sender_name 
                                ? `${(email as IncomingEmail).sender_name} <${(email as IncomingEmail).sender_email}>`
                                : (email as IncomingEmail).sender_email
                              }
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Alıcılar</h4>
                            <p className="text-sm text-gray-700">{formatRecipients((email as IncomingEmail).recipients)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* İlişkili Bilgiler */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {email.company_name && (
                      <div className="flex items-center space-x-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Firma</p>
                          <p className="text-sm font-medium text-gray-900">{email.company_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {email.contact_name && (
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Kişi</p>
                          <p className="text-sm font-medium text-gray-900">{email.contact_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {(email as EmailMessage).opportunity_title && (
                      <div className="flex items-center space-x-2">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Fırsat</p>
                          <p className="text-sm font-medium text-gray-900">{(email as EmailMessage).opportunity_title}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tarih Bilgileri */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {type === 'sent' ? 'Gönderilme Tarihi' : 'Alınma Tarihi'}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {type === 'sent' 
                          ? formatDate((email as EmailMessage).sent_at || email.created_at)
                          : formatDate((email as IncomingEmail).received_at)
                        }
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Oluşturulma Tarihi</h4>
                      <p className="text-sm text-gray-700">{formatDate(email.created_at)}</p>
                    </div>
                  </div>

                  {/* E-posta İçeriği */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">İçerik</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {type === 'incoming' && (email as IncomingEmail).content_html ? (
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: (email as IncomingEmail).content_html! }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                          {email.content?.replace(/<\/?[^>]+(>|$)/g, '')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <div>
                    {type === 'incoming' && (
                      <AIButton
                        onClick={handleAIReply}
                        loading={aiLoading}
                        size="md"
                        variant="primary"
                      >
                        AI ile Yanıtla
                      </AIButton>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Kapat
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>

      {/* AI Response Modal */}
      <AIResponseModal
        isOpen={aiModalOpen}
        onClose={handleAIReject}
        title="AI Tarafından Oluşturulan Yanıt"
        content={aiGeneratedReply}
        onApprove={handleAIApprove}
        onReject={handleAIReject}
        type="email"
      />
    </Transition>
  );
}

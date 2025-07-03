'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserGroupIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { Event } from '@/types/events';
import { 
  getEventById, 
  deleteEvent, 
  completeEvent, 
  cancelEvent,
  getEventTypeLabel,
  getEventStatusLabel 
} from '@/services/eventService';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const eventData = await getEventById(eventId);
      setEvent(eventData);
    } catch (err: any) {
      console.error('Etkinlik yüklenirken hata:', err);
      setError('Etkinlik bilgileri yüklenirken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteEvent(eventId);
      router.push('/events');
    } catch (err) {
      console.error('Etkinlik silinirken hata:', err);
      setError('Etkinlik silinirken bir sorun oluştu.');
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      const updatedEvent = await completeEvent(eventId, outcome);
      setEvent(updatedEvent);
      setOutcome('');
    } catch (err) {
      console.error('Etkinlik tamamlanırken hata:', err);
      setError('Etkinlik tamamlanırken bir sorun oluştu.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const updatedEvent = await cancelEvent(eventId, cancelReason);
      setEvent(updatedEvent);
      setCancelReason('');
    } catch (err) {
      console.error('Etkinlik iptal edilirken hata:', err);
      setError('Etkinlik iptal edilirken bir sorun oluştu.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'postponed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'urgent': 'Acil',
      'high': 'Yüksek',
      'medium': 'Orta',
      'low': 'Düşük',
    };
    return priorityMap[priority] || priority;
  };

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AppWrapper>
    );
  }

  if (error || !event) {
    return (
      <AppWrapper>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Etkinlik bulunamadı'}
          </h3>
          <Link
            href="/events"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Etkinlikler listesine dön
          </Link>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title={event.title}
        subtitle={`${getEventTypeLabel(event.event_type)} • ${formatDateTime(event.start_datetime)}`}
        action={
          <div className="flex space-x-3">
            {event.status === 'scheduled' && (
              <>
                <button
                  onClick={() => setIsCompleting(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Tamamla
                </button>
                <button
                  onClick={() => setIsCancelling(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  İptal Et
                </button>
              </>
            )}
            <Link
              href={`/events/${event.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Düzenle
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Sil
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ana Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Etkinlik Detayları</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                    {getEventStatusLabel(event.status)}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(event.priority)}`}>
                    {getPriorityLabel(event.priority)}
                  </span>
                </div>
              </div>

              {event.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Açıklama</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Başlangıç</p>
                    <p className="text-sm text-gray-600">{formatDateTime(event.start_datetime)}</p>
                  </div>
                </div>

                {event.end_datetime && (
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bitiş</p>
                      <p className="text-sm text-gray-600">{formatDateTime(event.end_datetime)}</p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lokasyon</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.meeting_url && (
                  <div className="flex items-center">
                    <LinkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Toplantı Bağlantısı</p>
                      <a 
                        href={event.meeting_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Toplantıya Katıl
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {event.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Notlar</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.notes}</p>
                </div>
              )}

              {event.outcome && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Sonuç</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.outcome}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Yan Panel */}
        <div className="space-y-6">
          {/* Firma */}
          {event.company && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Firma</h3>
              </div>
              <div className="px-6 py-4">
                <Link
                  href={`/companies/${event.company}`}
                  className="flex items-center hover:bg-gray-50 -mx-6 px-6 py-2"
                >
                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="font-medium text-gray-900">{event.company_name}</span>
                </Link>
              </div>
            </Card>
          )}
          
          {/* Katılımcılar */}
          {event.contacts_details && event.contacts_details.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Katılımcılar</h3>
              </div>
              <div className="px-6 py-4">
                <ul className="divide-y divide-gray-200">
                  {event.contacts_details.map(contact => (
                    <li key={contact.id}>
                      <Link 
                        href={`/contacts/${contact.id}`}
                        className="flex items-center hover:bg-gray-50 -mx-6 px-6 py-2"
                      >
                        <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                            {contact.email && (
                              <span className="flex items-center">
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                {contact.email}
                              </span>
                            )}
                            {contact.phone && (
                              <span className="flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {contact.phone}
                              </span>
                            )}
                            {contact.position && (
                              <span className="flex items-center">
                                <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                                {contact.position}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Sorumlu Kişi */}
          {event.assigned_to_name && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Sorumlu</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="font-medium text-gray-900">{event.assigned_to_name}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Ekler */}
          {event.attachments && event.attachments.length > 0 && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Ekler</h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-2">
                  {event.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Tamamlama Modal */}
      {isCompleting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Etkinliği Tamamla</h3>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Etkinlik sonucu (opsiyonel)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setIsCompleting(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Tamamla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İptal Modal */}
      {isCancelling && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Etkinliği İptal Et</h3>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="İptal sebebi (opsiyonel)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setIsCancelling(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                >
                  İptal Et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Etkinliği Sil</h3>
              <p className="text-sm text-gray-600 mb-6">
                Bu etkinliği silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Siliniyor...' : 'Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppWrapper>
  );
}

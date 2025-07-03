'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { getContactById, deleteContact } from '@/services/contactService';
import { getOpportunities } from '@/services/opportunityService';
import { getContactEvents } from '@/services/eventService';
import { Contact, Note } from '@/types/customer';
import { OpportunityList } from '@/types/opportunities';
import { EventList } from '@/types/events';
import Link from 'next/link';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import AIButton from '@/components/ai/AIButton';
import OpportunityProposalModal from '@/components/ai/OpportunityProposalModal';
import { aiService, OpportunityAIResponse } from '@/services/aiService';

interface ContactDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ContactDetails({ params }: ContactDetailsProps) {
  const { id } = use(params);
  const parsedId = parseInt(id);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityList[]>([]);
  const [events, setEvents] = useState<EventList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpportunities, setAiOpportunities] = useState<OpportunityAIResponse | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        setIsLoading(true);
        const data = await getContactById(parsedId);
        setContact(data);

        // Kişinin fırsatlarını getir
        const opportunitiesData = await getOpportunities();
        // Contact'ın company'si üzerinden fırsatları filtrele
        const contactOpportunities = opportunitiesData.filter(opp =>
          opp.company === data.company
        );
        setOpportunities(contactOpportunities);

        // Kişinin etkinliklerini getir
        const eventsData = await getContactEvents(Number(parsedId));
        setEvents(eventsData);
      } catch (err) {
        console.error('Kişi detayları yüklenirken hata:', err);
        setError('Kişi detayları yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteContact(parsedId);
      router.push('/contacts');
    } catch (err) {
      console.error('Kişi silinirken hata:', err);
      setError('Kişi silinirken bir sorun oluştu.');
      setIsDeleting(false);
    }
  };

  const handleAIOpportunityGenerate = async () => {
    try {
      setAiLoading(true);
      setError(null);

      const aiRequest = {
        company_id: contact?.company || undefined,
        contact_id: parsedId,
        additional_context: `Kişi: ${contact?.first_name} ${contact?.last_name}, Pozisyon: ${contact?.position || 'Belirtilmemiş'}`
      };

      const opportunityData = await aiService.generateOpportunityProposal(aiRequest);
      setAiOpportunities(opportunityData);
    } catch (err: any) {
      console.error('AI fırsat önerisi oluşturma hatası:', err);
      setError(err.message || 'AI fırsat önerisi oluşturulurken bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseAIModal = () => {
    setAiOpportunities(null);
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
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  if (error || !contact) {
    return (
      <AppWrapper>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error || 'Kişi bulunamadı'}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md mr-2"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </button>
          <Link 
            href="/contacts"
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md"
          >
            Kişi Listesine Dön
          </Link>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title={`${contact.first_name} ${contact.last_name}`}
        subtitle={`${contact.company_name}${contact.position ? ` - ${contact.position}` : ''}`}
        actionButton={
          <div className="flex space-x-2">
            <Link 
              href={`/contacts/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Düzenle
            </Link>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isDeleting}
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </button>
          </div>
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="bg-white rounded-lg max-w-md w-full p-6 z-20">
            <h3 className="text-lg font-medium text-gray-900">Kişi Silinecek</h3>
            <p className="mt-2 text-sm text-gray-500">
              "{contact.first_name} {contact.last_name}" kişisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili veriler silinecektir.
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowDeleteConfirm(false)}
              >
                İptal
              </button>
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kişi Detayları */}
        <Card title="Kişi Bilgileri">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex items-start">
              <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                <BuildingOfficeIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                Firma
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                <Link href={`/companies/${contact.company}`} className="hover:text-indigo-600">
                  {contact.company_name}
                </Link>
              </dd>
            </div>
            {contact.position && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <BriefcaseIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Pozisyon
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">{contact.position}</dd>
              </div>
            )}
            {contact.phone && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <PhoneIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Telefon
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <a href={`tel:${contact.phone}`} className="hover:text-indigo-600">{contact.phone}</a>
                </dd>
              </div>
            )}
            {contact.email && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <EnvelopeIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  E-posta
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <a href={`mailto:${contact.email}`} className="hover:text-indigo-600">{contact.email}</a>
                </dd>
              </div>
            )}
            {contact.lead_source_display && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Lead Kaynağı
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">{contact.lead_source_display}</dd>
              </div>
            )}
            {contact.lead_status_display && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Lead Durumu
                </dt>
                <dd className="w-2/3 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    contact.lead_status === 'closed_won' ? 'bg-green-100 text-green-800' :
                    contact.lead_status === 'closed_lost' ? 'bg-red-100 text-red-800' :
                    contact.lead_status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.lead_status_display}
                  </span>
                </dd>
              </div>
            )}
            {(contact.linkedin_url || contact.personal_website) && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Web Linkleri
                </dt>
                <dd className="w-2/3 text-sm space-x-2">
                  {contact.linkedin_url && (
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      LinkedIn
                    </a>
                  )}
                  {contact.personal_website && (
                    <a
                      href={contact.personal_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Website
                    </a>
                  )}
                </dd>
              </div>
            )}
            <div className="py-3 flex items-start">
              <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                Ana Kişi
              </dt>
              <dd className="w-2/3 text-sm">
                {contact.is_primary ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Evet
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    Hayır
                  </span>
                )}
              </dd>
            </div>
            <div className="py-3 flex items-start">
              <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                Eklenme
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {new Date(contact.created_at).toLocaleDateString('tr-TR')}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Notlar */}
        <Card 
          title="Notlar"
          footer={
            <div className="flex justify-end">
              <Link
                href={`/notes/new?contact=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Not Ekle
              </Link>
            </div>
          }
        >
          {contact.notes && contact.notes.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {contact.notes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}/edit`}>
                  <div className="py-4 hover:bg-gray-50 cursor-pointer rounded-lg px-2 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                      {note.rich_content ?
                        note.rich_content.replace(/<[^>]*>/g, '').trim() :
                        note.content
                      }
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Bu kişiye henüz not eklenmemiş</p>
              <Link 
                href={`/notes/new?contact=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Not Ekle
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* İletişim Geçmişi - Etkinlikler */}
      <div className="mt-6">
        <Card
          title={`İletişim Geçmişi ${events.length > 0 ? `(${events.length})` : ''}`}
          subtitle="Kişi ile yapılan toplantılar, görüşmeler ve etkinlikler"
          footer={
            <div className="flex justify-end">
              <Link
                href={`/events/new?contact=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CalendarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Etkinlik Ekle
              </Link>
            </div>
          }
        >
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="inline-flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {event.event_type}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'completed' ? 'bg-green-100 text-green-800' :
                            event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                          {event.location && (
                            <span className="inline-flex items-center">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(event.start_datetime).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.start_datetime).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mb-4">Bu kişi ile henüz etkinlik gerçekleştirilmemiş</p>
              <Link
                href={`/events/new?contact=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CalendarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                İlk Etkinliği Ekle
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Fırsatlar */}
      <div className="mt-6">
        <Card
          title={`Satış Fırsatları ${opportunities.length > 0 ? `(${opportunities.length})` : ''}`}
          subtitle={opportunities.length > 0 ? `Toplam Değer: ${opportunities.reduce((sum, opp) => sum + Number(opp.value), 0).toLocaleString('tr-TR')} TL` : undefined}
          footer={
            <div className="flex justify-end space-x-3">
              <AIButton
                onClick={handleAIOpportunityGenerate}
                loading={aiLoading}
                size="md"
                variant="outline"
              >
                AI Fırsat Öner
              </AIButton>
              <Link
                href={`/opportunities/new?company=${contact?.company}&contact=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Fırsat Ekle
              </Link>
            </div>
          }
        >
          {opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{opportunity.title}</h4>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}
                                style={{ backgroundColor: opportunity.status_color + '20', color: opportunity.status_color }}>
                            {opportunity.status_name}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                            opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {opportunity.priority === 'high' ? 'Yüksek' :
                             opportunity.priority === 'medium' ? 'Orta' : 'Düşük'} Öncelik
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {opportunity.value.toLocaleString('tr-TR')} TL
                        </div>
                        <div className="text-sm text-gray-500">
                          Kapanış: {new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Bu kişiye ait satış fırsatı bulunmuyor</p>
              <div className="flex justify-center space-x-3">
                <AIButton
                  onClick={handleAIOpportunityGenerate}
                  loading={aiLoading}
                  size="md"
                  variant="outline"
                >
                  AI Fırsat Öner
                </AIButton>
                <Link
                  href={`/opportunities/new?company=${contact?.company}&contact=${id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Fırsat Ekle
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* AI Opportunity Proposal Modal */}
      <OpportunityProposalModal
        isOpen={!!aiOpportunities}
        onClose={handleCloseAIModal}
        proposals={aiOpportunities}
        companyId={contact?.company || undefined}
        contactId={parsedId}
      />
    </AppWrapper>
  );
}

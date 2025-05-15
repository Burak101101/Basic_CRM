'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { getOpportunityById, deleteOpportunity, addOpportunityActivity, changeOpportunityStatus } from '@/services/opportunityService';
import { OpportunityDetail, OpportunityActivityCreate } from '@/types/opportunities';
import { getOpportunityStatuses } from '@/services/opportunityService';
import Link from 'next/link';
import { 
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface OpportunityDetailsProps {
  params: {
    id: string;
  };
}

export default function OpportunityDetails({ params }: OpportunityDetailsProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showStatusChangeForm, setShowStatusChangeForm] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);

  // React Hook Form for activity
  const { register: registerActivity, handleSubmit: handleSubmitActivity, formState: { errors: activityErrors, isSubmitting: isSubmittingActivity }, reset: resetActivity } = useForm<OpportunityActivityCreate>();

  // React Hook Form for status change
  const { register: registerStatus, handleSubmit: handleSubmitStatus, formState: { isSubmitting: isSubmittingStatus } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [opportunityData, statusesData] = await Promise.all([
          getOpportunityById(id),
          getOpportunityStatuses()
        ]);
        setOpportunity(opportunityData);
        setStatuses(statusesData);
      } catch (err) {
        console.error('Fırsat detayları yüklenirken hata:', err);
        setError('Fırsat detayları yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteOpportunity(id);
      router.push('/opportunities');
    } catch (err) {
      console.error('Fırsat silinirken hata:', err);
      setError('Fırsat silinirken bir sorun oluştu.');
      setIsDeleting(false);
    }
  };

  const onSubmitActivity = async (data: OpportunityActivityCreate) => {
    try {
      const activityData = {
        ...data,
        opportunity: id,
        performed_at: new Date().toISOString()
      };
      
      await addOpportunityActivity(activityData);
      
      // Sayfayı yeniden yükle
      const updatedOpportunity = await getOpportunityById(id);
      setOpportunity(updatedOpportunity);
      
      // Formu temizle ve kapat
      resetActivity();
      setShowActivityForm(false);
    } catch (err) {
      console.error('Aktivite eklenirken hata:', err);
      setError('Aktivite eklenirken bir sorun oluştu.');
    }
  };

  const onSubmitStatusChange = async (data: any) => {
    try {
      await changeOpportunityStatus(id, parseInt(data.status));
      
      // Sayfayı yeniden yükle
      const updatedOpportunity = await getOpportunityById(id);
      setOpportunity(updatedOpportunity);
      
      // Formu kapat
      setShowStatusChangeForm(false);
    } catch (err) {
      console.error('Durum değiştirilirken hata:', err);
      setError('Durum değiştirilirken bir sorun oluştu.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
  };

  const getPriorityBadge = (priority: string) => {
    const badgeClasses = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    
    const priorityText = {
      low: 'Düşük',
      medium: 'Orta',
      high: 'Yüksek',
      critical: 'Kritik'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[priority as keyof typeof badgeClasses]}`}>
        {priorityText[priority as keyof typeof priorityText]}
      </span>
    );
  };

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'note':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />;
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-gray-400" />;
      case 'meeting':
        return <UserGroupIcon className="h-5 w-5 text-gray-400" />;
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-gray-400" />;
      case 'task':
        return <CheckCircleIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getActivityTypeText = (type: string) => {
    const typeText = {
      note: 'Not',
      call: 'Telefon',
      meeting: 'Toplantı',
      email: 'E-posta',
      task: 'Görev'
    };
    
    return typeText[type as keyof typeof typeText] || type;
  };

  if (isLoading) {
    return (
      <AppWrapper>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              </div>
            </div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  if (!opportunity) {
    return (
      <AppWrapper>
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fırsat bulunamadı</h3>
          <p className="text-gray-500 mb-6">Bu fırsat mevcut değil veya silinmiş olabilir.</p>
          <Link
            href="/opportunities"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Tüm Fırsatlara Dön
          </Link>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title={opportunity.title}
        subtitle={`${opportunity.company_name} - ${formatCurrency(opportunity.value)}`}
        actionButton={
          <div className="flex space-x-2">
            <button
              onClick={() => setShowStatusChangeForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Durum Değiştir
            </button>
            <Link 
              href={`/opportunities/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Düzenle
            </Link>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Sil
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* Silme işlemi onay modalı */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fırsatı Sil</h3>
            <p className="text-gray-500 mb-6">"{opportunity.title}" fırsatını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="mr-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isDeleting}
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Durum değiştirme modalı */}
      {showStatusChangeForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fırsat Durumunu Değiştir</h3>
            <form onSubmit={handleSubmitStatus(onSubmitStatusChange)} className="space-y-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Yeni Durum
                </label>
                <select
                  id="status"
                  {...registerStatus('status', { required: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  defaultValue={opportunity.status}
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowStatusChangeForm(false)}
                  className="mr-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmittingStatus ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Sütun - Detaylar */}
        <div className="lg:col-span-1">
          <Card title="Fırsat Detayları">
            <dl>
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <BuildingOfficeIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Firma
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <Link href={`/companies/${opportunity.company}`} className="hover:text-indigo-600">
                    {opportunity.company_name}
                  </Link>
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <CurrencyDollarIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Değer
                </dt>
                <dd className="w-2/3 text-sm text-gray-900 font-medium">
                  {formatCurrency(opportunity.value)}
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Durum
                </dt>
                <dd className="w-2/3 text-sm">
                  <span 
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                    style={{ 
                      backgroundColor: `${opportunity.status_color}20`, // Rengin opak versiyonu
                      color: opportunity.status_color 
                    }}
                  >
                    {opportunity.status_name}
                  </span>
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Öncelik
                </dt>
                <dd className="w-2/3 text-sm">
                  {getPriorityBadge(opportunity.priority)}
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  Olasılık
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  %{opportunity.probability}
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <CalendarIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Kapanış
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  {new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR')}
                </dd>
              </div>

              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <ClockIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Eklendi
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  {new Date(opportunity.created_at).toLocaleDateString('tr-TR')}
                </dd>
              </div>
              
              {opportunity.description && (
                <div className="py-3 border-t">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Açıklama
                  </dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {opportunity.description}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="İlgili Kişiler" className="mt-6">
            {opportunity.contacts && opportunity.contacts.length > 0 ? (
              <div className="space-y-3">
                {opportunity.contacts.map((contact: any) => (
                  <div key={contact.id} className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <Link 
                        href={`/contacts/${contact.id}`} 
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                      >
                        {contact.first_name} {contact.last_name}
                      </Link>
                      {contact.position && (
                        <p className="text-xs text-gray-500">{contact.position}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Bu fırsat ile ilişkilendirilmiş kişi bulunmuyor.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sağ Sütun - Aktiviteler */}
        <div className="lg:col-span-2">
          <Card 
            title="Aktiviteler"
            footer={
              <div className="flex justify-end">
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Aktivite Ekle
                </button>
              </div>
            }
          >
            {showActivityForm && (
              <div className="mb-6 p-4 border rounded-md bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Aktivite</h3>
                <form onSubmit={handleSubmitActivity(onSubmitActivity)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Aktivite Tipi *
                      </label>
                      <select
                        id="type"
                        {...registerActivity('type', { required: 'Aktivite tipi zorunludur' })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${activityErrors.type ? 'border-red-300' : ''}`}
                      >
                        <option value="note">Not</option>
                        <option value="call">Telefon Görüşmesi</option>
                        <option value="meeting">Toplantı</option>
                        <option value="email">E-posta</option>
                        <option value="task">Görev</option>
                      </select>
                      {activityErrors.type && <p className="mt-1 text-sm text-red-600">{activityErrors.type.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Başlık *
                      </label>
                      <input
                        type="text"
                        id="title"
                        {...registerActivity('title', { required: 'Başlık zorunludur' })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${activityErrors.title ? 'border-red-300' : ''}`}
                        placeholder="Aktivite başlığı"
                      />
                      {activityErrors.title && <p className="mt-1 text-sm text-red-600">{activityErrors.title.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Açıklama *
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      {...registerActivity('description', { required: 'Açıklama zorunludur' })}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${activityErrors.description ? 'border-red-300' : ''}`}
                      placeholder="Aktivite detayları"
                    />
                    {activityErrors.description && <p className="mt-1 text-sm text-red-600">{activityErrors.description.message}</p>}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowActivityForm(false)}
                      className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingActivity}
                      className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isSubmittingActivity ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {opportunity.activities && opportunity.activities.length > 0 ? (
              <div className="flow-root">
                <ul className="-mb-8">
                  {opportunity.activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== opportunity.activities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {getActivityIcon(activity.type)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap">
                              <div className="text-gray-500">{getActivityTypeText(activity.type)}</div>
                              <time dateTime={activity.performed_at}>
                                {new Date(activity.performed_at).toLocaleDateString('tr-TR')}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">Bu fırsata henüz aktivite eklenmemiş</p>
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  İlk Aktiviteyi Ekle
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppWrapper>
  );
}

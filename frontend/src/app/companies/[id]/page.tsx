'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import ContactCard from '@/components/customers/ContactCard';
import { getCompanyById, deleteCompany, getCompanyContacts } from '@/services/companyService';
import { getOpportunities } from '@/services/opportunityService';
import { CompanyDetail, Contact, Note } from '@/types/customer';
import { OpportunityList } from '@/types/opportunities';
import Link from 'next/link';
import { 
  BuildingOfficeIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  IdentificationIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface CompanyDetailsProps {
  params: {
    id: string;
  };
}

export default function CompanyDetails({ params }: CompanyDetailsProps) {
  const id = parseInt(params.id);
  const router = useRouter();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        const data = await getCompanyById(id);
        setCompany(data);
        
        // Şirketin kişilerini de ayrıca getir
        const contactsData = await getCompanyContacts(id);
        setContacts(contactsData || []);

        // Şirketin fırsatlarını getir
        const opportunitiesData = await getOpportunities();
        const companyOpportunities = opportunitiesData.filter(opp => opp.company === id);
        setOpportunities(companyOpportunities);
      } catch (err) {
        console.error('Firma detayları yüklenirken hata:', err);
        setError('Firma detayları yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCompany(id);
      router.push('/companies');
    } catch (err) {
      console.error('Firma silinirken hata:', err);
      setError('Firma silinirken bir sorun oluştu.');
      setIsDeleting(false);
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
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          </div>
        </div>
      </AppWrapper>
    );
  }

  if (error || !company) {
    return (
      <AppWrapper>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error || 'Firma bulunamadı'}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md mr-2"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </button>
          <Link 
            href="/companies"
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md"
          >
            Firma Listesine Dön
          </Link>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title={company.name} 
        subtitle={company.industry || 'Sektör belirtilmemiş'}
        actionButton={
          <div className="flex space-x-2">
            <Link 
              href={`/companies/${id}/edit`}
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
            <h3 className="text-lg font-medium text-gray-900">Firma Silinecek</h3>
            <p className="mt-2 text-sm text-gray-500">
              "{company.name}" firmasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm ilgili veriler silinecektir.
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

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Firma Detayları */}
        <Card title="Firma Bilgileri" className="lg:col-span-1">
          <dl className="divide-y divide-gray-200">
            {company.tax_number && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <IdentificationIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Vergi No
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">{company.tax_number}</dd>
              </div>
            )}
            {company.phone && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <PhoneIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Telefon
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <a href={`tel:${company.phone}`} className="hover:text-indigo-600">{company.phone}</a>
                </dd>
              </div>
            )}
            {company.email && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <EnvelopeIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  E-posta
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">
                  <a href={`mailto:${company.email}`} className="hover:text-indigo-600">{company.email}</a>
                </dd>
              </div>
            )}
            {company.address && (
              <div className="py-3 flex items-start">
                <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                  <MapPinIcon className="flex-shrink-0 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Adres
                </dt>
                <dd className="w-2/3 text-sm text-gray-900">{company.address}</dd>
              </div>
            )}
            <div className="py-3 flex items-start">
              <dt className="w-1/3 flex items-center text-sm font-medium text-gray-500">
                Eklenme
              </dt>
              <dd className="w-2/3 text-sm text-gray-900">
                {new Date(company.created_at).toLocaleDateString('tr-TR')}
              </dd>
            </div>
          </dl>
        </Card>

        {/* İrtibat Kişileri */}
        <Card 
          title="İrtibat Kişileri" 
          className="lg:col-span-2"
          footer={
            <div className="flex justify-end">
              <Link
                href={`/contacts/new?company=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Kişi Ekle
              </Link>
            </div>
          }
        >
          {contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contacts.map((contact) => (
                <ContactCard 
                  key={contact.id} 
                  contact={contact} 
                  hideCompany={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Bu firmaya henüz kişi eklenmemiş</p>
              <Link 
                href={`/contacts/new?company=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Kişi Ekle
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Notlar */}
      <div className="mt-6">
        <Card 
          title="Notlar"
          footer={
            <div className="flex justify-end">
              <Link
                href={`/notes/new?company=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Not Ekle
              </Link>
            </div>
          }
        >
          {company.notes && company.notes.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {company.notes.map((note) => (
                <div key={note.id} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{note.title}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Bu firmaya henüz not eklenmemiş</p>
              <Link 
                href={`/notes/new?company=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Not Ekle
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Satış Fırsatları */}
      <div className="mt-6">
        <Card
          title={`Satış Fırsatları ${opportunities.length > 0 ? `(${opportunities.length})` : ''}`}
          subtitle={opportunities.length > 0 ? `Toplam Değer: ${opportunities.reduce((sum, opp) => sum + Number(opp.value), 0).toLocaleString('tr-TR')} TL` : undefined}
          footer={
            <div className="flex justify-end">
              <Link
                href={`/opportunities/new?company=${id}`}
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
              <p className="text-gray-500 mb-4">Bu firmaya henüz satış fırsatı eklenmemiş</p>
              <Link
                href={`/opportunities/new?company=${id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Fırsat Ekle
              </Link>
            </div>
          )}
        </Card>
      </div>
    </AppWrapper>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import { getCompanies } from '@/services/companyService';
import { getContacts } from '@/services/contactService';
import { CompanyList, Contact } from '@/types/customer';
import Link from 'next/link';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  LifebuoyIcon,
  ArrowTrendingUpIcon,
  StarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [companiesData, contactsData] = await Promise.all([
          getCompanies(),
          getContacts()
        ]);
        
        setCompanies(companiesData.slice(0, 5)); // Son 5 şirket
        setContacts(contactsData.slice(0, 5)); // Son 5 kişi
      } catch (err) {
        console.error('Dashboard verileri yüklenirken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { 
      title: 'Toplam Firma', 
      value: companies.length,
      icon: BuildingOfficeIcon, 
      color: 'bg-blue-100 text-blue-800',
      href: '/companies'
    },
    { 
      title: 'Toplam Kişi', 
      value: contacts.length,
      icon: UsersIcon, 
      color: 'bg-green-100 text-green-800',
      href: '/contacts'
    },
    { 
      title: 'Açık Fırsatlar', 
      value: '0',
      icon: LifebuoyIcon, 
      color: 'bg-amber-100 text-amber-800',
      href: '/opportunities'
    },
    { 
      title: 'Bu Ay Kazanılan', 
      value: '0 ₺',
      icon: ArrowTrendingUpIcon, 
      color: 'bg-emerald-100 text-emerald-800',
      href: '/opportunities?status=won'
    },
  ];

  if (error) {
    return (
      <AppWrapper>
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </button>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <PageHeader 
        title="Dashboard" 
        subtitle="CRM sisteminize genel bakış"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href} className="group">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold group-hover:text-indigo-600 transition-colors">
                    {isLoading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Son Firmalar */}
        <Card title="Son Eklenen Firmalar">
          {isLoading ? (
            <div className="animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-3 border-b border-gray-100">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 mt-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>Henüz firma bulunmuyor</p>
              <Link href="/companies/new" className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium inline-block">
                Yeni Firma Ekle
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {companies.map(company => (
                <li key={company.id} className="py-3">
                  <Link href={`/companies/${company.id}`} className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{company.name}</p>
                          <p className="text-xs text-gray-500">{company.industry || 'Sektör belirtilmemiş'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {company.phone && (
                          <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                        {company.email && (
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <Link href="/companies" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Tüm Firmaları Görüntüle →
            </Link>
          </div>
        </Card>

        {/* Son Kişiler */}
        <Card title="Son Eklenen Kişiler">
          {isLoading ? (
            <div className="animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="py-3 border-b border-gray-100">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 mt-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <p>Henüz kişi bulunmuyor</p>
              <Link href="/contacts/new" className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium inline-block">
                Yeni Kişi Ekle
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {contacts.map(contact => (
                <li key={contact.id} className="py-3">
                  <Link href={`/contacts/${contact.id}`} className="group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UsersIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                            {contact.first_name} {contact.last_name}
                            {contact.is_primary && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Ana Kişi
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {contact.company_name || ''}
                            {contact.position && contact.company_name && ' - '}
                            {contact.position || ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.phone && (
                          <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                        {contact.email && (
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 text-right">
            <Link href="/contacts" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Tüm Kişileri Görüntüle →
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Önemli Fırsatlar */}
        <Card title="Önemli Fırsatlar">
          <div className="text-center py-6 text-gray-500">
            <LifebuoyIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2">Henüz takip edilen fırsat bulunmuyor</p>
            <Link href="/opportunities/new" className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium inline-block">
              Yeni Fırsat Ekle
            </Link>
          </div>
        </Card>

        {/* Onaylanacak İşlemler */}
        <Card title="Onaylanacak İşlemler">
          <div className="text-center py-6 text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2">Onaylanacak işlem bulunmuyor</p>
          </div>
        </Card>

        {/* Favoriler */}
        <Card title="Favoriler">
          <div className="text-center py-6 text-gray-500">
            <StarIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2">Henüz favori öğe eklenmedi</p>
          </div>
        </Card>
      </div>
    </AppWrapper>
  );
}

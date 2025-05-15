'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import Link from 'next/link';
import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  ChevronRightIcon,
  LifebuoyIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { getOpportunitiesKanban } from '@/services/opportunityService';
import { KanbanColumn } from '@/types/opportunities';

export default function Opportunities() {
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        const kanbanData = await getOpportunitiesKanban();
        setColumns(kanbanData);
        setError(null);
      } catch (err) {
        console.error('Fırsatlar yüklenirken hata:', err);
        setError('Fırsatlar yüklenirken bir sorun oluştu.');
        // Don't use mock data as fallback as it doesn't match the required type
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Fallback mock data in case the API fails
  const mockColumns = [
    {
      status_id: 1,
      status_name: 'Yeni Fırsat',
      status_color: '#6366F1',
      count: 2,
      total_value: 25000,
      opportunities: [
        {
          id: 101,
          title: 'CRM Yazılım Satışı',
          company_name: 'ABC Teknoloji',
          value: 15000,
          priority: 'high',
          expected_close_date: '2023-06-30'
        },
        {
          id: 102,
          title: 'Web Sitesi Yenileme',
          company_name: 'XYZ Market',
          value: 10000,
          priority: 'medium',
          expected_close_date: '2023-07-15'
        }
      ]
    },
    {
      status_id: 2,
      status_name: 'Tekliflendirildi',
      status_color: '#F59E0B',
      count: 1,
      total_value: 45000,
      opportunities: [
        {
          id: 103,
          title: 'E-ticaret Entegrasyonu',
          company_name: 'MNO Mağazaları',
          value: 45000,
          priority: 'critical',
          expected_close_date: '2023-06-20'
        }
      ]
    },
    {
      status_id: 3,
      status_name: 'Müzakere',
      status_color: '#8B5CF6',
      count: 1,
      total_value: 30000,
      opportunities: [
        {
          id: 104,
          title: 'Yönetim Danışmanlığı',
          company_name: 'PQR Holding',
          value: 30000,
          priority: 'high',
          expected_close_date: '2023-06-25'
        }
      ]
    },
    {
      status_id: 4,
      status_name: 'Kazanıldı',
      status_color: '#10B981',
      count: 0,
      total_value: 0,
      opportunities: []
    }
  ];

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
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClasses[priority as keyof typeof badgeClasses]}`}>
        {priorityText[priority as keyof typeof priorityText]}
      </span>
    );
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Satış Fırsatları" 
        subtitle="Tüm satış fırsatlarınızı yönetin ve takip edin"
        actionButton={
          <Link 
            href="/opportunities/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Yeni Fırsat
          </Link>
        }
      />

      <div className="flex justify-between items-center mt-6">
        <div className="flex space-x-3">
          <button 
            onClick={() => setViewType('kanban')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              viewType === 'kanban' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Kanban Görünümü
          </button>
          <button 
            onClick={() => setViewType('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              viewType === 'list' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Liste Görünümü
          </button>
        </div>
        <div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FunnelIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
            Filtrele
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mt-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* Kanban Görünümü */}
      {viewType === 'kanban' && (
        <div className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded-md mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(2)].map((_, cardIndex) => (
                      <div key={cardIndex} className="bg-white shadow rounded-lg p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="flex justify-between">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {columns.map(column => (
                <div key={column.status_id} className="flex flex-col">
                  <div 
                    className="mb-2 px-4 py-2 rounded-md text-white font-medium text-sm flex justify-between items-center"
                    style={{ backgroundColor: column.status_color }}
                  >
                    <span>{column.status_name}</span>
                    <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-md text-xs">
                      {column.count} / {formatCurrency(column.total_value)}
                    </span>
                  </div>

                  <div className="space-y-3 flex-grow">
                    {column.opportunities.map(opportunity => (
                      <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`}>
                        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {opportunity.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {opportunity.company_name}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(opportunity.value)}
                            </div>
                            <div>
                              {getPriorityBadge(opportunity.priority)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Kapanış: {new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR')}
                          </div>
                        </Card>
                      </Link>
                    ))}
                    {column.opportunities.length === 0 && (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-md p-4 text-center">
                        <p className="text-sm text-gray-500">Fırsat bulunmuyor</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Link
                      href={`/opportunities/new?status=${column.status_id}`}
                      className="w-full flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Fırsat Ekle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste Görünümü */}
      {viewType === 'list' && (
        <div className="mt-4">
          <Card>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-6 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fırsat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Firma
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Değer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öncelik
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kapanış Tarihi
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Detay</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {columns.flatMap(column => column.opportunities).map((opportunity) => (
                      <tr key={opportunity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{opportunity.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{opportunity.company_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium text-white"
                            style={{ backgroundColor: columns.find(c => 
                              c.opportunities.some(o => o.id === opportunity.id))?.status_color 
                            }}
                          >
                            {columns.find(c => c.opportunities.some(o => o.id === opportunity.id))?.status_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(opportunity.value)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(opportunity.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(opportunity.expected_close_date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/opportunities/${opportunity.id}`} className="text-indigo-600 hover:text-indigo-900">
                            <ChevronRightIcon className="h-5 w-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {columns.flatMap(column => column.opportunities).length === 0 && !isLoading && (
              <div className="text-center py-8">
                <LifebuoyIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Fırsat bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz satış fırsatı oluşturulmamış.</p>
                <div className="mt-6">
                  <Link
                    href="/opportunities/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Yeni Fırsat
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </AppWrapper>
  );
}

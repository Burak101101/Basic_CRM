'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import CompanyCard from '@/components/customers/CompanyCard';
import { getCompanies, searchCompanies } from '@/services/companyService';
import { CompanyList } from '@/types/customer';
import Link from 'next/link';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        const data = await getCompanies();
        setCompanies(data);
      } catch (err) {
        console.error('Firmalar yüklenirken hata:', err);
        setError('Firmalar yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      const data = await getCompanies();
      setCompanies(data);
      return;
    }

    try {
      setIsLoading(true);
      const results = await searchCompanies(searchTerm);
      setCompanies(results);
    } catch (err) {
      console.error('Firma araması yapılırken hata:', err);
      setError('Arama yapılırken bir sorun oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="Firmalar" 
        subtitle="Tüm müşteri firmalarınızı yönetin"
        actionButton={
          <Link 
            href="/companies/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Yeni Firma
          </Link>
        }
      />

      <div className="mt-4">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Firma adı, sektör, telefon veya email ile arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ara
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md mb-6">
            <p>{error}</p>
            <button 
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
              onClick={() => window.location.reload()}
            >
              Yeniden Dene
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="mt-4 border-t pt-4">
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Firma bulunamadı</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 
                `"${searchTerm}" ile ilgili firma bulunamadı.` : 
                'Henüz firma bulunmuyor. Yeni bir firma ekleyebilirsiniz.'}
            </p>
            <Link
              href="/companies/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Yeni Firma Ekle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(company => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </AppWrapper>
  );
}

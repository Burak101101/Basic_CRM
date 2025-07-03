'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BuildingOfficeIcon, PhoneIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CompanyList } from '@/types/customer';

interface CompanyCardProps {
  company: CompanyList;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/companies/${company.id}`)}
      className="cursor-pointer block group"
    >
      <div className="bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">{company.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {company.industry && <span>{company.industry}</span>}
                {company.industry && company.company_size_display && <span>•</span>}
                {company.company_size_display && <span>{company.company_size_display}</span>}
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {company.contact_count} kişi
          </span>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              {company.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                  <span className="truncate">{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>

            {/* Web Linkleri */}
            {(company.linkedin_url || company.website_url) && (
              <div className="flex items-center space-x-2 text-sm">
                {company.linkedin_url && (
                  <a
                    href={company.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    LinkedIn
                  </a>
                )}
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    <GlobeAltIcon className="h-3 w-3 mr-1" />
                    Website
                  </a>
                )}
              </div>
            )}

            {/* İletişim Butonları */}
            {(company.email || company.phone) && (
              <div className="flex items-center space-x-2 pt-2">
                {company.email && (
                  <Link
                    href={`/communications/compose?company=${company.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    E-posta
                  </Link>
                )}
                {company.phone && (
                  <a
                    href={`https://wa.me/${company.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

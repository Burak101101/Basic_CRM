import Link from 'next/link';
import { BuildingOfficeIcon, UserIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { CompanyList } from '@/types/customer';

interface CompanyCardProps {
  company: CompanyList;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Link 
      href={`/companies/${company.id}`} 
      className="block group"
    >
      <div className="bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">{company.name}</h3>
              {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {company.contact_count} kişi
          </span>
        </div>
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-2 px-4 py-3 gap-2 text-sm text-gray-600">
            {company.email && (
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                <span>{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                <span>{company.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

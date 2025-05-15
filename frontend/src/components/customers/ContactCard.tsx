import Link from 'next/link';
import { Contact } from '@/types/customer';
import { UserIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface ContactCardProps {
  contact: Contact;
  hideCompany?: boolean;
}

export default function ContactCard({ contact, hideCompany = false }: ContactCardProps) {
  return (
    <Link 
      href={`/contacts/${contact.id}`} 
      className="block group"
    >
      <div className="bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-300">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-500" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600">
                {contact.first_name} {contact.last_name}
                {contact.is_primary && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Ana Kişi
                  </span>
                )}
              </h3>
              {contact.position && <p className="text-sm text-gray-500">{contact.position}</p>}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-1 gap-2 px-4 py-3">
            {!hideCompany && contact.company_name && (
              <div className="flex items-center text-sm text-gray-600">
                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                <span>{contact.company_name}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

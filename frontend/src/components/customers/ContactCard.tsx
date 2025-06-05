import Link from 'next/link';
import { Contact } from '@/types/customer';
import { UserIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

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
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {contact.position && <span>{contact.position}</span>}
                {contact.position && contact.lead_status_display && <span>•</span>}
                {contact.lead_status_display && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    contact.lead_status === 'closed_won' ? 'bg-green-100 text-green-800' :
                    contact.lead_status === 'closed_lost' ? 'bg-red-100 text-red-800' :
                    contact.lead_status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.lead_status_display}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 gap-2">
              {!hideCompany && contact.company_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                  <span>{contact.company_name}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" aria-hidden="true" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>

            {/* Lead Kaynağı */}
            {contact.lead_source_display && (
              <div className="text-xs text-gray-500">
                Kaynak: {contact.lead_source_display}
              </div>
            )}

            {/* Web Linkleri */}
            {(contact.linkedin_url || contact.personal_website) && (
              <div className="flex items-center space-x-2 text-sm">
                {contact.linkedin_url && (
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
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
            {(contact.email || contact.phone) && (
              <div className="flex items-center space-x-2 pt-2">
                {contact.email && (
                  <Link
                    href={`/communications/new?contact=${contact.id}&email=${contact.email}&name=${encodeURIComponent(contact.first_name + ' ' + contact.last_name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <EnvelopeIcon className="h-3 w-3 mr-1" />
                    E-posta
                  </Link>
                )}
                {contact.phone && (
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
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
    </Link>
  );
}

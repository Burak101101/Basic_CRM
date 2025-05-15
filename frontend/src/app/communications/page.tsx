'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import Link from 'next/link';
import TestEmailViewer from '@/components/communications/TestEmailViewer';
import { useSearchParams } from 'next/navigation';
import { getEmailTemplates } from '@/services/communicationService';
import { EmailTemplate } from '@/types/communications';
import { 
  PlusIcon, 
  EnvelopeIcon, 
  EnvelopeOpenIcon,
  PaperAirplaneIcon,
  ArchiveBoxIcon,
  ClockIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

export default function Communications() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
    // E-posta şablonlarını yükleme
  useEffect(() => {
    const fetchTemplates = async () => {
      if (activeTab === 'templates') {
        try {
          setIsLoading(true);
          console.log('Şablonlar yükleniyor...');
          const data = await getEmailTemplates();
          console.log('Yüklenen şablonlar:', data);
          setTemplates(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Şablonlar yüklenirken hata:', err);
          setLoadError('Şablonlar yüklenirken bir sorun oluştu.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchTemplates();
  }, [activeTab]);

  // Mock emails for demonstration
  const mockEmails = [
    {
      id: 1,
      subject: 'CRM Yazılım Teklifi',
      content: 'Sayın yetkililer, İstediğiniz CRM yazılım teklifi ekte sunulmuştur. İncelemenizi rica ederiz.',
      sender: 'mehmet.yilmaz@sadecrcrm.com',
      recipients: [{ email: 'ali.veli@abcteknoloji.com', name: 'Ali Veli' }],
      status: 'sent',
      company_name: 'ABC Teknoloji',
      contact_name: 'Ali Veli',
      created_at: '2023-05-20T14:30:00',
      sent_at: '2023-05-20T14:30:00',
    },
    {
      id: 2,
      subject: 'E-ticaret Entegrasyon Bilgileri',
      content: 'Merhaba, İstediğiniz e-ticaret entegrasyonu için gerekli bilgileri paylaşıyorum.',
      sender: 'mehmet.yilmaz@sadecrcrm.com',
      recipients: [{ email: 'ayse.kaya@mnomagazalari.com', name: 'Ayşe Kaya' }],
      status: 'sent',
      company_name: 'MNO Mağazaları',
      contact_name: 'Ayşe Kaya',
      created_at: '2023-05-18T11:15:00',
      sent_at: '2023-05-18T11:15:00',
    },
    {
      id: 3,
      subject: 'Toplantı Hatırlatması',
      content: 'Yarınki saat 14:00\'teki toplantımızı hatırlatmak isteriz.',
      sender: 'mehmet.yilmaz@sadecrcrm.com',
      recipients: [{ email: 'mustafa.demir@xymarket.com', name: 'Mustafa Demir' }],
      status: 'draft',
      company_name: 'XYZ Market',
      contact_name: 'Mustafa Demir',
      created_at: '2023-05-17T16:45:00',
    },
    {
      id: 4,
      subject: 'İş Birliği Önerisi',
      content: 'Firmalarımız arasında olası iş birliği için görüşmek istediğimizi bildirmek isteriz.',
      sender: 'mehmet.yilmaz@sadecrcrm.com',
      recipients: [{ email: 'canan.yildiz@pqrholding.com', name: 'Canan Yıldız' }],
      status: 'failed',
      error_message: 'E-posta adresi bulunamadı.',
      company_name: 'PQR Holding',
      contact_name: 'Canan Yıldız',
      created_at: '2023-05-15T09:20:00',
    },
    {
      id: 5,
      subject: 'Ürün Demo Talebi Hakkında',
      content: 'Demo talebiniz için teşekkür ederiz. Uygun olduğunuz tarih ve saati paylaşırsanız organizasyon yapabiliriz.',
      sender: 'mehmet.yilmaz@sadecrcrm.com',
      recipients: [{ email: 'kemal.ozturk@deffirma.com', name: 'Kemal Öztürk' }],
      status: 'sending',
      company_name: 'DEF Firma',
      contact_name: 'Kemal Öztürk',
      created_at: '2023-05-22T08:10:00',
    }
  ];

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
    
  // Set the active tab based on the URL parameter
  useEffect(() => {
    if (tabParam === 'inbox' || tabParam === 'sent' || tabParam === 'drafts' || tabParam === 'templates' || tabParam === 'test') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Filters for sent, draft, and failed emails
  const sentEmails = mockEmails.filter(email => email.status === 'sent');
  const draftEmails = mockEmails.filter(email => email.status === 'draft');

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      sent: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      sending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      sent: 'Gönderildi',
      draft: 'Taslak',
      sending: 'Gönderiliyor',
      failed: 'Başarısız'
    };

    const statusIcon = {
      sent: <PaperAirplaneIcon className="h-4 w-4 mr-1" />,
      draft: <ArchiveBoxIcon className="h-4 w-4 mr-1" />,
      sending: <ClockIcon className="h-4 w-4 mr-1" />,
      failed: <ExclamationCircleIcon className="h-4 w-4 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClasses[status as keyof typeof badgeClasses]}`}>
        {statusIcon[status as keyof typeof statusIcon]}
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };

  return (
    <AppWrapper>
      <PageHeader 
        title="İletişim" 
        subtitle="E-posta iletişimi ve şablonlarını yönetin"
        actionButton={
          <div className="flex space-x-2">
            <Link 
              href="/communications/templates"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Cog6ToothIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Şablonlar
            </Link>
            <Link 
              href="/communications/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Yeni E-posta
            </Link>
          </div>
        }
      />

      <div className="bg-white border-b border-gray-200 mt-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          {[
            { name: 'Gelen Kutusu', value: 'inbox', icon: EnvelopeIcon, count: 0 },
            { name: 'Gönderilmiş', value: 'sent', icon: PaperAirplaneIcon, count: sentEmails.length },
            { name: 'Taslaklar', value: 'drafts', icon: ArchiveBoxIcon, count: draftEmails.length },
            { name: 'Şablonlar', value: 'templates', icon: EnvelopeOpenIcon, count: 3 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`${
                activeTab === tab.value
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex justify-center items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.value ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'inbox' && (
          <Card>
            <div className="text-center py-8">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Gelen kutusu henüz kurulmadı</h3>
              <p className="mt-1 text-sm text-gray-500">
                E-posta alma özelliği yakında kullanıma sunulacak.
              </p>
            </div>
          </Card>
        )}

        {activeTab === 'sent' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alıcı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firma
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(email.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {email.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {email.recipients[0].name} ({email.recipients[0].email})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{email.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(email.sent_at || email.created_at).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mockEmails.length === 0 && (
              <div className="text-center py-8">
                <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">E-posta bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz gönderilmiş e-posta bulunmuyor.</p>
                <div className="mt-6">
                  <Link
                    href="/communications/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Yeni E-posta
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'drafts' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alıcı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firma
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oluşturulma
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {draftEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {email.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {email.recipients[0].name} ({email.recipients[0].email})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{email.company_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(email.created_at).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {draftEmails.length === 0 && (
              <div className="text-center py-8">
                <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Taslak bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz taslak olarak kaydedilmiş e-posta bulunmuyor.</p>
                <div className="mt-6">
                  <Link
                    href="/communications/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Yeni E-posta
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}        {activeTab === 'templates' && (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                    <div className="h-16 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.length > 0 ? templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.subject}</p>
                      </div>
                      <Link 
                        href={`/communications/templates/${template.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Düzenle
                      </Link>
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Değişkenler:</h5>
                      <div className="flex flex-wrap gap-2">
                        {template.variables && Object.keys(template.variables).map(variable => (
                          <span 
                            key={variable} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 pt-2 flex justify-between">
                      <span className="text-sm text-gray-500">
                        Son düzenleme: {new Date(template.updated_at).toLocaleDateString('tr-TR')}
                      </span>
                      <Link 
                        href={`/communications/new?template=${template.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        E-posta Oluştur
                      </Link>
                    </div>
                  </Card>
                )) : (
                  <div className="col-span-3 text-center py-8">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Şablon bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">Henüz hiç e-posta şablonu oluşturulmamış.</p>
                  </div>
                )}
                
                <Card className="border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center hover:border-indigo-500 cursor-pointer transition-colors">
                  <Link 
                    href="/communications/templates/new"
                    className="py-6 flex flex-col items-center"  
                  >
                    <PlusIcon className="h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Yeni Şablon Ekle
                    </span>
                  </Link>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppWrapper>
  );
}

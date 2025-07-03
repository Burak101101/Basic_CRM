'use client';

import { useState, useEffect } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/layout/Card';
import Link from 'next/link';
import TestEmailViewer from '@/components/communications/TestEmailViewer';
import { useSearchParams } from 'next/navigation';
import { getEmailTemplates, getIncomingEmails, fetchEmailsFromIMAP, getIMAPStatus, getSentEmails } from '@/services/communicationService';
import { getCompanies } from '@/services/companyService';
import { getContacts } from '@/services/contactService';
import { getOpportunities } from '@/services/opportunityService';
import { EmailTemplate, IncomingEmail, EmailMessage } from '@/types/communications';
import { CompanyList, Contact } from '@/types/customer';
import { OpportunityList } from '@/types/opportunities';
import EmailDetailModal from '@/components/communications/EmailDetailModal';
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
  const [incomingEmails, setIncomingEmails] = useState<IncomingEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailMessage[]>([]);
  const [companies, setCompanies] = useState<CompanyList[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [imapStatus, setImapStatus] = useState<any>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    company: '',
    contact: '',
    opportunity: ''
  });

  // Modal state'leri
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | IncomingEmail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sent' | 'incoming'>('sent');
    // E-posta şablonlarını ve gelen e-postaları yükleme
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (activeTab === 'templates') {
          console.log('Şablonlar yükleniyor...');
          const data = await getEmailTemplates();
          console.log('Yüklenen şablonlar:', data);
          setTemplates(Array.isArray(data) ? data : []);
        } else if (activeTab === 'inbox') {
          console.log('Gelen e-postalar yükleniyor...');
          const [emailsData, statusData] = await Promise.all([
            getIncomingEmails(),
            getIMAPStatus()
          ]);
          console.log('Yüklenen gelen e-postalar:', emailsData);
          setIncomingEmails(Array.isArray(emailsData) ? emailsData : []);
          setImapStatus(statusData);
        } else if (activeTab === 'sent') {
          console.log('Gönderilen e-postalar yükleniyor...');
          const [emailsData, companiesData, contactsData, opportunitiesData] = await Promise.all([
            getSentEmails(),
            getCompanies(),
            getContacts(),
            getOpportunities()
          ]);
          console.log('Yüklenen gönderilen e-postalar:', emailsData);
          setSentEmails(Array.isArray(emailsData) ? emailsData : []);
          setCompanies(Array.isArray(companiesData) ? companiesData : []);
          setContacts(Array.isArray(contactsData) ? contactsData : []);
          setOpportunities(Array.isArray(opportunitiesData) ? opportunitiesData : []);

        }
      } catch (err) {
        console.error('Veri yüklenirken hata:', err);
        setLoadError('Veriler yüklenirken bir sorun oluştu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const formatRecipients = (recipients: any) => {
    if (!recipients) return 'Alıcı yok';
    
    // String ise parse et
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients);
      } catch (e) {
        return recipients;
      }
    }
    
    // Array ise formatla
    if (Array.isArray(recipients)) {
      return recipients.map((r: any) => r?.email || r).join(', ');
    }
    
    return recipients;
  };


  // Otomatik e-posta tarama (dakikada 1 kez)
  useEffect(() => {
    if (activeTab === 'inbox' && imapStatus?.ready_to_fetch) {
      // İlk yüklemede hemen çek
      fetchEmailsAutomatically();

      // Sonra dakikada 1 kez çek
      const interval = setInterval(() => {
        fetchEmailsAutomatically();
      }, 60000); // 60 saniye = 1 dakika

      return () => clearInterval(interval);
    }
  }, [activeTab, imapStatus]);

  // Filtreleme fonksiyonu
  const handleFilterChange = async (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    if (activeTab === 'sent') {
      try {
        setIsLoading(true);
        const filterParams: any = {};

        if (newFilters.company) filterParams.company = parseInt(newFilters.company);
        if (newFilters.contact) filterParams.contact = parseInt(newFilters.contact);
        if (newFilters.opportunity) filterParams.opportunity = parseInt(newFilters.opportunity);

        const emailsData = await getSentEmails(filterParams);
        setSentEmails(Array.isArray(emailsData) ? emailsData : []);
      } catch (err) {
        console.error('Filtreleme hatası:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filtreleri temizle
  const clearFilters = async () => {
    setFilters({ company: '', contact: '', opportunity: '' });

    if (activeTab === 'sent') {
      try {
        setIsLoading(true);
        const emailsData = await getSentEmails();
        setSentEmails(Array.isArray(emailsData) ? emailsData : []);
      } catch (err) {
        console.error('Filtreleme temizleme hatası:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // E-postaları IMAP'tan al (otomatik tarama için)
  const fetchEmailsAutomatically = async () => {
    try {
      setIsFetching(true);
      console.log('Otomatik IMAP taraması başlatılıyor...');
      const result = await fetchEmailsFromIMAP();
      console.log('IMAP sonucu:', result);

      // Başarılıysa gelen e-postaları yeniden yükle
      if (result.success) {
        const emailsData = await getIncomingEmails();
        setIncomingEmails(Array.isArray(emailsData) ? emailsData : []);
        setLastFetchTime(new Date());
        console.log(`${result.saved_count || 0} yeni e-posta alındı`);
      }
    } catch (err) {
      console.error('Otomatik e-posta alma hatası:', err);
    } finally {
      setIsFetching(false);
    }
  };

  // Modal fonksiyonları
  const openEmailModal = (email: EmailMessage | IncomingEmail, type: 'sent' | 'incoming') => {
    setSelectedEmail(email);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeEmailModal = () => {
    setSelectedEmail(null);
    setIsModalOpen(false);
  };

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

  // Filters for draft and failed emails
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
              href="/communications/compose"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Yeni E-posta gönder
            </Link>
          </div>
        }
      />

      <div className="bg-white border-b border-gray-200 mt-6">
        <nav className="-mb-px flex" aria-label="Tabs">
          {[
            { name: 'Gelen Kutusu', value: 'inbox', icon: EnvelopeIcon, count: incomingEmails.filter(email => email.status === 'unread').length },
            { name: 'Gönderilmiş', value: 'sent', icon: PaperAirplaneIcon, count: sentEmails.length },
            { name: 'Taslaklar', value: 'drafts', icon: ArchiveBoxIcon, count: draftEmails.length },
            { name: 'Şablonlar', value: 'templates', icon: EnvelopeOpenIcon, count: templates.length },
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
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Gelen Kutusu</h3>
              <div className="flex space-x-2">
                {imapStatus && !imapStatus.ready_to_fetch && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                    IMAP ayarları eksik
                  </div>
                )}
                {isFetching && (
                  <div className="inline-flex items-center text-sm text-gray-600">
                    <ClockIcon className="-ml-1 mr-2 h-4 w-4 animate-spin" />
                    E-postalar alınıyor...
                  </div>
                )}
                {lastFetchTime && !isFetching && (
                  <div className="text-sm text-gray-500">
                    Son güncelleme: {lastFetchTime.toLocaleTimeString('tr-TR')}
                  </div>
                )}
              </div>
            </div>

            {incomingEmails.length > 0 ? (
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
                        Gönderen
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
                    {incomingEmails.map((email) => (
                      <tr
                        key={email.id}
                        className={`hover:bg-gray-50 cursor-pointer ${email.status === 'unread' ? 'bg-blue-50' : ''}`}
                        onClick={() => openEmailModal(email, 'incoming')}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            email.status === 'unread'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {email.status === 'unread' ? (
                              <>
                                <EnvelopeIcon className="h-4 w-4 mr-1" />
                                Okunmamış
                              </>
                            ) : (
                              <>
                                <EnvelopeOpenIcon className="h-4 w-4 mr-1" />
                                Okunmuş
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${email.status === 'unread' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} truncate max-w-xs`}>
                            {email.subject}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {email.sender_display}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{email.company_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(email.received_at).toLocaleDateString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {imapStatus && !imapStatus.ready_to_fetch
                    ? 'IMAP ayarları eksik'
                    : 'Gelen e-posta bulunamadı'
                  }
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {imapStatus && !imapStatus.ready_to_fetch
                    ? 'E-posta almak için profil ayarlarınızda IMAP bilgilerini tamamlayın.'
                    : 'Henüz gelen e-posta bulunmuyor. Sistem otomatik olarak dakikada bir kez e-postalarınızı kontrol ediyor.'
                  }
                </p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'sent' && (
          <Card>
            {/* Filtreleme Alanı */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Filtreleme</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="company-filter" className="block text-xs font-medium text-gray-700 mb-1">
                    Firma
                  </label>
                  <select
                    id="company-filter"
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Tüm Firmalar</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-filter" className="block text-xs font-medium text-gray-700 mb-1">
                    Kişi
                  </label>
                  <select
                    id="contact-filter"
                    value={filters.contact}
                    onChange={(e) => handleFilterChange('contact', e.target.value)}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Tüm Kişiler</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="opportunity-filter" className="block text-xs font-medium text-gray-700 mb-1">
                    Fırsat
                  </label>
                  <select
                    id="opportunity-filter"
                    value={filters.opportunity}
                    onChange={(e) => handleFilterChange('opportunity', e.target.value)}
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Tüm Fırsatlar</option>
                    {opportunities.map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.title} - {opportunity.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              </div>
            </div>

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
                      Fırsat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sentEmails.map((email) => (
                    <tr
                      key={email.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openEmailModal(email, 'sent')}
                    >
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
                          {formatRecipients(email.recipients)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{email.company_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{email.opportunity_title || '-'}</div>
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

            {sentEmails.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">E-posta bulunamadı</h3>
                <p className="mt-1 text-sm text-gray-500">Henüz gönderilmiş e-posta bulunmuyor.</p>
                <div className="mt-6">
                  <Link
                    href="/communications/compose"
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
                    href="/communications/compose"
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
                        href={`/communications/compose?template=${template.id}`}
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

      {/* Email Detail Modal */}
      <EmailDetailModal
        isOpen={isModalOpen}
        onClose={closeEmailModal}
        email={selectedEmail}
        type={modalType}
      />
    </AppWrapper>
  );
}

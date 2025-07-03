from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from customers.models import Company, Contact
from opportunities.models import OpportunityStatus, Opportunity
from communications.models import EmailTemplate
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Gerçek şirket ve kişi verileri ile test verisi oluştur'

    def handle(self, *args, **options):
        self.stdout.write('Test verileri oluşturuluyor...')
        
        # Opportunity statuses oluştur
        self.create_opportunity_statuses()
        
        # Test şirketleri oluştur
        companies = self.create_companies()
        
        # Her şirket için kişiler oluştur
        for company in companies:
            self.create_contacts_for_company(company)
        
        # Bazı fırsatlar oluştur
        self.create_opportunities()
        
        # E-posta şablonları oluştur
        self.create_email_templates()
        
        self.stdout.write(
            self.style.SUCCESS('Test verileri başarıyla oluşturuldu!')
        )

    def create_opportunity_statuses(self):
        """Fırsat durumları oluştur"""
        statuses = [
            {'name': 'İlk Görüşme', 'color': '#3B82F6', 'order': 1, 'is_default': True},
            {'name': 'İhtiyaç Analizi', 'color': '#8B5CF6', 'order': 2},
            {'name': 'Teklif Hazırlama', 'color': '#F59E0B', 'order': 3},
            {'name': 'Teklif Sunuldu', 'color': '#EF4444', 'order': 4},
            {'name': 'Müzakere', 'color': '#F97316', 'order': 5},
            {'name': 'Kazanıldı', 'color': '#10B981', 'order': 6, 'is_won': True},
            {'name': 'Kaybedildi', 'color': '#6B7280', 'order': 7, 'is_lost': True},
        ]
        
        for status_data in statuses:
            status, created = OpportunityStatus.objects.get_or_create(
                name=status_data['name'],
                defaults=status_data
            )
            if created:
                self.stdout.write(f'Durum oluşturuldu: {status.name}')

    def create_companies(self):
        """Gerçek Türk şirketleri oluştur"""
        companies_data = [
            {
                'name': 'Türk Telekom A.Ş.',
                'industry': 'Telekomünikasyon',
                'company_size': 'enterprise',
                'address': 'Turgut Özal Bulvarı No:06 Akyurt/Ankara',
                'phone': '+90 444 1 444',
                'email': 'info@turktelekom.com.tr',
                'website_url': 'https://www.turktelekom.com.tr',
                'linkedin_url': 'https://www.linkedin.com/company/turk-telekom',
                'tax_number': '1234567890'
            },
            {
                'name': 'Garanti BBVA',
                'industry': 'Bankacılık ve Finans',
                'company_size': 'enterprise',
                'address': 'Levent Nispetiye Cad. Akmerkez B3 Blok Beşiktaş/İstanbul',
                'phone': '+90 444 0 333',
                'email': 'info@garantibbva.com.tr',
                'website_url': 'https://www.garantibbva.com.tr',
                'linkedin_url': 'https://www.linkedin.com/company/garanti-bbva',
                'tax_number': '2345678901'
            },
            {
                'name': 'Arçelik A.Ş.',
                'industry': 'Beyaz Eşya ve Elektronik',
                'company_size': 'large',
                'address': 'Karaağaç Cad. No:2-6 Sütlüce Beyoğlu/İstanbul',
                'phone': '+90 212 314 34 34',
                'email': 'info@arcelik.com',
                'website_url': 'https://www.arcelik.com.tr',
                'linkedin_url': 'https://www.linkedin.com/company/arcelik',
                'tax_number': '3456789012'
            },
            {
                'name': 'Migros Ticaret A.Ş.',
                'industry': 'Perakende',
                'company_size': 'large',
                'address': 'Atatürk Cad. Ertuğrul Gazi Sok. No:6 Ataşehir/İstanbul',
                'phone': '+90 444 10 01',
                'email': 'info@migros.com.tr',
                'website_url': 'https://www.migros.com.tr',
                'linkedin_url': 'https://www.linkedin.com/company/migros',
                'tax_number': '4567890123'
            },
            {
                'name': 'Anadolu Efes',
                'industry': 'İçecek ve Gıda',
                'company_size': 'large',
                'address': 'Fatih Sultan Mehmet Mah. Balkan Cad. No:58 Ümraniye/İstanbul',
                'phone': '+90 216 586 80 00',
                'email': 'info@anadoluefes.com',
                'website_url': 'https://www.anadoluefes.com',
                'linkedin_url': 'https://www.linkedin.com/company/anadolu-efes',
                'tax_number': '5678901234'
            },
            {
                'name': 'Teknoloji Çözümleri Ltd.',
                'industry': 'Bilgi Teknolojileri',
                'company_size': 'medium',
                'address': 'Maslak Mahallesi Büyükdere Cad. No:255 Şişli/İstanbul',
                'phone': '+90 212 345 67 89',
                'email': 'info@teknolojicozu.com',
                'website_url': 'https://www.teknolojicozu.com',
                'linkedin_url': 'https://www.linkedin.com/company/teknoloji-cozumleri',
                'tax_number': '6789012345'
            },
            {
                'name': 'Yeşil Enerji Sistemleri',
                'industry': 'Yenilenebilir Enerji',
                'company_size': 'medium',
                'address': 'Ostim OSB Mah. 1377. Sok. No:12 Yenimahalle/Ankara',
                'phone': '+90 312 987 65 43',
                'email': 'info@yesilenerji.com.tr',
                'website_url': 'https://www.yesilenerji.com.tr',
                'linkedin_url': 'https://www.linkedin.com/company/yesil-enerji',
                'tax_number': '7890123456'
            },
            {
                'name': 'Kreatif Ajans',
                'industry': 'Reklam ve Pazarlama',
                'company_size': 'small',
                'address': 'Bağdat Cad. No:145/3 Kadıköy/İstanbul',
                'phone': '+90 216 456 78 90',
                'email': 'hello@kreatifjans.com',
                'website_url': 'https://www.kreatifjans.com',
                'linkedin_url': 'https://www.linkedin.com/company/kreatif-ajans',
                'tax_number': '8901234567'
            }
        ]
        
        companies = []
        for company_data in companies_data:
            company, created = Company.objects.get_or_create(
                name=company_data['name'],
                defaults=company_data
            )
            companies.append(company)
            if created:
                self.stdout.write(f'Şirket oluşturuldu: {company.name}')
        
        return companies

    def create_contacts_for_company(self, company):
        """Her şirket için gerçekçi kişiler oluştur"""
        contacts_data = {
            'Türk Telekom A.Ş.': [
                {'first_name': 'Mehmet', 'last_name': 'Yılmaz', 'position': 'Genel Müdür', 'email': 'mehmet.yilmaz@turktelekom.com.tr', 'phone': '+90 532 123 45 67'},
                {'first_name': 'Ayşe', 'last_name': 'Kaya', 'position': 'Satış Müdürü', 'email': 'ayse.kaya@turktelekom.com.tr', 'phone': '+90 533 234 56 78'},
                {'first_name': 'Can', 'last_name': 'Özkan', 'position': 'Teknik Müdür', 'email': 'can.ozkan@turktelekom.com.tr', 'phone': '+90 534 345 67 89'},
            ],
            'Garanti BBVA': [
                {'first_name': 'Zeynep', 'last_name': 'Demir', 'position': 'Şube Müdürü', 'email': 'zeynep.demir@garantibbva.com.tr', 'phone': '+90 535 456 78 90'},
                {'first_name': 'Emre', 'last_name': 'Çelik', 'position': 'Kurumsal Satış Uzmanı', 'email': 'emre.celik@garantibbva.com.tr', 'phone': '+90 536 567 89 01'},
            ],
            'Arçelik A.Ş.': [
                {'first_name': 'Fatma', 'last_name': 'Şahin', 'position': 'Pazarlama Müdürü', 'email': 'fatma.sahin@arcelik.com', 'phone': '+90 537 678 90 12'},
                {'first_name': 'Burak', 'last_name': 'Arslan', 'position': 'Satın Alma Uzmanı', 'email': 'burak.arslan@arcelik.com', 'phone': '+90 538 789 01 23'},
            ],
            'Migros Ticaret A.Ş.': [
                {'first_name': 'Selin', 'last_name': 'Koç', 'position': 'Operasyon Müdürü', 'email': 'selin.koc@migros.com.tr', 'phone': '+90 539 890 12 34'},
                {'first_name': 'Oğuz', 'last_name': 'Yıldız', 'position': 'IT Müdürü', 'email': 'oguz.yildiz@migros.com.tr', 'phone': '+90 530 901 23 45'},
            ],
            'Anadolu Efes': [
                {'first_name': 'Deniz', 'last_name': 'Acar', 'position': 'Satış Direktörü', 'email': 'deniz.acar@anadoluefes.com', 'phone': '+90 531 012 34 56'},
                {'first_name': 'Cem', 'last_name': 'Güler', 'position': 'Pazarlama Uzmanı', 'email': 'cem.guler@anadoluefes.com', 'phone': '+90 532 123 45 67'},
            ],
            'Teknoloji Çözümleri Ltd.': [
                {'first_name': 'Elif', 'last_name': 'Öztürk', 'position': 'Kurucu Ortak', 'email': 'elif.ozturk@teknolojicozu.com', 'phone': '+90 533 234 56 78'},
                {'first_name': 'Murat', 'last_name': 'Kılıç', 'position': 'CTO', 'email': 'murat.kilic@teknolojicozu.com', 'phone': '+90 534 345 67 89'},
            ],
            'Yeşil Enerji Sistemleri': [
                {'first_name': 'Gül', 'last_name': 'Erdoğan', 'position': 'Proje Müdürü', 'email': 'gul.erdogan@yesilenerji.com.tr', 'phone': '+90 535 456 78 90'},
                {'first_name': 'Serkan', 'last_name': 'Yavuz', 'position': 'Mühendis', 'email': 'serkan.yavuz@yesilenerji.com.tr', 'phone': '+90 536 567 89 01'},
            ],
            'Kreatif Ajans': [
                {'first_name': 'Pınar', 'last_name': 'Çakır', 'position': 'Kreatif Direktör', 'email': 'pinar.cakir@kreatifjans.com', 'phone': '+90 537 678 90 12'},
                {'first_name': 'Kaan', 'last_name': 'Bulut', 'position': 'Hesap Müdürü', 'email': 'kaan.bulut@kreatifjans.com', 'phone': '+90 538 789 01 23'},
            ]
        }
        
        if company.name in contacts_data:
            for contact_data in contacts_data[company.name]:
                contact_data['company'] = company
                contact, created = Contact.objects.get_or_create(
                    email=contact_data['email'],
                    defaults=contact_data
                )
                if created:
                    self.stdout.write(f'Kişi oluşturuldu: {contact.first_name} {contact.last_name} - {company.name}')

    def create_opportunities(self):
        """Örnek fırsatlar oluştur"""
        # Varsayılan kullanıcıyı al veya oluştur
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        companies = Company.objects.all()
        statuses = OpportunityStatus.objects.all()
        
        opportunities_data = [
            {
                'title': 'CRM Yazılım Projesi',
                'description': 'Şirket genelinde kullanılacak CRM yazılımı geliştirme ve implementasyon projesi',
                'value': 250000,
                'priority': 'high',
                'expected_close_date': date.today() + timedelta(days=45)
            },
            {
                'title': 'Mobil Uygulama Geliştirme',
                'description': 'iOS ve Android platformları için mobil uygulama geliştirme',
                'value': 150000,
                'priority': 'medium',
                'expected_close_date': date.today() + timedelta(days=60)
            },
            {
                'title': 'Dijital Dönüşüm Danışmanlığı',
                'description': 'Şirketin dijital dönüşüm sürecinde danışmanlık hizmeti',
                'value': 75000,
                'priority': 'medium',
                'expected_close_date': date.today() + timedelta(days=30)
            },
            {
                'title': 'Bulut Altyapı Migrasyonu',
                'description': 'Mevcut IT altyapısının bulut sistemlerine taşınması',
                'value': 180000,
                'priority': 'high',
                'expected_close_date': date.today() + timedelta(days=90)
            },
            {
                'title': 'E-ticaret Platformu',
                'description': 'Online satış kanalı için e-ticaret platformu kurulumu',
                'value': 120000,
                'priority': 'medium',
                'expected_close_date': date.today() + timedelta(days=75)
            }
        ]
        
        for i, opp_data in enumerate(opportunities_data):
            if i < len(companies):
                company = companies[i]
                contacts = Contact.objects.filter(company=company)
                
                opp_data.update({
                    'company': company,
                    'status': random.choice(statuses),
                    'assigned_to': user
                })
                
                opportunity, created = Opportunity.objects.get_or_create(
                    title=opp_data['title'],
                    company=company,
                    defaults=opp_data
                )
                
                if created and contacts.exists():
                    # İlk kişiyi fırsata ekle
                    opportunity.contacts.add(contacts.first())
                    self.stdout.write(f'Fırsat oluşturuldu: {opportunity.title} - {company.name}')

    def create_email_templates(self):
        """E-posta şablonları oluştur"""
        templates_data = [
            {
                'name': 'İlk Görüşme Daveti',
                'subject': 'CRM Çözümlerimiz Hakkında Görüşme Talebi',
                'content': '''
                <p>Sayın {ad_soyad},</p>
                <p>Şirketinizin müşteri ilişkileri yönetimi ihtiyaçları doğrultusunda, size özel CRM çözümlerimizi tanıtmak istiyoruz.</p>
                <p>Uygun olduğunuz bir tarihte kısa bir görüşme gerçekleştirerek, {firma_adi} için en uygun çözümleri değerlendirebiliriz.</p>
                <p>Saygılarımla,<br>CRM Satış Ekibi</p>
                '''
            },
            {
                'name': 'Teklif Sunumu',
                'subject': '{firma_adi} için CRM Çözüm Teklifi',
                'content': '''
                <p>Sayın {ad_soyad},</p>
                <p>Görüşmemiz sonrasında hazırladığımız CRM çözüm teklifini ekte bulabilirsiniz.</p>
                <p>Teklifimiz {firma_adi}'nın özel ihtiyaçları doğrultusunda hazırlanmıştır ve aşağıdaki özellikleri içermektedir:</p>
                <ul>
                    <li>Müşteri veri yönetimi</li>
                    <li>Satış süreç otomasyonu</li>
                    <li>Raporlama ve analitik</li>
                    <li>Mobil erişim</li>
                </ul>
                <p>Herhangi bir sorunuz olması durumunda benimle iletişime geçebilirsiniz.</p>
                <p>Saygılarımla,<br>CRM Satış Ekibi</p>
                '''
            },
            {
                'name': 'Takip E-postası',
                'subject': 'CRM Teklifi Takibi - {firma_adi}',
                'content': '''
                <p>Sayın {ad_soyad},</p>
                <p>Geçtiğimiz hafta gönderdiğimiz CRM çözüm teklifi hakkında görüşlerinizi almak istiyoruz.</p>
                <p>Teklifimizle ilgili herhangi bir sorunuz varsa veya ek bilgiye ihtiyacınız olursa, lütfen benimle iletişime geçin.</p>
                <p>Size en uygun çözümü sunabilmek için buradayız.</p>
                <p>Saygılarımla,<br>CRM Satış Ekibi</p>
                '''
            }
        ]
        
        for template_data in templates_data:
            template, created = EmailTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                self.stdout.write(f'E-posta şablonu oluşturuldu: {template.name}')

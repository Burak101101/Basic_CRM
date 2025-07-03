import requests
import json
import logging
from typing import Dict, Any, Optional, List
from django.conf import settings
from .models import AIConfiguration, AIRequest
from customers.models import Company, Contact
from opportunities.models import Opportunity
from communications.models import EmailMessage, IncomingEmail
from authentication.models import UserProfile

logger = logging.getLogger(__name__)


class AIService:
    """
    OpenRouter AI servis sınıfı - DeepSeek R1 0528 model entegrasyonu
    """
    
    def __init__(self, config: Optional[AIConfiguration] = None):
        self.config = config
        self._config_loaded = config is not None

    def _ensure_config(self):
        """
        Konfigürasyonun yüklendiğinden emin ol
        """
        if not self._config_loaded:
            try:
                self.config = AIConfiguration.objects.filter(is_default=True, is_active=True).first()
                if not self.config:
                    raise ValueError("Aktif AI konfigürasyonu bulunamadı")
                self._config_loaded = True
            except Exception as e:
                raise ValueError(f"AI konfigürasyonu yüklenemedi: {str(e)}")
    
    def _make_api_request(self, messages: List[Dict], max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        OpenRouter API'ye istek gönder
        """
        self._ensure_config()

        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://crm.example.com",  # OpenRouter için gerekli
            "X-Title": "CRM AI Assistant"
        }

        payload = {
            "model": self.config.model_name,
            "messages": messages,
            "max_tokens": max_tokens or self.config.max_tokens,
            "temperature": self.config.temperature,
            "stream": False
        }
        
        try:
            response = requests.post(
                self.config.api_url,
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"OpenRouter API hatası: {str(e)}")
            raise Exception(f"AI servis hatası: {str(e)}")
    
    def _get_user_company_context(self, user) -> str:
        """
        Kullanıcının şirket bilgilerini al
        """
        try:
            profile = user.profile
            context = f"""
Kullanıcı Şirket Bilgileri:
- Şirket Adı: {profile.company_name or 'Belirtilmemiş'}
- Sektör: {profile.company_industry or 'Belirtilmemiş'}
- Pozisyon: {profile.company_position or 'Belirtilmemiş'}
- Şirket Büyüklüğü: {profile.company_size or 'Belirtilmemiş'}
- Web Sitesi: {profile.company_website or 'Belirtilmemiş'}
- Lokasyon: {profile.company_location or 'Belirtilmemiş'}
- Şirket Hakkında: {profile.company_description or 'Belirtilmemiş'}
"""
            return context
        except:
            return "Kullanıcı şirket bilgileri mevcut değil."
    
    def _get_customer_context(self, company_id: Optional[int] = None, contact_id: Optional[int] = None) -> str:
        """
        Müşteri/firma bağlam bilgilerini al
        """
        context = ""
        
        if company_id:
            try:
                company = Company.objects.get(id=company_id)
                context += f"""
Müşteri Firma Bilgileri:
- Firma Adı: {company.name}
- Sektör: {company.industry or 'Belirtilmemiş'}
- Firma Büyüklüğü: {company.get_company_size_display() or 'Belirtilmemiş'}
- Adres: {company.address or 'Belirtilmemiş'}
- Telefon: {company.phone or 'Belirtilmemiş'}
- E-posta: {company.email or 'Belirtilmemiş'}
- Web Sitesi: {company.website_url or 'Belirtilmemiş'}
- LinkedIn: {company.linkedin_url or 'Belirtilmemiş'}
"""
                # Firma kişilerini ekle
                contacts = company.contacts.all()[:5]  # İlk 5 kişi
                if contacts:
                    context += "\nFirma Kişileri:\n"
                    for contact in contacts:
                        context += f"- {contact.first_name} {contact.last_name} ({contact.position or 'Pozisyon belirtilmemiş'})\n"
                        if contact.email:
                            context += f"  E-posta: {contact.email}\n"
                        if contact.phone:
                            context += f"  Telefon: {contact.phone}\n"
                
            except Company.DoesNotExist:
                context += "Firma bilgileri bulunamadı.\n"
        
        if contact_id:
            try:
                contact = Contact.objects.get(id=contact_id)
                context += f"""
İletişim Kişisi Bilgileri:
- Ad Soyad: {contact.first_name} {contact.last_name}
- Pozisyon: {contact.position or 'Belirtilmemiş'}
- E-posta: {contact.email or 'Belirtilmemiş'}
- Telefon: {contact.phone or 'Belirtilmemiş'}
- LinkedIn: {contact.linkedin_url or 'Belirtilmemiş'}
"""
                if contact.company:
                    context += f"- Bağlı Firma: {contact.company.name}\n"
                    
            except Contact.DoesNotExist:
                context += "Kişi bilgileri bulunamadı.\n"
        
        return context
    
    def _get_opportunity_context(self, opportunity_id: Optional[int] = None) -> str:
        """
        Fırsat bağlam bilgilerini al
        """
        if not opportunity_id:
            return ""
        
        try:
            opportunity = Opportunity.objects.get(id=opportunity_id)
            context = f"""
Satış Fırsatı Bilgileri:
- Başlık: {opportunity.title}
- Açıklama: {opportunity.description or 'Açıklama yok'}
- Değer: {opportunity.value:,.2f} TL
- Öncelik: {opportunity.get_priority_display()}
- Durum: {opportunity.status.name}
- Tahmini Kapanış: {opportunity.expected_close_date}
- Sorumlu: {opportunity.assigned_to.get_full_name() if opportunity.assigned_to else 'Atanmamış'}
"""
            
            # İlgili kişileri ekle
            contacts = opportunity.contacts.all()
            if contacts:
                context += "\nİlgili Kişiler:\n"
                for contact in contacts:
                    context += f"- {contact.first_name} {contact.last_name} ({contact.position or 'Pozisyon belirtilmemiş'})\n"
            
            return context
        except Opportunity.DoesNotExist:
            return "Fırsat bilgileri bulunamadı.\n"
    
    def _get_email_history_context(self, company_id: Optional[int] = None, contact_id: Optional[int] = None) -> str:
        """
        E-posta geçmişi bağlam bilgilerini al
        """
        context = ""
        
        # Gönderilen e-postalar
        sent_emails = EmailMessage.objects.filter(
            status='sent'
        )
        if company_id:
            sent_emails = sent_emails.filter(company_id=company_id)
        if contact_id:
            sent_emails = sent_emails.filter(contact_id=contact_id)
        
        sent_emails = sent_emails.order_by('-sent_at')[:3]  # Son 3 e-posta
        
        if sent_emails:
            context += "\nSon Gönderilen E-postalar:\n"
            for email in sent_emails:
                context += f"- Konu: {email.subject}\n"
                context += f"  Tarih: {email.sent_at.strftime('%d.%m.%Y %H:%M') if email.sent_at else 'Bilinmiyor'}\n"
                context += f"  Alıcılar: {', '.join([r.get('email', '') for r in email.recipients])}\n"
        
        # Gelen e-postalar
        incoming_emails = IncomingEmail.objects.all()
        if company_id:
            incoming_emails = incoming_emails.filter(company_id=company_id)
        if contact_id:
            incoming_emails = incoming_emails.filter(contact_id=contact_id)
        
        incoming_emails = incoming_emails.order_by('-received_at')[:3]  # Son 3 e-posta
        
        if incoming_emails:
            context += "\nSon Gelen E-postalar:\n"
            for email in incoming_emails:
                context += f"- Konu: {email.subject}\n"
                context += f"  Gönderen: {email.sender_name or email.sender_email}\n"
                context += f"  Tarih: {email.received_at.strftime('%d.%m.%Y %H:%M')}\n"
        
        return context
    
    def generate_email_content(self, user, subject: str = "", company_id: Optional[int] = None, 
                             contact_id: Optional[int] = None, opportunity_id: Optional[int] = None,
                             additional_context: str = "") -> str:
        """
        E-posta içeriği oluştur
        """
        # Bağlam bilgilerini topla
        user_context = self._get_user_company_context(user)
        customer_context = self._get_customer_context(company_id, contact_id)
        opportunity_context = self._get_opportunity_context(opportunity_id)
        email_history = self._get_email_history_context(company_id, contact_id)
        
        system_prompt = f"""Sen profesyonel bir CRM asistanısın. Türkçe e-posta içeriği oluşturuyorsun.

{user_context}

{customer_context}

{opportunity_context}

{email_history}

Görevin:
1. Verilen bilgileri analiz et
2. Müşteriye uygun, profesyonel ve kişiselleştirilmiş bir e-posta içeriği oluştur
3. İçerik HTML formatında olmalı
4. Müşteri adını ve firma bilgilerini doğru kullan
5. Eğer fırsat bilgisi varsa, bunu e-postada uygun şekilde bahset
6. Profesyonel ama samimi bir ton kullan
7. Türk iş kültürüne uygun nezaket ifadeleri kullan

Ek bağlam: {additional_context}
"""
        
        user_prompt = f"""
Konu: {subject or 'Genel İletişim'}

Yukarıdaki bilgileri kullanarak profesyonel bir e-posta içeriği oluştur. E-posta HTML formatında olmalı ve doğrudan kullanılabilir olmalı.
"""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = self._make_api_request(messages)
            content = response['choices'][0]['message']['content']
            
            # AI isteğini kaydet
            ai_request = AIRequest.objects.create(
                user=user,
                request_type='email_compose',
                status='completed',
                input_data={
                    'subject': subject,
                    'company_id': company_id,
                    'contact_id': contact_id,
                    'opportunity_id': opportunity_id,
                    'additional_context': additional_context
                },
                context_data={
                    'user_context': user_context,
                    'customer_context': customer_context,
                    'opportunity_context': opportunity_context
                },
                ai_response=content,
                response_metadata=response,
                company_id=company_id,
                contact_id=contact_id,
                opportunity_id=opportunity_id
            )
            
            return content
            
        except Exception as e:
            # Hata durumunda AI isteğini kaydet
            AIRequest.objects.create(
                user=user,
                request_type='email_compose',
                status='failed',
                input_data={
                    'subject': subject,
                    'company_id': company_id,
                    'contact_id': contact_id,
                    'opportunity_id': opportunity_id,
                    'additional_context': additional_context
                },
                error_message=str(e),
                company_id=company_id,
                contact_id=contact_id,
                opportunity_id=opportunity_id
            )
            raise e


    def generate_email_reply(self, user, incoming_email_id: int, additional_context: str = "") -> str:
        """
        Gelen e-postaya yanıt oluştur
        """
        try:
            incoming_email = IncomingEmail.objects.get(id=incoming_email_id)
        except IncomingEmail.DoesNotExist:
            raise ValueError("Gelen e-posta bulunamadı")

        # Bağlam bilgilerini topla
        user_context = self._get_user_company_context(user)
        customer_context = self._get_customer_context(incoming_email.company_id, incoming_email.contact_id)
        email_history = self._get_email_history_context(incoming_email.company_id, incoming_email.contact_id)

        system_prompt = f"""Sen profesyonel bir CRM asistanısın. Gelen e-postalara Türkçe yanıt oluşturuyorsun.

{user_context}

{customer_context}

{email_history}

Görevin:
1. Gelen e-postayı analiz et
2. Uygun, profesyonel ve yardımcı bir yanıt oluştur
3. İçerik HTML formatında olmalı
4. Müşterinin sorusuna/talebine odaklan
5. Gerekirse ek bilgi talep et veya toplantı öner
6. Profesyonel ama samimi bir ton kullan
7. Türk iş kültürüne uygun nezaket ifadeleri kullan

Ek bağlam: {additional_context}
"""

        user_prompt = f"""
Gelen E-posta Bilgileri:
Gönderen: {incoming_email.sender_name or incoming_email.sender_email}
Konu: {incoming_email.subject}
İçerik: {incoming_email.content}
Tarih: {incoming_email.received_at.strftime('%d.%m.%Y %H:%M')}

Bu e-postaya uygun bir yanıt oluştur. Yanıt HTML formatında olmalı ve doğrudan kullanılabilir olmalı.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            response = self._make_api_request(messages)
            content = response['choices'][0]['message']['content']

            # AI isteğini kaydet
            ai_request = AIRequest.objects.create(
                user=user,
                request_type='email_reply',
                status='completed',
                input_data={
                    'incoming_email_id': incoming_email_id,
                    'additional_context': additional_context
                },
                context_data={
                    'user_context': user_context,
                    'customer_context': customer_context,
                    'incoming_email': {
                        'subject': incoming_email.subject,
                        'sender': incoming_email.sender_email,
                        'content': incoming_email.content[:500]  # İlk 500 karakter
                    }
                },
                ai_response=content,
                response_metadata=response,
                company_id=incoming_email.company_id,
                contact_id=incoming_email.contact_id,
                email_id=incoming_email_id
            )

            return content

        except Exception as e:
            # Hata durumunda AI isteğini kaydet
            AIRequest.objects.create(
                user=user,
                request_type='email_reply',
                status='failed',
                input_data={
                    'incoming_email_id': incoming_email_id,
                    'additional_context': additional_context
                },
                error_message=str(e),
                company_id=incoming_email.company_id,
                contact_id=incoming_email.contact_id,
                email_id=incoming_email_id
            )
            raise e

    def generate_opportunity_proposal(self, user, company_id: Optional[int] = None,
                                    contact_id: Optional[int] = None, additional_context: str = "") -> Dict[str, Any]:
        """
        Satış fırsatı önerisi oluştur
        """
        # Bağlam bilgilerini topla
        user_context = self._get_user_company_context(user)
        customer_context = self._get_customer_context(company_id, contact_id)
        email_history = self._get_email_history_context(company_id, contact_id)

        # Mevcut fırsatları kontrol et
        existing_opportunities = ""
        if company_id:
            opportunities = Opportunity.objects.filter(company_id=company_id, status__is_won=False, status__is_lost=False)[:3]
            if opportunities:
                existing_opportunities = "\nMevcut Açık Fırsatlar:\n"
                for opp in opportunities:
                    existing_opportunities += f"- {opp.title} ({opp.value:,.2f} TL) - {opp.status.name}\n"

        json_template = """{
  "opportunities": [
    {
      "title": "Fırsat başlığı",
      "description": "Detaylı açıklama",
      "estimated_value": 50000,
      "priority": "medium",
      "reasoning": "Bu fırsatın neden uygun olduğuna dair açıklama"
    }
  ],
  "analysis": "Genel analiz ve öneriler"
}"""

        system_prompt = f"""Sen profesyonel bir CRM asistanısın ve satış fırsatları oluşturuyorsun.

{user_context}

{customer_context}

{email_history}

{existing_opportunities}

Görevin:
1. Müşteri/firma bilgilerini analiz et
2. Uygun satış fırsatları öner
3. Her fırsat için başlık, açıklama, tahmini değer ve öncelik belirle
4. Mevcut fırsatlarla çakışmayan yeni öneriler sun
5. Gerçekçi ve uygulanabilir öneriler yap
6. Türk pazarına uygun değerlendirmeler yap

Ek bağlam: {additional_context}

Yanıtını JSON formatında ver:
{json_template}
"""

        user_prompt = """
Yukarıdaki müşteri/firma bilgilerini analiz ederek uygun satış fırsatları öner.
En fazla 3 fırsat öner ve her biri için detaylı bilgi ver.
Yanıtını sadece JSON formatında ver, başka açıklama ekleme.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            response = self._make_api_request(messages)
            content = response['choices'][0]['message']['content']

            # JSON parse et
            try:
                # JSON içeriğini temizle
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start != -1 and json_end != -1:
                    json_content = content[json_start:json_end]
                    opportunity_data = json.loads(json_content)
                else:
                    raise ValueError("JSON formatı bulunamadı")
            except (json.JSONDecodeError, ValueError) as e:
                # JSON parse hatası durumunda basit format döndür
                opportunity_data = {
                    "opportunities": [{
                        "title": "AI Önerisi",
                        "description": content,
                        "estimated_value": 25000,
                        "priority": "medium",
                        "reasoning": "AI tarafından oluşturulan genel öneri"
                    }],
                    "analysis": "AI yanıtı JSON formatında parse edilemedi"
                }

            # AI isteğini kaydet
            ai_request = AIRequest.objects.create(
                user=user,
                request_type='opportunity_create',
                status='completed',
                input_data={
                    'company_id': company_id,
                    'contact_id': contact_id,
                    'additional_context': additional_context
                },
                context_data={
                    'user_context': user_context,
                    'customer_context': customer_context,
                    'existing_opportunities': existing_opportunities
                },
                ai_response=content,
                response_metadata=response,
                company_id=company_id,
                contact_id=contact_id
            )

            return opportunity_data

        except Exception as e:
            # Hata durumunda AI isteğini kaydet
            AIRequest.objects.create(
                user=user,
                request_type='opportunity_create',
                status='failed',
                input_data={
                    'company_id': company_id,
                    'contact_id': contact_id,
                    'additional_context': additional_context
                },
                error_message=str(e),
                company_id=company_id,
                contact_id=contact_id
            )
            raise e


# Singleton instance
ai_service = AIService()

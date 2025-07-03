import imaplib
import email
import logging
from email.header import decode_header
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from django.utils import timezone as django_timezone
from django.conf import settings
import re
import json

from .models import IncomingEmail
from customers.models import Company, Contact

logger = logging.getLogger(__name__)


class IMAPService:
    """
    IMAP ile e-posta alma servisi
    """
    
    def __init__(self):
        self.connection = None
    
    def connect(self, imap_config):
        """
        IMAP sunucusuna bağlan
        """
        try:
            # IMAP bağlantısı kur
            if imap_config.get('use_ssl', True):
                self.connection = imaplib.IMAP4_SSL(
                    imap_config['imap_server'], 
                    imap_config.get('imap_port', 993)
                )
            else:
                self.connection = imaplib.IMAP4(
                    imap_config['imap_server'], 
                    imap_config.get('imap_port', 143)
                )
            
            # Giriş yap
            self.connection.login(
                imap_config['imap_username'], 
                imap_config['imap_password']
            )
            
            logger.info(f"IMAP bağlantısı başarılı: {imap_config['imap_server']}")
            return True, "Bağlantı başarılı"
            
        except Exception as e:
            logger.error(f"IMAP bağlantı hatası: {str(e)}")
            return False, f"Bağlantı hatası: {str(e)}"
    
    def disconnect(self):
        """
        IMAP bağlantısını kapat
        """
        if self.connection:
            try:
                self.connection.close()
                self.connection.logout()
                logger.info("IMAP bağlantısı kapatıldı")
            except:
                pass
            finally:
                self.connection = None
    
    def fetch_emails(self, imap_config, folder='INBOX', limit=50):
        """
        E-postaları al
        """
        try:
            # Bağlan
            success, message = self.connect(imap_config)
            if not success:
                return False, message, []
            
            # Klasörü seç
            self.connection.select(folder)
            
            # Son e-postaları ara
            status, messages = self.connection.search(None, 'ALL')
            
            if status != 'OK':
                return False, "E-posta arama hatası", []
            
            # Mesaj ID'lerini al
            message_ids = messages[0].split()
            
            # Son N mesajı al
            recent_ids = message_ids[-limit:] if len(message_ids) > limit else message_ids
            
            emails = []
            
            for msg_id in reversed(recent_ids):  # En yeniden başla
                try:
                    # E-postayı al
                    status, msg_data = self.connection.fetch(msg_id, '(RFC822)')
                    
                    if status != 'OK':
                        continue
                    
                    # E-postayı parse et
                    email_obj = email.message_from_bytes(msg_data[0][1])
                    parsed_email = self._parse_email(email_obj)
                    
                    if parsed_email:
                        emails.append(parsed_email)
                        
                except Exception as e:
                    logger.error(f"E-posta parse hatası: {str(e)}")
                    continue
            
            self.disconnect()
            
            logger.info(f"{len(emails)} e-posta alındı")
            return True, f"{len(emails)} e-posta alındı", emails
            
        except Exception as e:
            logger.error(f"E-posta alma hatası: {str(e)}")
            self.disconnect()
            return False, f"E-posta alma hatası: {str(e)}", []
    
    def _parse_email(self, email_obj):
        """
        E-posta nesnesini parse et
        """
        try:
            # Başlık bilgilerini al
            subject = self._decode_header(email_obj.get('Subject', ''))
            sender = self._parse_email_address(email_obj.get('From', ''))
            recipients = self._parse_recipients(email_obj.get('To', ''))
            cc = self._parse_recipients(email_obj.get('Cc', '')) if email_obj.get('Cc') else []
            
            # Tarih
            date_str = email_obj.get('Date')
            received_at = parsedate_to_datetime(date_str) if date_str else django_timezone.now()
            
            # Message-ID
            message_id = email_obj.get('Message-ID', '').strip('<>')
            
            # İçerik
            content, content_html = self._extract_content(email_obj)
            
            # Ek dosyalar
            attachments, has_attachments = self._extract_attachments(email_obj)
            
            return {
                'message_id': message_id,
                'subject': subject,
                'content': content,
                'content_html': content_html,
                'sender_email': sender['email'],
                'sender_name': sender['name'],
                'recipients': recipients,
                'cc': cc,
                'received_at': received_at,
                'has_attachments': has_attachments,
                'attachments': attachments,
                'raw_headers': dict(email_obj.items())
            }
            
        except Exception as e:
            logger.error(f"E-posta parse hatası: {str(e)}")
            return None
    
    def _decode_header(self, header):
        """
        E-posta başlığını decode et
        """
        if not header:
            return ''
        
        decoded_parts = decode_header(header)
        decoded_string = ''
        
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                if encoding:
                    decoded_string += part.decode(encoding)
                else:
                    decoded_string += part.decode('utf-8', errors='ignore')
            else:
                decoded_string += part
        
        return decoded_string.strip()
    
    def _parse_email_address(self, address_str):
        """
        E-posta adresini parse et
        """
        if not address_str:
            return {'email': '', 'name': ''}
        
        # E-posta adresini çıkar
        email_match = re.search(r'<(.+?)>', address_str)
        if email_match:
            email_addr = email_match.group(1)
            name = address_str.replace(f'<{email_addr}>', '').strip().strip('"')
        else:
            email_addr = address_str.strip()
            name = ''
        
        return {
            'email': email_addr,
            'name': self._decode_header(name) if name else ''
        }
    
    def _parse_recipients(self, recipients_str):
        """
        Alıcıları parse et
        """
        if not recipients_str:
            return []
        
        recipients = []
        # Virgülle ayrılmış adresleri ayır
        addresses = recipients_str.split(',')
        
        for addr in addresses:
            parsed = self._parse_email_address(addr.strip())
            if parsed['email']:
                recipients.append(parsed)
        
        return recipients
    
    def _extract_content(self, email_obj):
        """
        E-posta içeriğini çıkar
        """
        content = ''
        content_html = ''
        
        if email_obj.is_multipart():
            for part in email_obj.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get('Content-Disposition', ''))
                
                # Ek dosya değilse
                if 'attachment' not in content_disposition:
                    if content_type == 'text/plain':
                        payload = part.get_payload(decode=True)
                        if payload:
                            content = payload.decode('utf-8', errors='ignore')
                    elif content_type == 'text/html':
                        payload = part.get_payload(decode=True)
                        if payload:
                            content_html = payload.decode('utf-8', errors='ignore')
        else:
            content_type = email_obj.get_content_type()
            payload = email_obj.get_payload(decode=True)
            
            if payload:
                if content_type == 'text/plain':
                    content = payload.decode('utf-8', errors='ignore')
                elif content_type == 'text/html':
                    content_html = payload.decode('utf-8', errors='ignore')
        
        return content, content_html
    
    def _extract_attachments(self, email_obj):
        """
        Ek dosyaları çıkar
        """
        attachments = []
        has_attachments = False
        
        if email_obj.is_multipart():
            for part in email_obj.walk():
                content_disposition = str(part.get('Content-Disposition', ''))
                
                if 'attachment' in content_disposition:
                    filename = part.get_filename()
                    if filename:
                        filename = self._decode_header(filename)
                        attachments.append({
                            'filename': filename,
                            'content_type': part.get_content_type(),
                            'size': len(part.get_payload(decode=True) or b'')
                        })
                        has_attachments = True
        
        return attachments, has_attachments
    
    def save_emails_to_db(self, emails):
        """
        E-postaları veritabanına kaydet
        """
        saved_count = 0
        
        for email_data in emails:
            try:
                # Zaten var mı kontrol et
                if IncomingEmail.objects.filter(message_id=email_data['message_id']).exists():
                    continue
                
                # Şirket ve kişi ilişkilerini bul
                company, contact = self._find_relations(email_data['sender_email'])

                # E-postayı kaydet
                incoming_email = IncomingEmail.objects.create(
                    message_id=email_data['message_id'],
                    subject=email_data['subject'],
                    content=email_data['content'],
                    content_html=email_data['content_html'],
                    sender_email=email_data['sender_email'],
                    sender_name=email_data['sender_name'],
                    recipients=email_data['recipients'],
                    cc=email_data['cc'],
                    received_at=email_data['received_at'],
                    has_attachments=email_data['has_attachments'],
                    attachments=email_data['attachments'],
                    raw_headers=email_data['raw_headers'],
                    company=company,
                    contact=contact
                )
                
                saved_count += 1
                logger.info(f"E-posta kaydedildi: {email_data['subject']}")
                
            except Exception as e:
                logger.error(f"E-posta kaydetme hatası: {str(e)}")
                continue
        
        return saved_count
    
    def _find_relations(self, sender_email):
        """
        Gönderen e-postaya göre şirket ve kişi ilişkilerini bul
        """
        company = None
        contact = None

        try:
            # Önce kişi ara
            contact = Contact.objects.filter(email=sender_email).first()
            if contact and contact.company:
                company = contact.company

            # Kişi bulunamadıysa şirket ara
            if not company:
                # E-posta domain'ine göre şirket ara
                domain = sender_email.split('@')[1] if '@' in sender_email else ''
                if domain:
                    company = Company.objects.filter(website_url__icontains=domain).first()

        except Exception as e:
            logger.error(f"İlişki bulma hatası: {str(e)}")

        return company, contact


# Global servis instance
imap_service = IMAPService()

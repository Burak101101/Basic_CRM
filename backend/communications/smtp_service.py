import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from django.core.files.storage import default_storage
import mimetypes
import base64

logger = logging.getLogger(__name__)


class SMTPEmailService:
    """
    Klasik SMTP e-posta gönderme servisi
    """
    
    def __init__(self, smtp_config=None):
        """
        SMTP servisi başlat
        
        Args:
            smtp_config (dict): SMTP konfigürasyon bilgileri
                - smtp_server: SMTP sunucu adresi
                - smtp_port: SMTP port
                - smtp_username: Kullanıcı adı
                - smtp_password: Şifre
                - use_tls: TLS kullanımı
        """
        self.smtp_config = smtp_config or {}
    
    def send_email(self, from_email, from_name, to_emails, subject, content, 
                   cc_emails=None, bcc_emails=None, attachments=None, smtp_config=None):
        """
        SMTP ile e-posta gönder
        
        Args:
            from_email (str): Gönderen e-posta adresi
            from_name (str): Gönderen adı
            to_emails (list): Alıcı e-posta adresleri listesi
            subject (str): E-posta konusu
            content (str): E-posta içeriği (HTML)
            cc_emails (list, optional): CC alıcıları
            bcc_emails (list, optional): BCC alıcıları
            attachments (list, optional): Ek dosyalar listesi
            smtp_config (dict, optional): SMTP konfigürasyonu
        
        Returns:
            tuple: (success: bool, message: str, response: dict)
        """
        try:
            # SMTP konfigürasyonunu al
            config = smtp_config or self.smtp_config
            if not config:
                return False, "SMTP konfigürasyonu bulunamadı", None
            
            # Gerekli alanları kontrol et
            required_fields = ['smtp_server', 'smtp_port', 'smtp_username', 'smtp_password']
            for field in required_fields:
                if not config.get(field):
                    return False, f"SMTP konfigürasyonunda {field} eksik", None
            
            # E-posta mesajını oluştur
            msg = MIMEMultipart('alternative')
            
            # UTF-8 encoding için tüm başlıkları doğru biçimde kodla
            from email.header import Header
            from email.utils import formataddr
            
            # Gönderen adını UTF-8 olarak doğru kodla
            if from_name:
                from_header = formataddr((str(Header(from_name, 'utf-8')), from_email))
                msg['From'] = from_header
            else:
                msg['From'] = from_email
                
            # Konuyu UTF-8 olarak doğru kodla
            msg['Subject'] = Header(subject, 'utf-8')
            
            # Alıcıları formatla
            to_list = self.format_recipients(to_emails)
            cc_list = self.format_recipients(cc_emails) if cc_emails else []
            bcc_list = self.format_recipients(bcc_emails) if bcc_emails else []
            
            msg['To'] = ', '.join(to_list)
            if cc_list:
                msg['Cc'] = ', '.join(cc_list)
            
            # HTML içeriği ekle - UTF-8 olarak kodlanmış
            html_part = MIMEText(content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Plain text alternatifi ekle
            plain_text = self._html_to_plaintext(content)
            text_part = MIMEText(plain_text, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # Ekleri ekle
            if attachments:
                for attachment_data in attachments:
                    attachment = self._create_attachment(attachment_data)
                    if attachment:
                        msg.attach(attachment)
            
            # SMTP bağlantısı kur ve e-postayı gönder
            server = smtplib.SMTP(config['smtp_server'], config['smtp_port'])
            
            if config.get('use_tls', True):
                server.starttls()
            
            server.login(config['smtp_username'], config['smtp_password'])
            
            # Tüm alıcıları birleştir
            all_recipients = to_list + cc_list + bcc_list
            
            # E-postayı gönder
            server.sendmail(from_email, all_recipients, msg.as_string())
            server.quit()
            
            return True, "E-posta başarıyla gönderildi", {
                "to": to_list,
                "cc": cc_list,
                "bcc": bcc_list,
                "subject": subject,
            }
        
        except Exception as e:
            logger.error(f"E-posta gönderirken hata: {str(e)}", exc_info=True)
            return False, f"E-posta gönderirken hata: {str(e)}", None
    
    def _html_to_plaintext(self, html_content):
        """
        HTML içeriğini düz metin haline çevirir
        """
        # Basit bir HTML to plain text dönüşümü
        import re
        
        # HTML tagları kaldır
        text = re.sub('<.*?>', ' ', html_content)
        
        # Fazla boşlukları temizle
        text = re.sub('\\s+', ' ', text).strip()
        
        # HTML entity'lerini dönüştür
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&amp;', '&')
        text = text.replace('&quot;', '"')
        text = text.replace('&apos;', "'")
        
        return text
    
    def format_recipients(self, recipients):
        """
        Alıcı listesini formatla
        
        Args:
            recipients (list): Alıcı listesi (str veya dict)
        
        Returns:
            list: Formatlanmış e-posta adresleri listesi
        """
        if not recipients:
            return []
        
        formatted_recipients = []
        
        for recipient in recipients:
            if isinstance(recipient, str):
                if self.validate_email_address(recipient):
                    formatted_recipients.append(recipient)
            elif isinstance(recipient, dict):
                email = recipient.get('email')
                if email and self.validate_email_address(email):
                    formatted_recipients.append(email)
        
        return formatted_recipients
    
    def _create_attachment(self, attachment_data):
        """
        Ek dosya için MIMEBase nesnesi oluştur
        
        Args:
            attachment_data (dict): Ek dosya bilgileri
                - file_path: Dosya yolu
                - file_name: Dosya adı
                - file_content: Dosya içeriği (base64 encoded)
        
        Returns:
            MIMEBase: Ek dosya nesnesi
        """
        try:
            file_name = attachment_data.get('file_name', 'attachment')
            file_content = attachment_data.get('file_content')
            file_path = attachment_data.get('file_path')
            
            # Dosya içeriğini al
            if file_content:
                # Base64 encoded content
                content = base64.b64decode(file_content)
            elif file_path and default_storage.exists(file_path):
                # Dosya yolundan oku
                with default_storage.open(file_path, 'rb') as f:
                    content = f.read()
            else:
                logger.warning(f"Attachment content not found: {file_name}")
                return None
            
            # MIME type'ı belirle
            mime_type, _ = mimetypes.guess_type(file_name)
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            # Ana ve alt MIME tiplerini ayır
            main_type, sub_type = mime_type.split('/', 1)
            
            # MIMEBase nesnesi oluştur
            attachment = MIMEBase(main_type, sub_type)
            attachment.set_payload(content)
            
            # Base64 encoding
            encoders.encode_base64(attachment)
            
            # Header ekle
            attachment.add_header(
                'Content-Disposition',
                f'attachment; filename="{file_name}"'
            )
            
            return attachment
            
        except Exception as e:
            logger.error(f"Error creating attachment: {str(e)}")
            return None
    
    def validate_email_address(self, email):
        """
        E-posta adresini doğrula
        
        Args:
            email (str): E-posta adresi
        
        Returns:
            bool: Geçerli ise True
        """
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def test_connection(self, smtp_config):
        """
        SMTP bağlantısını test et
        
        Args:
            smtp_config (dict): SMTP konfigürasyonu
        
        Returns:
            tuple: (success: bool, message: str)
        """
        try:
            server = smtplib.SMTP(smtp_config['smtp_server'], smtp_config['smtp_port'])
            
            if smtp_config.get('use_tls', True):
                server.starttls()
            
            server.login(smtp_config['smtp_username'], smtp_config['smtp_password'])
            server.quit()
            
            return True, "SMTP bağlantısı başarılı"
            
        except smtplib.SMTPAuthenticationError:
            return False, "SMTP kimlik doğrulama hatası - Kullanıcı adı/şifre kontrol edin"
        except smtplib.SMTPConnectError:
            return False, "SMTP sunucusuna bağlanılamadı - Sunucu/port kontrol edin"
        except Exception as e:
            return False, f"SMTP bağlantı hatası: {str(e)}"


# Global instance
smtp_service = SMTPEmailService()

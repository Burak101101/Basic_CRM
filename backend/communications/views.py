from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.utils import timezone
from django.conf import settings
from .email_backend import TestEmailBackend, get_test_emails, get_test_email

from .models import EmailTemplate, EmailMessage, EmailConfig
from .serializers import (
    EmailTemplateSerializer,
    EmailConfigSerializer,
    EmailMessageListSerializer,
    EmailMessageDetailSerializer,
    SendEmailSerializer
)
from customers.models import Company, Contact


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    E-posta şablonları için API endpoint'i
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subject', 'content']


class EmailConfigViewSet(viewsets.ModelViewSet):
    """
    E-posta konfigürasyonları için API endpoint'i
    """
    queryset = EmailConfig.objects.all()
    serializer_class = EmailConfigSerializer


class EmailMessageViewSet(viewsets.ModelViewSet):
    """
    E-posta mesajları için API endpoint'i
    """
    queryset = EmailMessage.objects.all().order_by('-created_at')
    filter_backends = [filters.SearchFilter]
    search_fields = ['subject', 'content', 'sender', 'company__name', 'contact__first_name', 'contact__last_name']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmailMessageListSerializer
        return EmailMessageDetailSerializer
    
    @action(detail=False, methods=['post'])
    def send_email(self, request):
        """
        E-posta gönderme endpoint'i
        """
        serializer = SendEmailSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            
            # İlgili firma ve kişi nesnelerini bulalım
            company = None
            contact = None
            
            if data.get('company_id'):
                try:
                    company = Company.objects.get(id=data['company_id'])
                except Company.DoesNotExist:
                    return Response(
                        {"error": "Belirtilen firma bulunamadı."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            if data.get('contact_id'):
                try:
                    contact = Contact.objects.get(id=data['contact_id'])
                except Contact.DoesNotExist:
                    return Response(
                        {"error": "Belirtilen kişi bulunamadı."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # E-posta yapılandırması bulalım
            try:
                if data.get('config_id'):
                    config = EmailConfig.objects.get(id=data['config_id'], is_active=True)
                else:
                    # Varsayılan yapılandırmayı kullan
                    config = EmailConfig.objects.filter(is_default=True, is_active=True).first()
                    
                    if not config:
                        # Varsayılan yoksa aktif bir yapılandırma bul
                        config = EmailConfig.objects.filter(is_active=True).first()
                        
                if not config:
                    return Response(
                        {"error": "Aktif bir e-posta yapılandırması bulunamadı."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except EmailConfig.DoesNotExist:
                return Response(
                    {"error": "Belirtilen e-posta yapılandırması bulunamadı veya aktif değil."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # E-posta nesnesi oluşturalım
            email = EmailMessage(
                subject=data['subject'],
                content=data['content'],
                sender=config.email_address,
                recipients=data['recipients'],
                cc=data.get('cc'),
                bcc=data.get('bcc'),
                attachments=data.get('attachments'),
                status='sending',
                company=company,
                contact=contact,
                metadata={
                    'sent_by_user_id': request.user.id,
                    'sent_by_username': request.user.username,
                }
            )
            email.save()                # Gönderim işlemi
            try:
                # MIME mesajı oluştur
                msg = MIMEMultipart()
                msg['From'] = f"{config.display_name} <{config.email_address}>" if config.display_name else config.email_address
                msg['Subject'] = data['subject']
                
                # Alıcıları ekle
                to_addresses = []
                for recipient in data['recipients']:
                    if isinstance(recipient, dict) and 'email' in recipient:
                        if recipient.get('name'):
                            to_addresses.append(f"{recipient['name']} <{recipient['email']}>")
                        else:
                            to_addresses.append(recipient['email'])
                    elif isinstance(recipient, str):
                        to_addresses.append(recipient)
                
                msg['To'] = ", ".join(to_addresses)
                
                # CC alıcıları ekle
                cc_addresses = []
                if data.get('cc'):
                    for cc_recipient in data['cc']:
                        if isinstance(cc_recipient, dict) and 'email' in cc_recipient:
                            if cc_recipient.get('name'):
                                cc_addresses.append(f"{cc_recipient['name']} <{cc_recipient['email']}>")
                            else:
                                cc_addresses.append(cc_recipient['email'])
                        elif isinstance(cc_recipient, str):
                            cc_addresses.append(cc_recipient)
                    
                    if cc_addresses:
                        msg['Cc'] = ", ".join(cc_addresses)
                
                # BCC alıcıları
                bcc_addresses = []
                if data.get('bcc'):
                    for bcc_recipient in data['bcc']:
                        if isinstance(bcc_recipient, dict) and 'email' in bcc_recipient:
                            bcc_addresses.append(bcc_recipient['email'])
                        elif isinstance(bcc_recipient, str):
                            bcc_addresses.append(bcc_recipient)
                
                # İçeriği ekle
                msg.attach(MIMEText(data['content'], 'html'))
                
                # Tüm alıcıları birleştir
                all_recipients = to_addresses + cc_addresses + bcc_addresses
                
                # Geliştirme ortamında gerçek e-posta göndermek yerine test email backend'i kullan
                if settings.DEBUG:
                    # Test email backend kullanarak dosyaya kaydet
                    email_backend = TestEmailBackend()
                    success, message = email_backend.send_email(
                        from_email=config.email_address, 
                        to_emails=all_recipients, 
                        message=msg,
                        cc=cc_addresses,
                        bcc=bcc_addresses
                    )
                    
                    if not success:
                        raise Exception(f"Test e-posta kaydedilemedi: {message}")
                else:
                    # Gerçek SMTP sunucusu kullan
                    server = smtplib.SMTP(config.smtp_server, config.smtp_port)
                    if config.use_tls:
                        server.starttls()
                    server.login(config.username, config.password)
                    server.sendmail(config.email_address, all_recipients, msg.as_string())
                    server.quit()
                
                # Başarılı gönderim
                email.status = 'sent'
                email.sent_at = timezone.now()
                email.save()
                
                return Response(
                    {
                        "message": "E-posta başarıyla gönderildi.",
                        "email_id": email.id,
                        "recipients_count": len(all_recipients)
                    },
                    status=status.HTTP_200_OK
                )
                
            except Exception as e:
                # Hata durumu
                email.status = 'failed'
                email.error_message = str(e)
                email.save()
                
                return Response(
                    {
                        "error": "E-posta gönderilirken bir hata oluştu.",
                        "details": str(e),
                        "email_id": email.id
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def company_emails(self, request):
        """
        Belirli bir firmaya ait e-postaları listeler
        """
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({"error": "Firma ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        emails = self.queryset.filter(company_id=company_id)
        page = self.paginate_queryset(emails)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(emails, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'])
    def contact_emails(self, request):
        """
        Belirli bir kişiye ait e-postaları listeler
        """
        contact_id = request.query_params.get('contact_id')
        if not contact_id:
            return Response({"error": "Kişi ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        emails = self.queryset.filter(contact_id=contact_id)
        page = self.paginate_queryset(emails)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(emails, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def test_emails(self, request):
        """
        Geliştirme ortamında kaydedilen test e-postalarını listele
        Bu endpoint sadece DEBUG=True olduğunda çalışır
        """
        if not settings.DEBUG:
            return Response(
                {"error": "Bu endpoint sadece geliştirme ortamında kullanılabilir."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        emails = get_test_emails()
        return Response(emails)
    
    @action(detail=True, methods=['get'], url_path='test-email')
    def test_email_detail(self, request, pk=None):
        """
        Belirli bir test e-postasının detaylarını görüntüle
        Bu endpoint sadece DEBUG=True olduğunda çalışır
        """
        if not settings.DEBUG:
            return Response(
                {"error": "Bu endpoint sadece geliştirme ortamında kullanılabilir."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        email_data = get_test_email(pk)
        if not email_data:
            return Response(
                {"error": "E-posta bulunamadı."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        return Response(email_data)

from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
import mimetypes


from .smtp_service import smtp_service
from .imap_service import imap_service
from .models import EmailTemplate, EmailMessage, EmailAttachment, IncomingEmail
from .serializers import (
    EmailTemplateSerializer,
    EmailMessageListSerializer,
    EmailMessageDetailSerializer,
    SendEmailSerializer,
    EmailAttachmentSerializer,
    IncomingEmailSerializer
)
from customers.models import Company, Contact
from authentication.models import UserProfile
from opportunities.models import Opportunity


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    E-posta şablonları için API endpoint'i
    """
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'subject', 'content']


# EmailConfigViewSet artık kullanılmıyor - SMTP ayarları kullanıcı profilinde


class EmailMessageViewSet(viewsets.ModelViewSet):
    """
    E-posta mesajları için API endpoint'i
    """
    queryset = EmailMessage.objects.all().order_by('-created_at')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'company', 'contact', 'opportunity']
    search_fields = ['subject', 'content', 'sender', 'company__name', 'contact__first_name', 'contact__last_name', 'opportunity__title']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EmailMessageListSerializer
        return EmailMessageDetailSerializer
    
    @action(detail=False, methods=['post'], url_path='send')
    def send_email(self, request):
        """
        SMTP ile e-posta gönderme endpoint'i
        """
        print(f"=== EMAIL SEND REQUEST ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")

        serializer = SendEmailSerializer(data=request.data)

        if not serializer.is_valid():
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        print(f"Validated data: {data}")

        # İlgili firma, kişi ve fırsat nesnelerini bulalım
        company = None
        contact = None
        opportunity = None

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

        if data.get('opportunity_id'):
            try:
                opportunity = Opportunity.objects.get(id=data['opportunity_id'])
                # Eğer fırsat seçildiyse ve firma belirtilmediyse, fırsatın firmasını kullan
                if not company:
                    company = opportunity.company
            except Opportunity.DoesNotExist:
                return Response(
                    {"error": "Belirtilen fırsat bulunamadı."},
                    status=status.HTTP_404_NOT_FOUND
                )

        # EmailConfig artık kullanılmıyor, SMTP ayarları kullanıcı profilinden alınacak

        # Kullanıcının SMTP ayarlarını al
        try:
            user_profile = UserProfile.objects.get(user=request.user)

            # SMTP ayarlarını kontrol et
            smtp_config = {
                'smtp_server': user_profile.smtp_server,
                'smtp_port': user_profile.smtp_port,
                'smtp_username': user_profile.smtp_username,
                'smtp_password': user_profile.smtp_password,
                'use_tls': user_profile.use_tls,
            }

            # SMTP ayarlarının tamamlanmış olduğunu kontrol et
            required_smtp_fields = ['smtp_server', 'smtp_port', 'smtp_username', 'smtp_password']
            missing_fields = [field for field in required_smtp_fields if not smtp_config.get(field)]

            if missing_fields:
                return Response(
                    {"error": f"SMTP ayarları eksik. Lütfen profil ayarlarınızda şu alanları doldurun: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Gönderen bilgilerini SMTP ayarlarından al
            sender_email = user_profile.smtp_username  # SMTP kullanıcı adı genellikle e-posta adresidir
            sender_name = f"{request.user.first_name} {request.user.last_name}".strip() or sender_email.split('@')[0]

        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Kullanıcı profili bulunamadı. Lütfen profil ayarlarınızı tamamlayın."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # E-posta nesnesi oluşturalım
        email = EmailMessage(
            subject=data['subject'],
            content=data['content'],
            sender=sender_email,
            recipients=data['recipients'],
            cc=data.get('cc'),
            bcc=data.get('bcc'),
            attachments=data.get('attachments'),
            status='sending',
            company=company,
            contact=contact,
            opportunity=opportunity,
            metadata={
                'sent_by_user_id': request.user.id,
                'sent_by_username': request.user.username,
                'sender_name': sender_name,
            }
        )
        email.save()

        try:
                # Alıcıları formatla
                to_emails = smtp_service.format_recipients(data['recipients'])
                cc_emails = smtp_service.format_recipients(data.get('cc', [])) if data.get('cc') else None
                bcc_emails = smtp_service.format_recipients(data.get('bcc', [])) if data.get('bcc') else None

                # Ekleri hazırla
                attachments = []
                if data.get('attachments'):
                    for attachment_data in data['attachments']:
                        if isinstance(attachment_data, dict):
                            attachments.append(attachment_data)

                # SMTP ile e-posta gönder
                success, message, response_data = smtp_service.send_email(
                    from_email=sender_email,
                    from_name=sender_name,
                    to_emails=to_emails,
                    subject=data['subject'],
                    content=data['content'],
                    cc_emails=cc_emails,
                    bcc_emails=bcc_emails,
                    attachments=attachments,
                    smtp_config=smtp_config
                )

                if success:
                    # Başarılı gönderim
                    email.status = 'sent'
                    email.sent_at = timezone.now()
                    email.metadata.update({
                        'smtp_response': response_data
                    })
                    email.save()

                    total_recipients = len(to_emails)
                    if cc_emails:
                        total_recipients += len(cc_emails)
                    if bcc_emails:
                        total_recipients += len(bcc_emails)

                    return Response(
                        {
                            "message": message,
                            "email_id": email.id,
                            "recipients_count": total_recipients
                        },
                        status=status.HTTP_200_OK
                    )
                else:
                    # Gönderim hatası
                    email.status = 'failed'
                    email.error_message = message
                    email.save()

                    return Response(
                        {
                            "error": "E-posta gönderilirken bir hata oluştu.",
                            "details": message,
                            "email_id": email.id
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

        except Exception as e:
            # Beklenmeyen hata
            email.status = 'failed'
            email.error_message = str(e)
            email.save()

            return Response(
                {
                    "error": "E-posta gönderilirken beklenmeyen bir hata oluştu.",
                    "details": str(e),
                    "email_id": email.id
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], url_path='drafts')
    def save_draft(self, request):
        """
        E-posta taslağı kaydetme endpoint'i
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

            # Kullanıcının e-posta ayarlarını al
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                sender_email = user_profile.sender_email or request.user.email
                sender_name = user_profile.sender_name or f"{request.user.first_name} {request.user.last_name}".strip()
            except UserProfile.DoesNotExist:
                sender_email = request.user.email
                sender_name = f"{request.user.first_name} {request.user.last_name}".strip()

            if not sender_email:
                return Response(
                    {"error": "Gönderen e-posta adresi belirtilmemiş. Lütfen profil ayarlarınızı kontrol edin."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Taslak e-posta nesnesi oluşturalım
            email = EmailMessage(
                subject=data.get('subject', ''),
                content=data.get('content', ''),
                sender=sender_email,
                recipients=data.get('recipients', []),
                cc=data.get('cc'),
                bcc=data.get('bcc'),
                attachments=data.get('attachments'),
                status='draft',
                company=company,
                contact=contact,
                metadata={
                    'created_by_user_id': request.user.id,
                    'created_by_username': request.user.username,
                    'sender_name': sender_name,
                }
            )
            email.save()

            return Response(
                {
                    "message": "Taslak başarıyla kaydedildi.",
                    "email_id": email.id
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='email-status')
    def email_status(self, request):
        """
        E-posta sistemi durumunu kontrol et
        """
        # Kullanıcının SMTP ayarlarını kontrol et
        try:
            user_profile = UserProfile.objects.get(user=request.user)

            # SMTP ayarlarının tamamlanmış olduğunu kontrol et
            required_smtp_fields = ['smtp_server', 'smtp_port', 'smtp_username', 'smtp_password']
            missing_fields = []

            for field in required_smtp_fields:
                if not getattr(user_profile, field):
                    missing_fields.append(field)

            status_info = {
                "has_smtp_config": len(missing_fields) == 0,
                "missing_fields": missing_fields,
                "ready_to_send": len(missing_fields) == 0,
                "message": ""
            }

            if missing_fields:
                status_info["message"] = f"SMTP ayarları eksik: {', '.join(missing_fields)}"
            else:
                status_info["message"] = "E-posta sistemi hazır"

        except UserProfile.DoesNotExist:
            status_info = {
                "has_smtp_config": False,
                "missing_fields": ["user_profile"],
                "ready_to_send": False,
                "message": "Kullanıcı profili bulunamadı"
            }

        return Response(status_info)


class IncomingEmailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Gelen e-postalar için ViewSet
    """
    queryset = IncomingEmail.objects.all()
    serializer_class = IncomingEmailSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['subject', 'sender_email', 'sender_name', 'content']
    ordering_fields = ['received_at', 'created_at']
    ordering = ['-received_at']

    @action(detail=False, methods=['post'], url_path='fetch')
    def fetch_emails(self, request):
        """
        IMAP ile e-postaları al
        """
        try:
            user_profile = UserProfile.objects.get(user=request.user)

            # IMAP ayarlarını kontrol et
            required_imap_fields = ['imap_server', 'imap_port', 'imap_username', 'imap_password']
            missing_fields = []

            for field in required_imap_fields:
                if not getattr(user_profile, field):
                    missing_fields.append(field)

            if missing_fields:
                return Response(
                    {"error": f"IMAP ayarları eksik. Lütfen profil ayarlarınızda şu alanları doldurun: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # IMAP konfigürasyonu
            imap_config = {
                'imap_server': user_profile.imap_server,
                'imap_port': user_profile.imap_port,
                'imap_username': user_profile.imap_username,
                'imap_password': user_profile.imap_password,
                'use_ssl': user_profile.use_imap_ssl,
            }

            # E-postaları al
            success, message, emails = imap_service.fetch_emails(imap_config)

            if not success:
                return Response(
                    {"error": message},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Veritabanına kaydet
            saved_count = imap_service.save_emails_to_db(emails)

            return Response({
                "success": True,
                "message": f"{len(emails)} e-posta alındı, {saved_count} yeni e-posta kaydedildi",
                "fetched_count": len(emails),
                "saved_count": saved_count
            })

        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Kullanıcı profili bulunamadı"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"E-posta alma hatası: {str(e)}")
            return Response(
                {"error": f"E-posta alma hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """
        E-postayı okunmuş olarak işaretle
        """
        try:
            email = self.get_object()
            email.status = 'read'
            email.save()

            return Response({
                "success": True,
                "message": "E-posta okunmuş olarak işaretlendi"
            })

        except Exception as e:
            return Response(
                {"error": f"İşaretleme hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch'], url_path='mark-unread')
    def mark_unread(self, request, pk=None):
        """
        E-postayı okunmamış olarak işaretle
        """
        try:
            email = self.get_object()
            email.status = 'unread'
            email.save()

            return Response({
                "success": True,
                "message": "E-posta okunmamış olarak işaretlendi"
            })

        except Exception as e:
            return Response(
                {"error": f"İşaretleme hatası: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='imap-status')
    def imap_status(self, request):
        """
        IMAP sistemi durumunu kontrol et
        """
        try:
            user_profile = UserProfile.objects.get(user=request.user)

            # IMAP ayarlarının tamamlanmış olduğunu kontrol et
            required_imap_fields = ['imap_server', 'imap_port', 'imap_username', 'imap_password']
            missing_fields = []

            for field in required_imap_fields:
                if not getattr(user_profile, field):
                    missing_fields.append(field)

            status_info = {
                "has_imap_config": len(missing_fields) == 0,
                "missing_fields": missing_fields,
                "ready_to_fetch": len(missing_fields) == 0,
                "message": ""
            }

            if missing_fields:
                status_info["message"] = f"IMAP ayarları eksik: {', '.join(missing_fields)}"
            else:
                status_info["message"] = "E-posta alma sistemi hazır"

        except UserProfile.DoesNotExist:
            status_info = {
                "has_imap_config": False,
                "missing_fields": ["user_profile"],
                "ready_to_fetch": False,
                "message": "Kullanıcı profili bulunamadı"
            }

        return Response(status_info)

    @action(detail=False, methods=['post'], url_path='upload-attachment', parser_classes=[MultiPartParser, FormParser])
    def upload_attachment(self, request):
        """
        E-posta eki yükleme endpoint'i
        """
        if 'file' not in request.FILES:
            return Response(
                {"error": "Dosya yüklenmedi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES['file']

        # Dosya boyutu kontrolü (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if uploaded_file.size > max_size:
            return Response(
                {"error": "Dosya boyutu 10MB'dan büyük olamaz."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Dosya tipini kontrol et
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
        ]

        content_type = uploaded_file.content_type
        if content_type not in allowed_types:
            return Response(
                {"error": f"Desteklenmeyen dosya tipi: {content_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Dosyayı geçici olarak kaydet
            import uuid
            file_name = f"{uuid.uuid4()}_{uploaded_file.name}"
            file_path = f"temp_attachments/{file_name}"

            # Dosyayı kaydet
            saved_path = default_storage.save(file_path, uploaded_file)

            # Base64 encode et
            import base64
            with default_storage.open(saved_path, 'rb') as f:
                file_content = f.read()
                encoded_content = base64.b64encode(file_content).decode()

            # Geçici dosyayı sil
            default_storage.delete(saved_path)

            return Response({
                "file_name": uploaded_file.name,
                "file_content": encoded_content,
                "file_size": uploaded_file.size,
                "content_type": content_type
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Dosya yüklenirken hata oluştu: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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


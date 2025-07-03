from django.db import models
from django.utils import timezone
from django.conf import settings
from customers.models import Company, Contact
import os


class EmailTemplate(models.Model):
    """
    Önceden hazırlanmış e-posta şablonları
    """
    name = models.CharField(max_length=255, verbose_name="Şablon Adı")
    subject = models.CharField(max_length=255, verbose_name="E-posta Konusu")
    content = models.TextField(verbose_name="İçerik")
    variables = models.JSONField(default=dict, blank=True, help_text="Kullanılabilecek değişkenler", verbose_name="Değişkenler")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")
    
    class Meta:
        verbose_name = "E-posta Şablonu"
        verbose_name_plural = "E-posta Şablonları"
        
    def __str__(self):
        return self.name


class EmailMessage(models.Model):
    """
    Gönderilen veya taslak olarak kaydedilen e-postalar
    """
    STATUS_CHOICES = (
        ('draft', 'Taslak'),
        ('sending', 'Gönderiliyor'),
        ('sent', 'Gönderildi'),
        ('failed', 'Gönderme Hatası'),
    )
    
    subject = models.CharField(max_length=255, verbose_name="E-posta Konusu")
    content = models.TextField(verbose_name="İçerik")
    sender = models.EmailField(verbose_name="Gönderen")
    recipients = models.JSONField(verbose_name="Alıcılar")  # [{"email": "mail@example.com", "name": "Display Name"}]
    cc = models.JSONField(blank=True, null=True, verbose_name="CC")
    bcc = models.JSONField(blank=True, null=True, verbose_name="BCC")
    attachments = models.JSONField(blank=True, null=True, verbose_name="Ekler", help_text="Dosya referansları: [{'file_name': 'dosya.pdf', 'file_path': 'uploads/dosya.pdf', 'file_size': 1024}]")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name="Durum")
    error_message = models.TextField(blank=True, null=True, verbose_name="Hata Mesajı")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Meta Veriler")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', verbose_name="İlişkili Firma")
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', verbose_name="İlişkili Kişi")
    opportunity = models.ForeignKey('opportunities.Opportunity', on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', verbose_name="İlişkili Fırsat")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Gönderilme Tarihi")
    
    class Meta:
        verbose_name = "E-posta Mesajı"
        verbose_name_plural = "E-posta Mesajları"
        ordering = ['-created_at']
        
    def __str__(self):
        return self.subject
        
    def save(self, *args, **kwargs):
        if self.status == 'sent' and not self.sent_at:
            self.sent_at = timezone.now()
        super().save(*args, **kwargs)





class IncomingEmail(models.Model):
    """
    Gelen e-postalar için model
    """
    STATUS_CHOICES = [
        ('unread', 'Okunmamış'),
        ('read', 'Okunmuş'),
        ('archived', 'Arşivlenmiş'),
        ('deleted', 'Silinmiş'),
    ]

    message_id = models.CharField(max_length=255, unique=True, verbose_name="Mesaj ID")
    subject = models.CharField(max_length=255, verbose_name="Konu")
    content = models.TextField(verbose_name="İçerik")
    content_html = models.TextField(blank=True, null=True, verbose_name="HTML İçerik")
    sender_email = models.EmailField(verbose_name="Gönderen E-posta")
    sender_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Gönderen Adı")
    recipients = models.JSONField(verbose_name="Alıcılar")  # [{"email": "mail@example.com", "name": "Display Name"}]
    cc = models.JSONField(blank=True, null=True, verbose_name="CC")
    bcc = models.JSONField(blank=True, null=True, verbose_name="BCC")

    # İlişkiler
    company = models.ForeignKey('customers.Company', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Şirket")
    contact = models.ForeignKey('customers.Contact', on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Kişi")

    # Durum ve tarihler
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unread', verbose_name="Durum")
    received_at = models.DateTimeField(verbose_name="Alınma Tarihi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    # Ek bilgiler
    has_attachments = models.BooleanField(default=False, verbose_name="Ek Dosya Var")
    attachments = models.JSONField(blank=True, null=True, verbose_name="Ek Dosyalar")
    raw_headers = models.JSONField(blank=True, null=True, verbose_name="Ham Başlıklar")

    class Meta:
        verbose_name = "Gelen E-posta"
        verbose_name_plural = "Gelen E-postalar"
        ordering = ['-received_at']

    def __str__(self):
        return f"{self.sender_email} - {self.subject}"


class EmailConfig(models.Model):
    """
    E-posta gönderimi için konfigürasyon ayarları
    """
    name = models.CharField(max_length=100, verbose_name="Konfigürasyon Adı")
    smtp_server = models.CharField(max_length=255, verbose_name="SMTP Sunucusu")
    smtp_port = models.IntegerField(verbose_name="SMTP Port")
    use_tls = models.BooleanField(default=True, verbose_name="TLS Kullan")
    email_address = models.EmailField(verbose_name="E-posta Adresi")
    display_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Görünen Ad")
    username = models.CharField(max_length=255, verbose_name="Kullanıcı Adı")
    password = models.CharField(max_length=255, verbose_name="Şifre")
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    is_default = models.BooleanField(default=False, verbose_name="Varsayılan")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "E-posta Konfigürasyonu"
        verbose_name_plural = "E-posta Konfigürasyonları"

    def __str__(self):
        return f"{self.name} ({self.email_address})"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Diğer tüm konfigürasyonları varsayılan olmaktan çıkar
            EmailConfig.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


def email_attachment_upload_path(instance, filename):
    """E-posta ekleri için upload path"""
    return f'email_attachments/{instance.email_message.id}/{filename}'


class EmailAttachment(models.Model):
    """
    E-posta ekleri
    """
    email_message = models.ForeignKey(EmailMessage, on_delete=models.CASCADE, related_name='attachment_files')
    file = models.FileField(upload_to=email_attachment_upload_path, verbose_name="Dosya")
    original_name = models.CharField(max_length=255, verbose_name="Orijinal Dosya Adı")
    file_size = models.PositiveIntegerField(verbose_name="Dosya Boyutu (bytes)")
    content_type = models.CharField(max_length=100, verbose_name="İçerik Tipi")
    uploaded_at = models.DateTimeField(default=timezone.now, verbose_name="Yüklenme Tarihi")

    class Meta:
        verbose_name = "E-posta Eki"
        verbose_name_plural = "E-posta Ekleri"

    def __str__(self):
        return f"{self.original_name} - {self.email_message.subject}"

    @property
    def file_size_mb(self):
        """Dosya boyutunu MB cinsinden döndür"""
        return round(self.file_size / (1024 * 1024), 2)

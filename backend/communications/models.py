from django.db import models
from django.utils import timezone
from customers.models import Company, Contact


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
    attachments = models.JSONField(blank=True, null=True, verbose_name="Ekler")  # Dosya referansları veya URL'ler
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name="Durum")
    error_message = models.TextField(blank=True, null=True, verbose_name="Hata Mesajı")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Meta Veriler")
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', verbose_name="İlişkili Firma")
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name='emails', verbose_name="İlişkili Kişi")
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

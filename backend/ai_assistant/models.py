from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class AIConfiguration(models.Model):
    """
    AI yapılandırma ayarları
    """
    name = models.CharField(max_length=100, verbose_name="Konfigürasyon Adı")
    provider = models.CharField(max_length=50, default="openrouter", verbose_name="AI Sağlayıcı")
    model_name = models.CharField(max_length=100, default="deepseek/deepseek-r1", verbose_name="Model Adı")
    api_key = models.CharField(max_length=500, verbose_name="API Anahtarı")
    api_url = models.URLField(default="https://openrouter.ai/api/v1/chat/completions", verbose_name="API URL")
    max_tokens = models.IntegerField(default=4000, verbose_name="Maksimum Token")
    temperature = models.FloatField(default=0.7, verbose_name="Temperature")
    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    is_default = models.BooleanField(default=False, verbose_name="Varsayılan")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "AI Konfigürasyonu"
        verbose_name_plural = "AI Konfigürasyonları"

    def __str__(self):
        return f"{self.name} ({self.model_name})"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Diğer tüm konfigürasyonları varsayılan olmaktan çıkar
            AIConfiguration.objects.filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class AIRequest(models.Model):
    """
    AI istekleri ve yanıtları için log modeli
    """
    REQUEST_TYPE_CHOICES = [
        ('email_compose', 'E-posta Oluşturma'),
        ('email_reply', 'E-posta Yanıtlama'),
        ('opportunity_create', 'Fırsat Oluşturma'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Bekliyor'),
        ('processing', 'İşleniyor'),
        ('completed', 'Tamamlandı'),
        ('failed', 'Başarısız'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_requests', verbose_name="Kullanıcı")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, verbose_name="İstek Türü")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Durum")

    # İstek verileri
    input_data = models.JSONField(verbose_name="Giriş Verileri")
    context_data = models.JSONField(blank=True, null=True, verbose_name="Bağlam Verileri")

    # AI yanıtı
    ai_response = models.TextField(blank=True, null=True, verbose_name="AI Yanıtı")
    response_metadata = models.JSONField(blank=True, null=True, verbose_name="Yanıt Meta Verileri")

    # İlişkili objeler
    company_id = models.IntegerField(blank=True, null=True, verbose_name="İlişkili Firma ID")
    contact_id = models.IntegerField(blank=True, null=True, verbose_name="İlişkili Kişi ID")
    opportunity_id = models.IntegerField(blank=True, null=True, verbose_name="İlişkili Fırsat ID")
    email_id = models.IntegerField(blank=True, null=True, verbose_name="İlişkili E-posta ID")

    # Zaman damgaları
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Tamamlanma Tarihi")

    # Hata bilgileri
    error_message = models.TextField(blank=True, null=True, verbose_name="Hata Mesajı")

    class Meta:
        verbose_name = "AI İsteği"
        verbose_name_plural = "AI İstekleri"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_request_type_display()} - {self.user.username} ({self.status})"

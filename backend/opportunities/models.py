from django.db import models
from django.utils import timezone
from customers.models import Company, Contact
from django.contrib.auth.models import User


class OpportunityStatus(models.Model):
    """
    Satış fırsatı durumları için model (örn: İlk Görüşme, Teklif Hazırlanıyor, Teklif Sunuldu, vb.)
    """
    name = models.CharField(max_length=100, verbose_name="Durum Adı")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    color = models.CharField(max_length=7, default="#3498db", verbose_name="Renk Kodu")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Sıra")
    is_default = models.BooleanField(default=False, verbose_name="Varsayılan")
    is_won = models.BooleanField(default=False, verbose_name="Kazanıldı")  # Eğer bu durum bir kazanç durumu ise
    is_lost = models.BooleanField(default=False, verbose_name="Kaybedildi")  # Eğer bu durum bir kayıp durumu ise
    
    class Meta:
        verbose_name = "Fırsat Durumu"
        verbose_name_plural = "Fırsat Durumları"
        ordering = ['order']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.is_default:
            # Diğer tüm durumları varsayılan olmaktan çıkar
            OpportunityStatus.objects.filter(is_default=True).update(is_default=False)
        
        # Kazanıldı ve kaybedildi aynı anda olamaz
        if self.is_won and self.is_lost:
            self.is_lost = False
            
        super().save(*args, **kwargs)


class Opportunity(models.Model):
    """
    Satış fırsatları için model
    """
    PRIORITY_CHOICES = (
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('critical', 'Kritik'),
    )
    
    title = models.CharField(max_length=255, verbose_name="Fırsat Başlığı")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    company = models.ForeignKey(
        Company, 
        on_delete=models.CASCADE, 
        related_name="opportunities", 
        verbose_name="Firma"
    )
    contacts = models.ManyToManyField(
        Contact, 
        related_name="opportunities", 
        blank=True, 
        verbose_name="İlgili Kişiler"
    )
    status = models.ForeignKey(
        OpportunityStatus, 
        on_delete=models.PROTECT, 
        related_name="opportunities", 
        verbose_name="Durum"
    )
    value = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Değer (TL)")
    priority = models.CharField(
        max_length=8, 
        choices=PRIORITY_CHOICES, 
        default='medium', 
        verbose_name="Öncelik"
    )
    probability = models.PositiveSmallIntegerField(
        default=50, 
        verbose_name="Kazanma Olasılığı (%)",
        help_text="Bu fırsatın kazanılma olasılığı yüzdesi (0-100)"
    )
    expected_close_date = models.DateField(verbose_name="Tahmini Kapanış Tarihi")
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name="opportunities", 
        verbose_name="Sorumlu Kişi"
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name="Kapanış Tarihi")
    
    class Meta:
        verbose_name = "Satış Fırsatı"
        verbose_name_plural = "Satış Fırsatları"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.company.name})"
    
    def save(self, *args, **kwargs):
        # Durum kazanıldı veya kaybedildi ise ve kapanış tarihi yok ise
        if (self.status.is_won or self.status.is_lost) and not self.closed_at:
            self.closed_at = timezone.now()
            
        # Durum ne kazanıldı ne de kaybedildi ise kapanış tarihini temizle
        if not self.status.is_won and not self.status.is_lost:
            self.closed_at = None
            
        # Durum kazanıldı ise olasılığı %100 yap
        if self.status.is_won:
            self.probability = 100
            
        # Durum kaybedildi ise olasılığı %0 yap
        if self.status.is_lost:
            self.probability = 0
            
        super().save(*args, **kwargs)


class OpportunityActivity(models.Model):
    """
    Satış fırsatlarına bağlı aktiviteler için model
    """
    ACTIVITY_TYPE_CHOICES = (
        ('note', 'Not'),
        ('call', 'Telefon'),
        ('meeting', 'Toplantı'),
        ('email', 'E-posta'),
        ('task', 'Görev'),
    )
    
    opportunity = models.ForeignKey(
        Opportunity, 
        on_delete=models.CASCADE, 
        related_name="activities", 
        verbose_name="Satış Fırsatı"
    )
    type = models.CharField(max_length=10, choices=ACTIVITY_TYPE_CHOICES, verbose_name="Aktivite Tipi")
    title = models.CharField(max_length=255, verbose_name="Başlık")
    description = models.TextField(verbose_name="Açıklama")
    performed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="activities", 
        verbose_name="Gerçekleştiren"
    )
    performed_at = models.DateTimeField(default=timezone.now, verbose_name="Gerçekleştirilme Tarihi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Oluşturulma Tarihi")
    
    class Meta:
        verbose_name = "Fırsat Aktivitesi"
        verbose_name_plural = "Fırsat Aktiviteleri"
        ordering = ['-performed_at']
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.title} ({self.opportunity.title})"

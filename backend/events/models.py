from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from customers.models import Company, Contact


class Event(models.Model):
    """
    Müşteriler ve firmalarla yapılan görüşmeler, toplantılar ve etkinlikler için model
    """
    EVENT_TYPE_CHOICES = [
        ('meeting', 'Toplantı'),
        ('call', 'Telefon Görüşmesi'),
        ('email', 'E-posta İletişimi'),
        ('visit', 'Ziyaret'),
        ('presentation', 'Sunum'),
        ('demo', 'Demo'),
        ('follow_up', 'Takip'),
        ('other', 'Diğer'),
    ]

    STATUS_CHOICES = [
        ('scheduled', 'Planlandı'),
        ('in_progress', 'Devam Ediyor'),
        ('completed', 'Tamamlandı'),
        ('cancelled', 'İptal Edildi'),
        ('postponed', 'Ertelendi'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('urgent', 'Acil'),
    ]

    title = models.CharField(max_length=255, verbose_name="Başlık")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='meeting',
        verbose_name="Etkinlik Tipi"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
        verbose_name="Durum"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name="Öncelik"
    )

    # İlişkiler
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
        verbose_name="İlişkili Firma"
    )
    contacts = models.ManyToManyField(
        Contact,
        related_name="events",
        blank=True,
        verbose_name="Katılımcı Kişiler"
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_events",
        verbose_name="Sorumlu Kişi"
    )

    # Tarih ve saat bilgileri
    start_datetime = models.DateTimeField(verbose_name="Başlangıç Tarihi ve Saati")
    end_datetime = models.DateTimeField(blank=True, null=True, verbose_name="Bitiş Tarihi ve Saati")

    # Hatırlatma
    reminder_datetime = models.DateTimeField(blank=True, null=True, verbose_name="Hatırlatma Tarihi")
    is_reminder_sent = models.BooleanField(default=False, verbose_name="Hatırlatma Gönderildi")

    # Lokasyon ve bağlantı bilgileri
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name="Lokasyon")
    meeting_url = models.URLField(blank=True, null=True, verbose_name="Toplantı Linki")

    # Notlar ve sonuçlar
    notes = models.TextField(blank=True, null=True, verbose_name="Notlar")
    outcome = models.TextField(blank=True, null=True, verbose_name="Sonuç")

    # Ekler
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Ekler",
        help_text="Dosya referansları için JSON formatında"
    )

    # Zaman damgaları
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="Tamamlanma Tarihi")

    class Meta:
        verbose_name = "Etkinlik"
        verbose_name_plural = "Etkinlikler"
        ordering = ["-start_datetime"]

    def __str__(self):
        return f"{self.title} - {self.get_event_type_display()}"

    def save(self, *args, **kwargs):
        # Durum tamamlandı ise ve tamamlanma tarihi yok ise
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()

        # Durum tamamlandı değil ise tamamlanma tarihini temizle
        if self.status != 'completed':
            self.completed_at = None
            
        # Eğer reminder_datetime ayarlanmamışsa, etkinlik başlangıcından 1 saat önce olarak ayarla
        if self.start_datetime and not self.reminder_datetime:
            self.reminder_datetime = self.start_datetime - timedelta(hours=1)

        super().save(*args, **kwargs)

    def clean(self):
        """
        Etkinlik ya bir firmaya ya da en az bir kişiye bağlı olmalıdır.
        """
        from django.core.exceptions import ValidationError

        if not self.company and not self.contacts.exists():
            raise ValidationError("Etkinlik en az bir firma veya kişiye bağlı olmalıdır.")


class EventParticipant(models.Model):
    """
    Etkinlik katılımcıları için ayrı model (daha detaylı takip için)
    """
    PARTICIPATION_STATUS_CHOICES = [
        ('invited', 'Davet Edildi'),
        ('accepted', 'Kabul Etti'),
        ('declined', 'Reddetti'),
        ('tentative', 'Belirsiz'),
        ('attended', 'Katıldı'),
        ('no_show', 'Gelmedi'),
    ]

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="participants",
        verbose_name="Etkinlik"
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        verbose_name="Katılımcı"
    )
    status = models.CharField(
        max_length=20,
        choices=PARTICIPATION_STATUS_CHOICES,
        default='invited',
        verbose_name="Katılım Durumu"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notlar")
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Etkinlik Katılımcısı"
        verbose_name_plural = "Etkinlik Katılımcıları"
        unique_together = ['event', 'contact']

    def __str__(self):
        return f"{self.contact} - {self.event.title}"

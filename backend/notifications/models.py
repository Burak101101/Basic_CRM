from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class Notification(models.Model):
    """
    Sistem bildirimleri için model
    """
    NOTIFICATION_TYPE_CHOICES = [
        ('reminder', 'Hatırlatma'),
        ('event', 'Etkinlik'),
        ('event_updated', 'Hatırlatma'),  # "Etkinlik Güncellendi" bildirimini "Hatırlatma" olarak göster
        ('email', 'E-posta'),
        ('task', 'Görev'),
        ('system', 'Sistem'),
        ('info', 'Bilgi'),
        ('warning', 'Uyarı'),
        ('error', 'Hata'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Düşük'),
        ('medium', 'Orta'),
        ('high', 'Yüksek'),
        ('urgent', 'Acil'),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Alıcı"
    )
    title = models.CharField(max_length=255, verbose_name="Başlık")
    message = models.TextField(verbose_name="Mesaj")
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='info',
        verbose_name="Bildirim Tipi"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name="Öncelik"
    )

    # Generic foreign key - herhangi bir modele bağlanabilir
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name="İçerik Tipi"
    )
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="Nesne ID")
    content_object = GenericForeignKey('content_type', 'object_id')

    # Durum bilgileri
    is_read = models.BooleanField(default=False, verbose_name="Okundu")
    is_sent = models.BooleanField(default=False, verbose_name="Gönderildi")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Okunma Tarihi")
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name="Gönderilme Tarihi")

    # Ek bilgiler
    action_url = models.URLField(blank=True, null=True, verbose_name="Aksiyon URL")
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Meta Veriler",
        help_text="Ek bilgiler için JSON formatında"
    )

    # Zaman damgaları
    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Bildirim"
        verbose_name_plural = "Bildirimler"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.recipient.username}"

    def mark_as_read(self):
        """Bildirimi okundu olarak işaretle"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            
    def mark_as_sent(self):
        """Bildirimi gönderildi olarak işaretle"""
        if not self.is_sent:
            self.is_sent = True
            self.sent_at = timezone.now()
            self.save(update_fields=['is_sent', 'sent_at'])

    @classmethod
    def create_meeting_created(cls, event, user):
        """Toplantı oluşturulduğunda bildirim oluştur"""
        return cls.objects.create(
            recipient=user,
            notification_type='event',
            priority='medium',
            title=f"Yeni Toplantı: {event.title}",
            message=f"'{event.title}' toplantısı oluşturuldu.",
            content_object=event,
            action_url=f"/events/{event.id}",
            metadata={
                'event_id': event.id,
                'event_type': event.event_type,
                'start_datetime': event.start_datetime.isoformat(),
            }
        )

    @classmethod
    def create_meeting_reminder(cls, event, user, reminder_datetime=None):
        """Toplantı hatırlatması oluştur - is_sent=False olarak başlar ve sadece reminder_datetime zamanında gönderilir"""
        return cls.objects.create(
            recipient=user,
            notification_type='reminder',
            priority='high',
            title=f"Toplantı Hatırlatması: {event.title}",
            message=f"'{event.title}' toplantısı yaklaşıyor.",
            content_object=event,
            action_url=f"/events/{event.id}",
            is_sent=False,  # Hatırlatma zamanı geldiğinde e-posta gönderilecek
            metadata={
                'event_id': event.id,
                'event_type': event.event_type,
                'start_datetime': event.start_datetime.isoformat(),
                'reminder_datetime': reminder_datetime.isoformat() if reminder_datetime else None,
            }
        )


class NotificationPreference(models.Model):
    """
    Kullanıcı bildirim tercihleri
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        verbose_name="Kullanıcı"
    )

    # E-posta bildirimleri
    email_reminders = models.BooleanField(default=True, verbose_name="E-posta Hatırlatmaları")
    email_events = models.BooleanField(default=True, verbose_name="E-posta Etkinlik Bildirimleri")
    email_tasks = models.BooleanField(default=True, verbose_name="E-posta Görev Bildirimleri")
    email_system = models.BooleanField(default=True, verbose_name="E-posta Sistem Bildirimleri")

    # Web bildirimleri
    web_reminders = models.BooleanField(default=True, verbose_name="Web Hatırlatmaları")
    web_events = models.BooleanField(default=True, verbose_name="Web Etkinlik Bildirimleri")
    web_tasks = models.BooleanField(default=True, verbose_name="Web Görev Bildirimleri")
    web_system = models.BooleanField(default=True, verbose_name="Web Sistem Bildirimleri")

    # Genel ayarlar
    quiet_hours_start = models.TimeField(null=True, blank=True, verbose_name="Sessiz Saatler Başlangıç")
    quiet_hours_end = models.TimeField(null=True, blank=True, verbose_name="Sessiz Saatler Bitiş")

    created_at = models.DateTimeField(default=timezone.now, verbose_name="Oluşturulma Tarihi")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Güncellenme Tarihi")

    class Meta:
        verbose_name = "Bildirim Tercihi"
        verbose_name_plural = "Bildirim Tercihleri"

    def __str__(self):
        return f"{self.user.username} - Bildirim Tercihleri"

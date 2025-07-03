from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from events.models import Event
from .models import Notification, NotificationPreference
from .tasks import send_meeting_created_email


@receiver(post_save, sender=Event)
def create_event_notifications(sender, instance, created, **kwargs):
    """
    Etkinlik oluşturulduğunda veya güncellendiğinde bildirim oluştur
    """
    if created:
        # Yeni etkinlik oluşturuldu
        if instance.event_type == 'meeting':
            # Toplantı oluşturuldu bildirimi
            if instance.assigned_to:
                Notification.create_meeting_created(instance, instance.assigned_to)
            
            # Etkinlik oluşturulduğu anda katılımcılar için mail gönder
            if instance.assigned_to:
                # Task'ı başlat
                send_meeting_created_email.delay(
                    instance.id,
                    instance.assigned_to.id
                )
            
            # Toplantı hatırlatması için bildirimi hatırlatma zamanına göre oluştur
            # Bu bildirim otomatik olarak gönderilmeyecek, sadece zamanı gelince gönderilecek
            if instance.assigned_to and instance.reminder_datetime:
                Notification.create_meeting_reminder(
                    instance,
                    instance.assigned_to,
                    instance.reminder_datetime
                )
    else:
        # Etkinlik güncellendi - artık "event_updated" tipi kullanılacak ve başlık "Toplantı Hatırlatması" olacak
        if instance.assigned_to:
            # Varsa önceki hatırlatma bildirimlerini sil
            Notification.objects.filter(
                recipient=instance.assigned_to,
                notification_type__in=['reminder', 'event_updated'],  # Hem eski reminder hem de event_updated bildirimlerini sil
                object_id=instance.id,
                content_type__model='event'
            ).delete()
            
            # Güncelleme bildirimini "Toplantı Hatırlatması" başlığı ile oluştur
            if instance.event_type == 'meeting':
                Notification.objects.create(
                    recipient=instance.assigned_to,
                    notification_type='event_updated',  # event_updated tipi kullan ama görünümü "Hatırlatma" olacak
                    priority='high',
                    title=f"Toplantı Hatırlatması: {instance.title}",
                    message=f"'{instance.title}' toplantısı yaklaşıyor.",
                    content_object=instance,
                    action_url=f"/events/{instance.id}",
                    is_sent=True,  # Hemen gönder
                    metadata={
                        'event_id': instance.id,
                        'event_type': instance.event_type,
                        'start_datetime': instance.start_datetime.isoformat(),
                        'reminder_datetime': instance.reminder_datetime.isoformat() if instance.reminder_datetime else None,
                    }
                )


@receiver(post_delete, sender=Event)
def create_event_deletion_notification(sender, instance, **kwargs):
    """
    Etkinlik silindiğinde bildirim oluştur
    """
    if instance.assigned_to:
        Notification.objects.create(
            recipient=instance.assigned_to,
            notification_type='event_cancelled',
            priority='high',
            title=f"Etkinlik İptal Edildi: {instance.title}",
            message=f"'{instance.title}' etkinliği iptal edildi/silindi.",
            metadata={
                'event_id': instance.id,
                'event_type': instance.event_type,
                'cancelled_at': instance.updated_at.isoformat() if instance.updated_at else None,
            }
        )


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """
    Yeni kullanıcı oluşturulduğunda varsayılan bildirim tercihlerini oluştur
    """
    if created:
        NotificationPreference.objects.get_or_create(
            user=instance,
            defaults={
                'email_reminders': True,
                'email_events': True,
                'email_tasks': True,
                'email_system': True,
                'web_reminders': True,
                'web_events': True,
                'web_tasks': True,
                'web_system': True,
            }
        )

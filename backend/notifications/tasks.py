import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from celery import shared_task
from celery.exceptions import Retry

from .models import Notification
from events.models import Event
from authentication.models import UserProfile
from communications.smtp_service import smtp_service

logger = logging.getLogger(__name__)


def get_sender_email(user):
    """
    Kullanıcının SMTP ayarlarından e-posta adresini alır
    """
    try:
        profile = UserProfile.objects.get(user=user)
        if profile.smtp_username:
            return profile.smtp_username
        return user.email
    except UserProfile.DoesNotExist:
        return user.email
    except Exception as e:
        logger.error(f"Sender email error: {e}")
        return user.email


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_meeting_created_email(self, event_id, user_id):
    """
    Toplantı oluşturulduğunda e-posta gönder
    """
    try:
        event = Event.objects.get(id=event_id)
        user_profile = UserProfile.objects.get(user_id=user_id)
        
        # E-posta içeriği hazırla
        subject = f"Yeni Toplantı: {event.title}"
        
        # HTML içerik - gelişmiş şablon kullan - direkt Django şablonunu render et
        # Şablon için context hazırla
        context = {
            'event': event,
            'user_profile': user_profile,
            'contacts': event.contacts.all() if event.contacts.exists() else []
        }
        
        # HTML şablonunu render et
        html_content = render_to_string('emails/meeting_created.html', context)
        
        # Katılımcıların e-postalarını ekle
        participant_emails = []
        for contact in event.contacts.all():
            if contact.email:
                participant_emails.append(contact.email)
        
        # SMTP ayarlarını kontrol et
        if user_profile.smtp_server and user_profile.smtp_username and user_profile.smtp_password:
            smtp_config = {
                'smtp_server': user_profile.smtp_server,
                'smtp_port': user_profile.smtp_port or 587,
                'smtp_username': user_profile.smtp_username,
                'smtp_password': user_profile.smtp_password,
                'use_tls': user_profile.use_tls,
            }
            
            # Communications uygulamasının SMTP servisini kullanarak e-posta gönder
            from_email = user_profile.smtp_username
            from_name = f"{user_profile.user.first_name} {user_profile.user.last_name}"
            success, message, response = smtp_service.send_email(
                from_email=from_email,
                from_name=from_name,
                to_emails=[user_profile.user.email],
                subject=subject,
                content=html_content,
                cc_emails=participant_emails if participant_emails else None,
                smtp_config=smtp_config
            )
            
            if not success:
                logger.error(f"Error sending email via SMTP service: {message}")
                raise Exception(f"SMTP error: {message}")
            
        else:
            logger.error("SMTP configuration not found for user")
            raise Exception("SMTP configuration not found for user")
        
        logger.info(f"Meeting created email sent for event {event_id} to user {user_id}")
        return f"Email sent successfully for event {event_id}"
        
    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        return f"Event {event_id} not found"
    except UserProfile.DoesNotExist:
        logger.error(f"UserProfile for user {user_id} not found")
        return f"UserProfile for user {user_id} not found"
    except Exception as exc:
        logger.error(f"Error sending meeting created email: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return f"Failed to send email after {self.max_retries} retries: {exc}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_meeting_reminder_email(self, event_id, user_id, reminder_minutes=60):
    """
    Toplantı hatırlatması e-postası gönder
    """
    try:
        event = Event.objects.get(id=event_id)
        user_profile = UserProfile.objects.get(user_id=user_id)
        
        # Toplantı zamanı kontrolü
        time_until_meeting = event.start_datetime - timezone.now()
        if time_until_meeting.total_seconds() < 0:
            logger.warning(f"Meeting {event_id} has already started")
            return f"Meeting {event_id} has already started"
        
        # E-posta içeriği hazırla
        subject = f"Toplantı Hatırlatması: {event.title} ({reminder_minutes} dakika kaldı)"
        
        # HTML içerik - gelişmiş şablon kullan - direkt Django şablonunu render et
        # Kalan süreye göre aciliyet rengi
        urgency_color = '#3b82f6'  # Normal durum - mavi
        if reminder_minutes <= 15:
            urgency_color = '#ef4444'  # Acil durum - kırmızı
        elif reminder_minutes <= 30:
            urgency_color = '#f59e0b'  # Yaklaşan - turuncu
        
        # Şablon için context hazırla
        context = {
            'event': event,
            'user_profile': user_profile,
            'remaining_minutes': reminder_minutes,
            'urgency_color': urgency_color,
            'contacts': event.contacts.all() if event.contacts.exists() else []
        }
        
        # HTML şablonunu render et
        html_content = render_to_string('emails/meeting_reminder.html', context)
        
        # Katılımcıların e-postalarını ekle
        participant_emails = []
        for contact in event.contacts.all():
            if contact.email:
                participant_emails.append(contact.email)
        
        # SMTP ayarlarını kontrol et
        if user_profile.smtp_server and user_profile.smtp_username and user_profile.smtp_password:
            smtp_config = {
                'smtp_server': user_profile.smtp_server,
                'smtp_port': user_profile.smtp_port or 587,
                'smtp_username': user_profile.smtp_username,
                'smtp_password': user_profile.smtp_password,
                'use_tls': user_profile.use_tls,
            }
            
            # Communications uygulamasının SMTP servisini kullanarak e-posta gönder
            from_email = user_profile.smtp_username
            from_name = f"{user_profile.user.first_name} {user_profile.user.last_name}"
            success, message, response = smtp_service.send_email(
                from_email=from_email,
                from_name=from_name,
                to_emails=[user_profile.user.email],
                subject=subject,
                content=html_content,
                cc_emails=participant_emails if participant_emails else None,
                smtp_config=smtp_config
            )
            
            if not success:
                logger.error(f"Error sending email via SMTP service: {message}")
                raise Exception(f"SMTP error: {message}")
        
        else:
            logger.error("SMTP configuration not found for user")
            raise Exception("SMTP configuration not found for user")
        
        logger.info(f"Meeting reminder email sent for event {event_id} to user {user_id}")
        return f"Reminder email sent successfully for event {event_id}"
        
    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        return f"Event {event_id} not found"
    except UserProfile.DoesNotExist:
        logger.error(f"UserProfile for user {user_id} not found")
        return f"UserProfile for user {user_id} not found"
    except Exception as exc:
        logger.error(f"Error sending meeting reminder email: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return f"Failed to send reminder email after {self.max_retries} retries: {exc}"


@shared_task
def send_pending_meeting_reminders():
    """
    Bekleyen toplantı hatırlatmalarını gönder - sadece hatırlatma zamanı gelmiş ve henüz gönderilmemiş olanları
    """
    now = timezone.now()
    logger.info(f"Checking for meeting reminders at {now.isoformat()}")
    
    # Gönderilmemiş ve zamanı gelmiş bildirimleri bul
    # Bildirim zamanı şu andan önce olan ve gönderilmemiş bildirimleri bul
    pending_notifications = Notification.objects.filter(
        notification_type='reminder',
        is_sent=False
    ).exclude(metadata__reminder_datetime__isnull=True)
    
    # Bu şekilde filtreliyoruz çünkü JSONField içinde datetime karşılaştırması yaparken sorun çıkabilir
    reminders_to_send = []
    for notification in pending_notifications:
        if 'reminder_datetime' in notification.metadata:
            reminder_time_str = notification.metadata['reminder_datetime']
            try:
                reminder_time = timezone.datetime.fromisoformat(reminder_time_str)
                if reminder_time <= now:
                    reminders_to_send.append(notification)
            except (ValueError, TypeError) as e:
                logger.error(f"Invalid reminder_datetime format in notification {notification.id}: {e}")
    
    logger.info(f"Found {len(reminders_to_send)} meeting reminders to send")
    pending_notifications = reminders_to_send
    
    sent_count = 0
    for notification in pending_notifications:
        try:
            if notification.content_object and notification.content_object.assigned_to:
                # Kalan dakikayı hesapla
                remaining_minutes = 60  # Varsayılan değer
                if 'start_datetime' in notification.metadata:
                    start_time = timezone.datetime.fromisoformat(notification.metadata['start_datetime'])
                    remaining_seconds = (start_time - now).total_seconds()
                    remaining_minutes = max(1, int(remaining_seconds / 60))
                
                # 1. E-posta gönder
                send_meeting_reminder_email.delay(
                    notification.content_object.id,
                    notification.content_object.assigned_to.id,
                    remaining_minutes
                )
                
                # 2. Sistem içi bildirim olarak aktifleştir
                # Bildirim zaten veritabanında var, sadece is_sent=True yapılacak
                notification.is_sent = True
                notification.sent_at = timezone.now()
                notification.save(update_fields=['is_sent', 'sent_at'])
                
                # Aynı zamanda etkinlik modelindeki hatırlatma durumunu da güncelle
                if notification.content_object:
                    event = notification.content_object
                    event.is_reminder_sent = True
                    event.save(update_fields=['is_reminder_sent'])
                
                sent_count += 1
                
        except Exception as e:
            logger.error(f"Error processing notification {notification.id}: {e}")
    
    logger.info(f"Processed {sent_count} meeting reminder notifications")
    return f"Sent {sent_count} meeting reminder emails and activated {sent_count} in-system notifications"


@shared_task
def send_pending_email_reminders():
    """
    Bekleyen e-posta bildirimlerini gönder (toplantı hatırlatmaları hariç)
    """
    now = timezone.now()
    
    # Gönderilmemiş e-posta bildirimlerini bul (reminder tipi hariç - onlar ayrı işleniyor)
    pending_notifications = Notification.objects.filter(
        notification_type__in=['event', 'event_cancelled'],  # 'event_updated' tipini çıkardık, onları 'reminder' olarak işleyeceğiz
        is_sent=False
    )
    
    sent_count = 0
    for notification in pending_notifications:
        try:
            if notification.content_object and notification.content_object.assigned_to:
                if notification.notification_type == 'meeting_created':
                    send_meeting_created_email.delay(
                        notification.content_object.id,
                        notification.content_object.assigned_to.id
                    )
                
                # Bildirimi gönderildi olarak işaretle
                notification.mark_as_sent()
                sent_count += 1
                
        except Exception as e:
            logger.error(f"Error processing email notification {notification.id}: {e}")
    
    logger.info(f"Processed {sent_count} email reminder notifications")
    return f"Sent {sent_count} email reminder notifications"


@shared_task
def cleanup_old_notifications():
    """
    Eski bildirimleri temizle (30 günden eski okunmuş bildirimler)
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    
    # 30 günden eski okunmuş bildirimleri sil
    deleted_count = Notification.objects.filter(
        is_read=True,
        read_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old notifications")
    return f"Cleaned up {deleted_count} old notifications"


@shared_task(bind=True, max_retries=3)
def send_bulk_notification_emails(self, notification_ids):
    """
    Toplu bildirim e-postaları gönder
    """
    try:
        notifications = Notification.objects.filter(id__in=notification_ids)
        sent_count = 0
        
        for notification in notifications:
            try:
                if notification.recipient.email:
                    try:
                        user_profile = UserProfile.objects.get(user=notification.recipient)
                        
                        # SMTP ayarlarını kontrol et
                        if user_profile.smtp_server and user_profile.smtp_username and user_profile.smtp_password:
                            smtp_config = {
                                'smtp_server': user_profile.smtp_server,
                                'smtp_port': user_profile.smtp_port or 587,
                                'smtp_username': user_profile.smtp_username,
                                'smtp_password': user_profile.smtp_password,
                                'use_tls': user_profile.use_tls,
                            }
                            
                            # HTML içerik - gelişmiş şablon kullan - direkt Django şablonunu render et
                            # Şablon için context hazırla
                            context = {
                                'notification': notification
                            }
                            
                            # HTML şablonunu render et
                            html_content = render_to_string('emails/notification_email.html', context)
                            
                            # Communications uygulamasının SMTP servisini kullanarak e-posta gönder
                            from_email = user_profile.smtp_username
                            from_name = f"{notification.recipient.first_name} {notification.recipient.last_name}"
                            success, message, response = smtp_service.send_email(
                                from_email=from_email,
                                from_name=from_name,
                                to_emails=[notification.recipient.email],
                                subject=notification.title,
                                content=html_content,
                                smtp_config=smtp_config
                            )
                            
                            if not success:
                                logger.error(f"Error sending email via SMTP service: {message}")
                                raise Exception(f"SMTP error: {message}")
                            
                            # Başarılı gönderim durumunda bildirim güncelleme
                            notification.mark_as_sent()
                            sent_count += 1
                            logger.info(f"Notification email sent for notification {notification.id}")
                        else:
                            logger.error(f"SMTP configuration not found for user {notification.recipient.id}")
                            raise Exception("SMTP configuration not found for user")
                    except UserProfile.DoesNotExist:
                        logger.error(f"User profile not found for user {notification.recipient.id}")
                        raise Exception("User profile not found")
                    # Bu kısım yukarıda SMTP servisinde başarılı gönderim durumunda ele alındı
            except Exception as e:
                logger.error(f"Error sending email for notification {notification.id}: {e}")
        
        logger.info(f"Sent {sent_count} bulk notification emails")
        return f"Sent {sent_count} emails successfully"
        
    except Exception as exc:
        logger.error(f"Error in bulk email sending: {exc}")
        if self.request.retries < self.max_retries:
            raise self.retry(countdown=60, exc=exc)
        return f"Failed to send bulk emails after {self.max_retries} retries: {exc}"

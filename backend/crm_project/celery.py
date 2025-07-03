import os
from celery import Celery
from django.conf import settings

# Django ayarlarını yükle
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')

# Celery uygulamasını oluştur
app = Celery('crm_project')

# Django ayarlarından Celery konfigürasyonunu yükle
app.config_from_object('django.conf:settings', namespace='CELERY')

# Celery Beat Schedule - Periyodik görevler
app.conf.beat_schedule = {
    'send-meeting-reminders': {
        'task': 'notifications.tasks.send_pending_meeting_reminders',
        'schedule': 60.0,  # Her dakika çalıştır
    },
    'send-email-reminders': {
        'task': 'notifications.tasks.send_pending_email_reminders',
        'schedule': 300.0,  # Her 5 dakikada çalıştır
    },
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': 86400.0,  # Günde bir çalıştır
    },
}

app.conf.timezone = 'Europe/Istanbul'

# Django uygulamalarından task'ları otomatik olarak keşfet
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

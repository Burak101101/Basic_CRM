from celery import Celery

# Celery uygulamasını oluştur
app = Celery('customers')

# Django ayarlarından Celery konfigürasyonunu yükle
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django uygulamalarından task'ları otomatik olarak keşfet
app.autodiscover_tasks()
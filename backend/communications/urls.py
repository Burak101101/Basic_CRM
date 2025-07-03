from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailMessageViewSet, IncomingEmailViewSet

# DRF router oluşturup viewset'leri kaydedin
router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet)
# EmailConfigViewSet kaldırıldı - SMTP ayarları artık kullanıcı profilinde
router.register(r'messages', EmailMessageViewSet)
router.register(r'incoming-emails', IncomingEmailViewSet)

urlpatterns = [
    # DRF router URL'lerini dahil edin
    path('', include(router.urls)),
]

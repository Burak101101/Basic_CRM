from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailTemplateViewSet, EmailConfigViewSet, EmailMessageViewSet

# DRF router oluşturup viewset'leri kaydedin
router = DefaultRouter()
router.register(r'email-templates', EmailTemplateViewSet)
router.register(r'configs', EmailConfigViewSet)
router.register(r'messages', EmailMessageViewSet)

urlpatterns = [
    # DRF router URL'lerini dahil edin
    path('', include(router.urls)),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, ContactViewSet, NoteViewSet

# DRF router oluşturup viewset'leri kaydedin
router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = [
    # DRF router URL'lerini dahil edin
    path('', include(router.urls)),
]
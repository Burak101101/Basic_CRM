from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OpportunityStatusViewSet, OpportunityViewSet, OpportunityActivityViewSet

# DRF router oluşturup viewset'leri kaydedin
router = DefaultRouter()
router.register(r'statuses', OpportunityStatusViewSet)
router.register(r'opportunities', OpportunityViewSet)
# Kanban viewset'i için özel bir endpoint
router.register(r'opportunities/(?P<id>\d+)/change-status', OpportunityViewSet, basename='change-status')
router.register(r'activities', OpportunityActivityViewSet)

urlpatterns = [
    # DRF router URL'lerini dahil edin
    path('', include(router.urls)),
]

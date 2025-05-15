from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OpportunityStatusViewSet, OpportunityViewSet, OpportunityActivityViewSet

# DRF router oluşturup viewset'leri kaydedin
router = DefaultRouter()
router.register(r'statuses', OpportunityStatusViewSet)
router.register(r'opportunities', OpportunityViewSet)
router.register(r'activities', OpportunityActivityViewSet)

urlpatterns = [
    # DRF router URL'lerini dahil edin
    path('', include(router.urls)),
]

from django.urls import path
from . import views

urlpatterns = [
    # AI content generation endpoints
    path('email/compose/', views.generate_email_content, name='ai_generate_email_content'),
    path('email/reply/', views.generate_email_reply, name='ai_generate_email_reply'),
    path('opportunity/generate/', views.generate_opportunity_proposal, name='ai_generate_opportunity'),
    
    # AI status and history
    path('requests/', views.get_ai_requests, name='ai_requests'),
    path('status/', views.check_ai_status, name='ai_status'),
]

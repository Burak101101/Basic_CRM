from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    UserProfileView,
    ChangePasswordView,
    UserProfileEmailSettingsView,
    UserCompanyInfoView,
    UserImapSettingsView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/company-info/', UserCompanyInfoView.as_view(), name='user_company_info'),
    path('profile/email-settings/', UserProfileEmailSettingsView.as_view(), name='user_profile_email_settings'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('profile/imap-settings/', UserImapSettingsView.as_view(), name='user_imap_settings'),
]

"""
URL configuration for crm_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
# Temporarily disabled for development
# from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/customers/', include('customers.urls')),  # Customers API endpointleri
    path('api/v1/communications/', include('communications.urls')),  # Communications API endpointleri
    path('api/v1/opportunities/', include('opportunities.urls')),  # Opportunities API endpointleri
    path('api/v1/auth/', include('authentication.urls')),  # Authentication API endpointleri
    path('api-auth/', include('rest_framework.urls')),  # DRF login/logout için
    # Temporarily disabled for development
    # path('docs/', include_docs_urls(title='CRM API')),  # API dokümantasyonu
]

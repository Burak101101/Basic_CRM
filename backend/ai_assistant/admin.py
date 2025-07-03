from django.contrib import admin
from .models import AIConfiguration, AIRequest


@admin.register(AIConfiguration)
class AIConfigurationAdmin(admin.ModelAdmin):
    """
    AI konfigürasyonu için admin panel yapılandırması
    """
    list_display = ('name', 'provider', 'model_name', 'is_active', 'is_default', 'created_at')
    list_filter = ('provider', 'is_active', 'is_default')
    search_fields = ('name', 'model_name')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Genel Bilgiler', {
            'fields': ('name', 'provider', 'model_name', 'is_active', 'is_default')
        }),
        ('API Ayarları', {
            'fields': ('api_url', 'api_key', 'max_tokens', 'temperature'),
            'description': 'OpenRouter API ayarları'
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    """
    AI istekleri için admin panel yapılandırması
    """
    list_display = ('user', 'request_type', 'status', 'created_at', 'completed_at')
    list_filter = ('request_type', 'status', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'completed_at')

    fieldsets = (
        ('İstek Bilgileri', {
            'fields': ('user', 'request_type', 'status')
        }),
        ('Veri', {
            'fields': ('input_data', 'context_data', 'ai_response', 'response_metadata'),
            'classes': ('collapse',)
        }),
        ('İlişkiler', {
            'fields': ('company_id', 'contact_id', 'opportunity_id', 'email_id'),
            'classes': ('collapse',)
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'completed_at'),
            'classes': ('collapse',)
        }),
        ('Hata Bilgileri', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        # AI istekleri manuel olarak eklenmemeli
        return False

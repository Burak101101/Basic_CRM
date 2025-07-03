from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Kullanıcı profili için admin panel yapılandırması
    """
    list_display = ('user', 'smtp_server', 'smtp_port', 'smtp_username')
    list_filter = ('use_tls',)
    search_fields = ('user__username', 'user__email', 'smtp_server', 'smtp_username')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Kullanıcı Bilgileri', {
            'fields': ('user',)
        }),
        ('SMTP Ayarları (E-posta Gönderimi)', {
            'fields': ('smtp_server', 'smtp_port', 'smtp_username', 'smtp_password', 'use_tls'),
            'description': 'E-posta gönderimi için SMTP sunucu ayarları. Gönderen bilgileri SMTP kullanıcı adından alınır.'
        }),
        ('IMAP Ayarları (E-posta Alma)', {
            'fields': ('imap_server', 'imap_port', 'imap_username', 'imap_password', 'use_imap_ssl'),
            'description': 'E-posta alma için IMAP sunucu ayarları.'
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # Şifre alanını admin panelinde gizle (güvenlik için)
        readonly = list(self.readonly_fields)
        if obj:  # Düzenleme modunda
            readonly.append('smtp_password')
        return readonly

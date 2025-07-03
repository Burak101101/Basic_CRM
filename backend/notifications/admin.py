from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """
    Bildirimler için admin panel yapılandırması
    """
    list_display = (
        'title', 'recipient', 'notification_type', 'priority',
        'is_read', 'is_sent', 'created_at'
    )
    list_filter = (
        'notification_type', 'priority', 'is_read', 'is_sent',
        'created_at', 'read_at', 'sent_at'
    )
    search_fields = (
        'title', 'message', 'recipient__username',
        'recipient__first_name', 'recipient__last_name'
    )
    readonly_fields = ('created_at', 'updated_at', 'read_at', 'sent_at')

    fieldsets = (
        (None, {
            'fields': ('recipient', 'title', 'message', 'notification_type', 'priority')
        }),
        ('İçerik Bağlantısı', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Durum', {
            'fields': ('is_read', 'is_sent', 'read_at', 'sent_at')
        }),
        ('Ek Bilgiler', {
            'fields': ('action_url', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient', 'content_type')

    actions = ['mark_as_read', 'mark_as_sent']

    def mark_as_read(self, request, queryset):
        """Seçili bildirimleri okundu olarak işaretle"""
        updated = 0
        for notification in queryset:
            if not notification.is_read:
                notification.mark_as_read()
                updated += 1

        self.message_user(
            request,
            f'{updated} bildirim okundu olarak işaretlendi.'
        )
    mark_as_read.short_description = "Seçili bildirimleri okundu olarak işaretle"

    def mark_as_sent(self, request, queryset):
        """Seçili bildirimleri gönderildi olarak işaretle"""
        updated = 0
        for notification in queryset:
            if not notification.is_sent:
                notification.mark_as_sent()
                updated += 1

        self.message_user(
            request,
            f'{updated} bildirim gönderildi olarak işaretlendi.'
        )
    mark_as_sent.short_description = "Seçili bildirimleri gönderildi olarak işaretle"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """
    Bildirim tercihleri için admin panel yapılandırması
    """
    list_display = (
        'user', 'email_reminders', 'email_events', 'web_reminders',
        'web_events', 'created_at'
    )
    list_filter = (
        'email_reminders', 'email_events', 'email_tasks', 'email_system',
        'web_reminders', 'web_events', 'web_tasks', 'web_system',
        'created_at'
    )
    search_fields = ('user__username', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('user',)
        }),
        ('E-posta Bildirimleri', {
            'fields': (
                'email_reminders', 'email_events',
                'email_tasks', 'email_system'
            )
        }),
        ('Web Bildirimleri', {
            'fields': (
                'web_reminders', 'web_events',
                'web_tasks', 'web_system'
            )
        }),
        ('Genel Ayarlar', {
            'fields': ('quiet_hours_start', 'quiet_hours_end')
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

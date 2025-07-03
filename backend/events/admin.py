from django.contrib import admin
from .models import Event, EventParticipant


class EventParticipantInline(admin.TabularInline):
    """
    Etkinlik detay sayfasında katılımcıları düzenleme alanı
    """
    model = EventParticipant
    extra = 1
    fields = ('contact', 'status', 'notes')


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    Etkinlikler için admin panel yapılandırması
    """
    list_display = (
        'title', 'event_type', 'status', 'priority', 'company',
        'assigned_to', 'start_datetime', 'created_at'
    )
    list_filter = ('event_type', 'status', 'priority', 'start_datetime', 'created_at')
    search_fields = (
        'title', 'description', 'location', 'company__name',
        'contacts__first_name', 'contacts__last_name'
    )
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    filter_horizontal = ('contacts',)
    inlines = [EventParticipantInline]

    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'event_type', 'status', 'priority')
        }),
        ('İlişkiler', {
            'fields': ('company', 'contacts', 'assigned_to')
        }),
        ('Tarih ve Saat', {
            'fields': ('start_datetime', 'end_datetime', 'reminder_datetime')
        }),
        ('Lokasyon ve Bağlantı', {
            'fields': ('location', 'meeting_url')
        }),
        ('Notlar ve Sonuç', {
            'fields': ('notes', 'outcome')
        }),
        ('Hatırlatma', {
            'fields': ('is_reminder_sent',)
        }),
        ('Ekler', {
            'fields': ('attachments',),
            'classes': ('collapse',)
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'company', 'assigned_to'
        ).prefetch_related('contacts')


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    """
    Etkinlik katılımcıları için admin panel yapılandırması
    """
    list_display = ('event', 'contact', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = (
        'event__title', 'contact__first_name', 'contact__last_name',
        'contact__email'
    )
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {
            'fields': ('event', 'contact', 'status')
        }),
        ('Notlar', {
            'fields': ('notes',)
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

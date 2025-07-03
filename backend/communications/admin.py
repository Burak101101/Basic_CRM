from django.contrib import admin
from .models import EmailTemplate, EmailMessage, IncomingEmail


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    """
    E-posta şablonları için admin panel yapılandırması
    """
    list_display = ('name', 'subject', 'created_at', 'updated_at')
    search_fields = ('name', 'subject', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'subject', 'content')
        }),
        ('Özelleştirme', {
            'fields': ('variables',),
            'classes': ('collapse',),
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    """
    E-posta mesajları için admin panel yapılandırması
    """
    list_display = ('subject', 'sender', 'status', 'company', 'contact', 'created_at', 'sent_at')
    list_filter = ('status', 'created_at', 'sent_at')
    search_fields = ('subject', 'content', 'sender', 'company__name', 'contact__first_name', 'contact__last_name')
    readonly_fields = ('created_at', 'sent_at', 'status', 'error_message')
    fieldsets = (
        (None, {
            'fields': ('subject', 'content', 'sender')
        }),
        ('Alıcılar', {
            'fields': ('recipients', 'cc', 'bcc')
        }),
        ('İlişkiler', {
            'fields': ('company', 'contact')
        }),
        ('Durum', {
            'fields': ('status', 'error_message', 'created_at', 'sent_at')
        }),
        ('Dosyalar ve Meta Veriler', {
            'fields': ('attachments', 'metadata'),
            'classes': ('collapse',),
        }),
    )


# EmailConfigAdmin kaldırıldı - SMTP ayarları artık kullanıcı profilinde


@admin.register(IncomingEmail)
class IncomingEmailAdmin(admin.ModelAdmin):
    """
    Gelen e-postalar için admin panel yapılandırması
    """
    list_display = ('subject', 'sender_email', 'sender_name', 'status', 'company', 'contact', 'received_at', 'has_attachments')
    list_filter = ('status', 'received_at', 'has_attachments', 'company')
    search_fields = ('subject', 'content', 'sender_email', 'sender_name', 'company__name', 'contact__first_name', 'contact__last_name')
    readonly_fields = ('message_id', 'received_at', 'created_at', 'updated_at', 'raw_headers')
    date_hierarchy = 'received_at'

    fieldsets = (
        (None, {
            'fields': ('message_id', 'subject', 'content', 'content_html')
        }),
        ('Gönderen', {
            'fields': ('sender_email', 'sender_name')
        }),
        ('Alıcılar', {
            'fields': ('recipients', 'cc', 'bcc')
        }),
        ('İlişkiler', {
            'fields': ('company', 'contact')
        }),
        ('Durum ve Tarihler', {
            'fields': ('status', 'received_at', 'created_at', 'updated_at')
        }),
        ('Ek Dosyalar', {
            'fields': ('has_attachments', 'attachments'),
            'classes': ('collapse',),
        }),
        ('Teknik Bilgiler', {
            'fields': ('raw_headers',),
            'classes': ('collapse',),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('company', 'contact')

from django.contrib import admin
from .models import EmailTemplate, EmailMessage, EmailConfig


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


@admin.register(EmailConfig)
class EmailConfigAdmin(admin.ModelAdmin):
    """
    E-posta konfigürasyonları için admin panel yapılandırması
    """
    list_display = ('name', 'email_address', 'smtp_server', 'is_active', 'is_default')
    list_filter = ('is_active', 'is_default', 'use_tls')
    search_fields = ('name', 'email_address', 'smtp_server')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'is_active', 'is_default')
        }),
        ('E-posta Bilgileri', {
            'fields': ('email_address', 'display_name')
        }),
        ('Sunucu Ayarları', {
            'fields': ('smtp_server', 'smtp_port', 'use_tls', 'username', 'password')
        }),
        ('Zaman Damgaları', {
            'fields': ('created_at', 'updated_at')
        }),
    )

from django.contrib import admin
from .models import Company, Contact, Note


class ContactInline(admin.TabularInline):
    """
    Firma detay sayfasında iletişim kişilerini düzenleme alanı
    """
    model = Contact
    extra = 1  # Yeni bir iletişim kişisi eklemek için boş bir form göster


class NoteInline(admin.TabularInline):
    """
    Firma veya kişi detay sayfasında notları düzenleme alanı
    """
    model = Note
    extra = 1
    fk_name = 'company'  # Varsayılan olarak firma bağlantısını kullan


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """
    Firma admin paneli yapılandırması
    """
    list_display = ('name', 'industry', 'company_size', 'phone', 'email', 'get_contacts_count')
    list_filter = ('industry', 'company_size', 'created_at')
    search_fields = ('name', 'tax_number', 'industry', 'email', 'phone', 'linkedin_url', 'website_url')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ContactInline, NoteInline]

    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('name', 'tax_number', 'industry', 'company_size')
        }),
        ('İletişim Bilgileri', {
            'fields': ('phone', 'email', 'address')
        }),
        ('Web ve Sosyal Medya', {
            'fields': ('linkedin_url', 'website_url', 'other_links')
        }),
        ('Sistem Bilgileri', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_contacts_count(self, obj):
        return obj.contacts.count()
    get_contacts_count.short_description = 'İrtibat Kişisi Sayısı'


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """
    İletişim kişisi admin paneli yapılandırması
    """
    list_display = ('full_name', 'company', 'position', 'lead_status', 'lead_source', 'phone', 'email', 'is_primary')
    list_filter = ('company', 'lead_status', 'lead_source', 'is_primary', 'created_at')
    search_fields = ('first_name', 'last_name', 'position', 'email', 'phone', 'company__name', 'linkedin_url')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('company',)
    autocomplete_fields = ['company']

    fieldsets = (
        ('Temel Bilgiler', {
            'fields': ('company', 'first_name', 'last_name', 'position', 'is_primary')
        }),
        ('İletişim Bilgileri', {
            'fields': ('phone', 'email')
        }),
        ('Lead Bilgileri', {
            'fields': ('lead_source', 'lead_status')
        }),
        ('Web ve Sosyal Medya', {
            'fields': ('linkedin_url', 'personal_website', 'other_links')
        }),
        ('Sistem Bilgileri', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Ad Soyad'


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    """
    Not admin paneli yapılandırması
    """
    list_display = ('title', 'company', 'contact', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'content', 'company__name', 'contact__first_name', 'contact__last_name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'content')
        }),
        ('İlişkiler', {
            'fields': ('company', 'contact')
        }),
        ('Tarihler', {
            'fields': ('created_at', 'updated_at')
        }),
    )

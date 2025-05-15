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
    list_display = ('name', 'industry', 'phone', 'email', 'get_contacts_count')
    list_filter = ('industry', 'created_at')
    search_fields = ('name', 'tax_number', 'industry', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [ContactInline, NoteInline]
    inlines = [ContactInline, NoteInline]
    
    def get_contacts_count(self, obj):
        return obj.contacts.count()
    get_contacts_count.short_description = 'İrtibat Kişisi Sayısı'


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """
    İletişim kişisi admin paneli yapılandırması
    """
    list_display = ('full_name', 'company', 'position', 'phone', 'email', 'is_primary')
    list_filter = ('company', 'is_primary', 'created_at')
    search_fields = ('first_name', 'last_name', 'position', 'email', 'phone', 'company__name')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('company',)
    autocomplete_fields = ['company']
    
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

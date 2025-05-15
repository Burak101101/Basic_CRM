from django.contrib import admin
from .models import OpportunityStatus, Opportunity, OpportunityActivity


@admin.register(OpportunityStatus)
class OpportunityStatusAdmin(admin.ModelAdmin):
    """
    Fırsat durumları için admin panel yapılandırması
    """
    list_display = ('name', 'order', 'color', 'is_default', 'is_won', 'is_lost')
    list_editable = ('order', 'color', 'is_default', 'is_won', 'is_lost')
    search_fields = ('name', 'description')


class OpportunityActivityInline(admin.TabularInline):
    """
    Fırsat detay sayfasında aktiviteleri düzenleme alanı
    """
    model = OpportunityActivity
    extra = 1
    fields = ('type', 'title', 'description', 'performed_by', 'performed_at')


@admin.register(Opportunity)
class OpportunityAdmin(admin.ModelAdmin):
    """
    Satış fırsatları için admin panel yapılandırması
    """
    list_display = ('title', 'company', 'status', 'value', 'priority', 'probability', 
                    'expected_close_date', 'assigned_to', 'created_at', 'closed_at')
    list_filter = ('status', 'priority', 'created_at', 'expected_close_date', 'closed_at', 'assigned_to')
    search_fields = ('title', 'description', 'company__name')
    readonly_fields = ('created_at', 'updated_at', 'closed_at')
    filter_horizontal = ('contacts',)
    inlines = [OpportunityActivityInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'company')
        }),
        ('İlişkiler', {
            'fields': ('contacts',)
        }),
        ('Durum ve Değer', {
            'fields': ('status', 'value', 'priority', 'probability', 'expected_close_date')
        }),
        ('Atama ve Tarihler', {
            'fields': ('assigned_to', 'created_at', 'updated_at', 'closed_at')
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Admin kullanıcıları tüm kayıtları görebilir
        if request.user.is_superuser:
            return qs
        # Diğer kullanıcılar yalnızca kendilerine atanmış kayıtları veya hiç kimseye atanmamış kayıtları görebilir
        return qs.filter(assigned_to=request.user) | qs.filter(assigned_to__isnull=True)


@admin.register(OpportunityActivity)
class OpportunityActivityAdmin(admin.ModelAdmin):
    """
    Fırsat aktiviteleri için admin panel yapılandırması
    """
    list_display = ('title', 'type', 'opportunity', 'performed_by', 'performed_at')
    list_filter = ('type', 'performed_at', 'performed_by')
    search_fields = ('title', 'description', 'opportunity__title', 'opportunity__company__name')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('opportunity', 'type', 'title', 'description')
        }),
        ('Gerçekleştirim', {
            'fields': ('performed_by', 'performed_at', 'created_at')
        }),
    )

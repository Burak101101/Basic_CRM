from rest_framework import serializers
from .models import EmailTemplate, EmailMessage, EmailConfig


class EmailTemplateSerializer(serializers.ModelSerializer):
    """
    E-posta şablonları için serializer
    """
    class Meta:
        model = EmailTemplate
        fields = '__all__'


class EmailConfigSerializer(serializers.ModelSerializer):
    """
    E-posta konfigürasyonları için serializer
    """
    class Meta:
        model = EmailConfig
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True}  # Şifre alanını sadece yazılabilir yap
        }


class EmailMessageListSerializer(serializers.ModelSerializer):
    """
    E-posta listesi için daha kısa serializer
    """
    company_name = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    recipients_count = serializers.SerializerMethodField()
    
    class Meta:
        model = EmailMessage
        fields = ('id', 'subject', 'sender', 'status', 'company', 'company_name', 
                  'contact', 'contact_name', 'created_at', 'sent_at', 'recipients_count')
    
    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None
    
    def get_contact_name(self, obj):
        if obj.contact:
            return str(obj.contact)
        return None
    
    def get_recipients_count(self, obj):
        return len(obj.recipients) if obj.recipients else 0


class EmailMessageDetailSerializer(serializers.ModelSerializer):
    """
    E-posta detayları için tam serializer
    """
    company_name = serializers.SerializerMethodField(read_only=True)
    contact_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = EmailMessage
        fields = '__all__'
    
    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None
    
    def get_contact_name(self, obj):
        if obj.contact:
            return str(obj.contact)
        return None


class SendEmailSerializer(serializers.Serializer):
    """
    E-posta gönderimi için özel serializer
    """
    subject = serializers.CharField(max_length=255)
    content = serializers.CharField()
    recipients = serializers.JSONField()
    cc = serializers.JSONField(required=False)
    bcc = serializers.JSONField(required=False)
    attachments = serializers.JSONField(required=False)
    template_id = serializers.IntegerField(required=False)
    company_id = serializers.IntegerField(required=False)
    contact_id = serializers.IntegerField(required=False)
    config_id = serializers.IntegerField(required=False)  # Özel yapılandırma kullanmak için
    
    def validate(self, data):
        # En az bir alıcı olmalı
        if not data.get('recipients'):
            raise serializers.ValidationError("En az bir alıcı belirtilmelidir.")
            
        # Şablon ID'si varsa şablonu kontrol et
        if data.get('template_id'):
            try:
                template = EmailTemplate.objects.get(id=data['template_id'])
            except EmailTemplate.DoesNotExist:
                raise serializers.ValidationError("Belirtilen e-posta şablonu bulunamadı.")
        
        # Yapılandırma ID'si varsa yapılandırmayı kontrol et
        if data.get('config_id'):
            try:
                config = EmailConfig.objects.get(id=data['config_id'], is_active=True)
            except EmailConfig.DoesNotExist:
                raise serializers.ValidationError("Belirtilen e-posta yapılandırması bulunamadı veya aktif değil.")
        
        return data

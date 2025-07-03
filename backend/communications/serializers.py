from rest_framework import serializers
from .models import EmailTemplate, EmailMessage, EmailAttachment, IncomingEmail


class EmailTemplateSerializer(serializers.ModelSerializer):
    """
    E-posta şablonları için serializer
    """
    class Meta:
        model = EmailTemplate
        fields = '__all__'


# EmailConfigSerializer kaldırıldı - SMTP ayarları artık kullanıcı profilinde


class EmailMessageListSerializer(serializers.ModelSerializer):
    """
    E-posta listesi için daha kısa serializer
    """
    company_name = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    opportunity_title = serializers.SerializerMethodField()
    recipients_count = serializers.SerializerMethodField()

    class Meta:
        model = EmailMessage
        fields = (
            'id', 'subject', 'content', 'sender', 'recipients', 'cc', 'bcc',
            'status', 'error_message', 'company', 'company_name', 'contact',
            'contact_name', 'opportunity', 'opportunity_title', 'created_at',
            'sent_at', 'recipients_count'
        )

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None

    def get_contact_name(self, obj):
        if obj.contact:
            return str(obj.contact)
        return None

    def get_opportunity_title(self, obj):
        if obj.opportunity:
            return obj.opportunity.title
        return None

    def get_recipients_count(self, obj):
        return len(obj.recipients) if obj.recipients else 0
    
    def get_recipients(self, obj):
        return obj.recipients
    
    def get_content(self, obj):
        return obj.content


class EmailMessageDetailSerializer(serializers.ModelSerializer):
    """
    E-posta detayları için tam serializer
    """
    company_name = serializers.SerializerMethodField(read_only=True)
    contact_name = serializers.SerializerMethodField(read_only=True)
    opportunity_title = serializers.SerializerMethodField(read_only=True)

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

    def get_opportunity_title(self, obj):
        if obj.opportunity:
            return obj.opportunity.title
        return None


class EmailAttachmentSerializer(serializers.ModelSerializer):
    """
    E-posta ekleri için serializer
    """
    file_size_mb = serializers.ReadOnlyField()

    class Meta:
        model = EmailAttachment
        fields = ['id', 'original_name', 'file_size', 'file_size_mb', 'content_type', 'uploaded_at']


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
    template_id = serializers.CharField(required=False, allow_blank=True)

    def validate_template_id(self, value):
        """Template ID validation - boş string'i None'a çevir"""
        if value == "":
            return None
        try:
            return int(value)
        except ValueError:
            raise serializers.ValidationError("Şablon ID geçerli bir sayı olmalıdır.")
    company_id = serializers.IntegerField(required=False, allow_null=True)
    contact_id = serializers.IntegerField(required=False, allow_null=True)
    opportunity_id = serializers.IntegerField(required=False, allow_null=True)
    config_id = serializers.IntegerField(required=False, allow_null=True)  # Özel yapılandırma kullanmak için

    def validate_company_id(self, value):
        """Company ID validation - boş string'i None'a çevir"""
        if value == '' or value is None:
            return None
        return value

    def validate_contact_id(self, value):
        """Contact ID validation - boş string'i None'a çevir"""
        if value == '' or value is None:
            return None
        return value

    def validate_opportunity_id(self, value):
        """Opportunity ID validation - boş string'i None'a çevir"""
        if value == '' or value is None:
            return None
        return value

    def validate_config_id(self, value):
        """Config ID validation - boş string'i None'a çevir"""
        if value == '' or value is None:
            return None
        return value
    
    def validate_recipients(self, value):
        """
        Alıcıları doğrula ve normalize et
        """
        if not value:
            raise serializers.ValidationError("En az bir alıcı belirtilmelidir.")

        # Alıcıları normalize et
        normalized_recipients = []
        for recipient in value:
            if isinstance(recipient, dict):
                email = recipient.get('email', '').strip()
                if email:
                    normalized_recipients.append({'email': email})
            elif isinstance(recipient, str):
                email = recipient.strip()
                if email:
                    normalized_recipients.append({'email': email})

        if not normalized_recipients:
            raise serializers.ValidationError("Geçerli e-posta adresi bulunamadı.")

        return normalized_recipients

    def validate_cc(self, value):
        """
        CC alıcılarını doğrula ve normalize et
        """
        if not value:
            return []

        normalized_cc = []
        for recipient in value:
            if isinstance(recipient, dict):
                email = recipient.get('email', '').strip()
                if email:
                    normalized_cc.append({'email': email})
            elif isinstance(recipient, str):
                email = recipient.strip()
                if email:
                    normalized_cc.append({'email': email})

        return normalized_cc

    def validate_bcc(self, value):
        """
        BCC alıcılarını doğrula ve normalize et
        """
        if not value:
            return []

        normalized_bcc = []
        for recipient in value:
            if isinstance(recipient, dict):
                email = recipient.get('email', '').strip()
                if email:
                    normalized_bcc.append({'email': email})
            elif isinstance(recipient, str):
                email = recipient.strip()
                if email:
                    normalized_bcc.append({'email': email})

        return normalized_bcc


class EmailAttachmentSerializer(serializers.ModelSerializer):
    """
    E-posta ekleri için serializer
    """
    class Meta:
        model = EmailAttachment
        fields = '__all__'


class IncomingEmailSerializer(serializers.ModelSerializer):
    """
    Gelen e-postalar için serializer
    """
    company_name = serializers.SerializerMethodField()
    contact_name = serializers.SerializerMethodField()
    sender_display = serializers.SerializerMethodField()
    recipients_count = serializers.SerializerMethodField()

    class Meta:
        model = IncomingEmail
        fields = (
            'id', 'message_id', 'subject', 'content', 'content_html',
            'sender_email', 'sender_name', 'sender_display', 'recipients',
            'cc', 'company', 'company_name', 'contact', 'contact_name',
            'status', 'received_at', 'created_at', 'updated_at',
            'has_attachments', 'attachments', 'recipients_count'
        )

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None

    def get_contact_name(self, obj):
        if obj.contact:
            return str(obj.contact)
        return None

    def get_sender_display(self, obj):
        if obj.sender_name:
            return f"{obj.sender_name} <{obj.sender_email}>"
        return obj.sender_email

    def get_recipients_count(self, obj):
        return len(obj.recipients) if obj.recipients else 0

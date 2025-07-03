from rest_framework import serializers
from .models import AIConfiguration, AIRequest


class AIConfigurationSerializer(serializers.ModelSerializer):
    """
    AI konfigürasyonu için serializer
    """
    class Meta:
        model = AIConfiguration
        fields = '__all__'
        extra_kwargs = {
            'api_key': {'write_only': True}  # API anahtarını sadece yazma için göster
        }


class AIRequestSerializer(serializers.ModelSerializer):
    """
    AI istekleri için serializer
    """
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AIRequest
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'completed_at')


class EmailComposeAIRequestSerializer(serializers.Serializer):
    """
    E-posta oluşturma AI isteği için serializer
    """
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    company_id = serializers.IntegerField(required=False, allow_null=True)
    contact_id = serializers.IntegerField(required=False, allow_null=True)
    opportunity_id = serializers.IntegerField(required=False, allow_null=True)
    additional_context = serializers.CharField(required=False, allow_blank=True)


class EmailReplyAIRequestSerializer(serializers.Serializer):
    """
    E-posta yanıtlama AI isteği için serializer
    """
    incoming_email_id = serializers.IntegerField(required=True)
    additional_context = serializers.CharField(required=False, allow_blank=True)


class OpportunityAIRequestSerializer(serializers.Serializer):
    """
    Fırsat oluşturma AI isteği için serializer
    """
    company_id = serializers.IntegerField(required=False, allow_null=True)
    contact_id = serializers.IntegerField(required=False, allow_null=True)
    additional_context = serializers.CharField(required=False, allow_blank=True)


class AIResponseSerializer(serializers.Serializer):
    """
    AI yanıtları için genel serializer
    """
    success = serializers.BooleanField()
    content = serializers.CharField(required=False)
    data = serializers.JSONField(required=False)
    error = serializers.CharField(required=False)
    request_id = serializers.IntegerField(required=False)

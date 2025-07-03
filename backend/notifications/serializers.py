from rest_framework import serializers
from .models import Notification, NotificationPreference
from django.contrib.auth.models import User


class NotificationSerializer(serializers.ModelSerializer):
    """
    Bildirimler için serializer
    """
    recipient_name = serializers.SerializerMethodField(read_only=True)
    content_object_str = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['recipient', 'is_sent', 'sent_at']
        
    def get_recipient_name(self, obj):
        return f"{obj.recipient.first_name} {obj.recipient.last_name}" if obj.recipient else obj.recipient.username
        
    def get_content_object_str(self, obj):
        return str(obj.content_object) if obj.content_object else None


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Bildirim listesi için serializer
    """
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'is_read', 'read_at', 'action_url', 'created_at'
        ]


class NotificationCreateSerializer(serializers.ModelSerializer):
    """
    Bildirim oluşturma için serializer
    """
    class Meta:
        model = Notification
        fields = [
            'title', 'message', 'notification_type', 'priority',
            'content_type', 'object_id', 'action_url', 'metadata'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Bildirim tercihleri için serializer
    """
    user_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = '__all__'
        read_only_fields = ['user']
        
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user else obj.user.username


class BulkNotificationSerializer(serializers.Serializer):
    """
    Toplu bildirim gönderimi için serializer
    """
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="Alıcı kullanıcı ID'leri"
    )
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    notification_type = serializers.ChoiceField(choices=Notification.NOTIFICATION_TYPE_CHOICES)
    priority = serializers.ChoiceField(choices=Notification.PRIORITY_CHOICES, default='medium')
    action_url = serializers.URLField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False, default=dict)
    
    def validate_recipient_ids(self, value):
        """
        Alıcı ID'lerinin geçerli olduğunu kontrol et
        """
        if not value:
            raise serializers.ValidationError("En az bir alıcı belirtilmelidir.")
            
        # Kullanıcıların var olduğunu kontrol et
        existing_users = User.objects.filter(id__in=value).values_list('id', flat=True)
        invalid_ids = set(value) - set(existing_users)
        
        if invalid_ids:
            raise serializers.ValidationError(
                f"Geçersiz kullanıcı ID'leri: {list(invalid_ids)}"
            )
            
        return value

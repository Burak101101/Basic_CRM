from rest_framework import serializers
from .models import Event, EventParticipant
from customers.models import Company, Contact
from django.contrib.auth.models import User
from datetime import timedelta


class EventParticipantSerializer(serializers.ModelSerializer):
    """
    Etkinlik katılımcıları için serializer
    """
    contact_name = serializers.SerializerMethodField(read_only=True)
    contact_email = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = EventParticipant
        fields = '__all__'
        
    def get_contact_name(self, obj):
        return str(obj.contact) if obj.contact else None
        
    def get_contact_email(self, obj):
        return obj.contact.email if obj.contact else None


class EventListSerializer(serializers.ModelSerializer):
    """
    Etkinlik listesi için serializer
    """
    company_name = serializers.SerializerMethodField(read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)
    participants_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'event_type', 'status', 'priority',
            'company', 'company_name', 'assigned_to', 'assigned_to_name',
            'start_datetime', 'end_datetime', 'location',
            'participants_count', 'created_at'
        ]
        
    def get_company_name(self, obj):
        return obj.company.name if obj.company else None
        
    def get_assigned_to_name(self, obj):
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}" if obj.assigned_to else None
        
    def get_participants_count(self, obj):
        return obj.contacts.count()


class EventDetailSerializer(serializers.ModelSerializer):
    """
    Etkinlik detayları için serializer
    """
    company_name = serializers.SerializerMethodField(read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)
    contacts_details = serializers.SerializerMethodField(read_only=True)
    contacts = serializers.SerializerMethodField(read_only=True)
    participants = EventParticipantSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
        
    def get_company_name(self, obj):
        return obj.company.name if obj.company else None
        
    def get_assigned_to_name(self, obj):
        return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}" if obj.assigned_to else None
        
    def get_contacts_details(self, obj):
        contacts = obj.contacts.all()
        return [
            {
                'id': contact.id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'phone': contact.phone,
                'position': contact.position
            }
            for contact in contacts
        ]
        
    def get_contacts(self, obj):
        """Returns the full contact objects for frontend compatibility"""
        contacts = obj.contacts.all()
        return [
            {
                'id': contact.id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'phone': contact.phone,
                'position': contact.position,
                'company': contact.company_id if contact.company else None
            }
            for contact in contacts
        ]


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Etkinlik oluşturma/güncelleme için serializer
    """
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Event
        fields = '__all__'
        
    def validate(self, data):
        """
        Etkinlik validasyonu
        """
        # Bitiş tarihi başlangıç tarihinden önce olamaz
        if data.get('end_datetime') and data.get('start_datetime'):
            if data['end_datetime'] <= data['start_datetime']:
                raise serializers.ValidationError(
                    "Bitiş tarihi başlangıç tarihinden sonra olmalıdır."
                )
        
        # En az bir firma veya kişi seçilmeli
        if not data.get('company') and not data.get('contacts'):
            raise serializers.ValidationError(
                "Etkinlik en az bir firma veya kişiye bağlı olmalıdır."
            )
            
        return data
    def create(self, validated_data):
        validated_data['assigned_to'] = self.context['request'].user
        # Set reminder_datetime to 1 hour before if not provided
        if not validated_data.get('reminder_datetime') and validated_data.get('start_datetime'):
            validated_data['reminder_datetime'] = validated_data['start_datetime'] - timedelta(hours=1)
        return super().create(validated_data)

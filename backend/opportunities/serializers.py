from rest_framework import serializers
from django.contrib.auth.models import User
from .models import OpportunityStatus, Opportunity, OpportunityActivity
from customers.serializers import ContactNestedSerializer


class UserSerializer(serializers.ModelSerializer):
    """
    Kullanıcı bilgileri için basit serializer
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'is_active')
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class OpportunityStatusSerializer(serializers.ModelSerializer):
    """
    Satış fırsatı durumları için serializer
    """
    class Meta:
        model = OpportunityStatus
        fields = '__all__'


class OpportunityActivitySerializer(serializers.ModelSerializer):
    """
    Satış fırsatı aktiviteleri için serializer
    """
    performed_by_details = UserSerializer(source='performed_by', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = OpportunityActivity
        fields = '__all__'


class OpportunityListSerializer(serializers.ModelSerializer):
    """
    Satış fırsatları listesi için kısa serializer
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    status_color = serializers.CharField(source='status.color', read_only=True)
    assigned_to_name = serializers.SerializerMethodField(read_only=True)
    is_closed = serializers.SerializerMethodField(read_only=True)
    contact_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Opportunity
        fields = ('id', 'title', 'company', 'company_name', 'status', 'status_name',
                  'status_color', 'value', 'priority', 'expected_close_date',
                  'assigned_to', 'assigned_to_name', 'closed_at', 'is_closed', 'contact_count')
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None
    
    def get_is_closed(self, obj):
        return obj.closed_at is not None
    
    def get_contact_count(self, obj):
        return obj.contacts.count()


class OpportunityDetailSerializer(serializers.ModelSerializer):
    """
    Satış fırsatı detayları için kapsamlı serializer
    """
    company_name = serializers.CharField(source='company.name', read_only=True)
    status_details = OpportunityStatusSerializer(source='status', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    contacts = ContactNestedSerializer(many=True, read_only=True)
    activities = OpportunityActivitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Opportunity
        fields = '__all__'


class OpportunityCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Satış fırsatı oluşturma ve güncelleme için serializer
    """
    class Meta:
        model = Opportunity
        fields = '__all__'
        



class OpportunityActivityCreateSerializer(serializers.ModelSerializer):
    """
    Satış fırsatı aktivitesi oluşturma için serializer
    """
    class Meta:
        model = OpportunityActivity
        fields = '__all__'

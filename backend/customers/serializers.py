from rest_framework import serializers
from .models import Company, Contact, Note


class NoteNestedSerializer(serializers.ModelSerializer):
    """
    Firma veya kişi içinde görüntülenmek üzere daha basit not serializerı
    """
    class Meta:
        model = Note
        exclude = ('company', 'contact')  # İçinde gösterildiği için firma/kişi alanını hariç tutuyoruz


class ContactSerializer(serializers.ModelSerializer):
    """
    İletişim kişileri için serializer
    """
    notes = NoteNestedSerializer(many=True, read_only=True)
    
    class Meta:
        model = Contact
        fields = '__all__'


class ContactNestedSerializer(serializers.ModelSerializer):
    """
    Firma içinde görüntülenmek üzere İletişim kişileri için serializer
    """
    class Meta:
        model = Contact
        exclude = ('company',)  # Firma içinde gösterildiği için firma alanını hariç tutuyoruz


class CompanyListSerializer(serializers.ModelSerializer):
    """
    Firma listesi için kısa serializer
    """
    contact_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = ('id', 'name', 'industry', 'phone', 'email', 'contact_count')
    
    def get_contact_count(self, obj):
        return obj.contacts.count()


class CompanyDetailSerializer(serializers.ModelSerializer):
    """
    Firma detayları için daha kapsamlı serializer
    """
    contacts = ContactNestedSerializer(many=True, read_only=True)
    notes = NoteNestedSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Firma oluşturma/güncelleme için serializer
    """
    class Meta:
        model = Company
        fields = '__all__'


class NoteSerializer(serializers.ModelSerializer):
    """
    Notlar için genel serializer
    """
    company_name = serializers.SerializerMethodField(read_only=True)
    contact_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Note
        fields = '__all__'
        
    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None
        
    def get_contact_name(self, obj):
        if obj.contact:
            return str(obj.contact)
        return None
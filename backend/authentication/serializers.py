from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer for email settings"""

    class Meta:
        model = UserProfile
        fields = ('smtp_server', 'smtp_port', 'smtp_username', 'smtp_password', 'use_tls')

class ImapSettingsSerializer(serializers.ModelSerializer):
    """Serializer for IMAP settings"""
    class Meta:
        model = UserProfile
        fields = ('imap_server', 'imap_port', 'imap_username', 'imap_password', 'use_imap_ssl')

class UserCompanySerializer(serializers.ModelSerializer):
    """Serializer for user's company information"""
    class Meta:
        model = UserProfile
        fields = ('company_name', 'company_industry', 'company_position', 'company_size', 'company_website', 'company_linkedin_url', 'company_location', 'company_description')

class UserSerializer(serializers.ModelSerializer):
    """User serializer for registration and profile viewing"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Şifreler eşleşmiyor"})
        
        # Check if email is already in use
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Bu email adresi zaten kullanılıyor"})
        
        return attrs
    
    def create(self, validated_data):
        # Remove password_confirm from validated data
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password']
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            
            if not user:
                # Try with email instead
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    user = None
                
            if not user:
                raise serializers.ValidationError("Geçersiz kullanıcı adı veya şifre")
            
            if not user.is_active:
                raise serializers.ValidationError("Kullanıcı hesabı devre dışı bırakıldı")
            
        else:
            raise serializers.ValidationError("Kullanıcı adı ve şifre gerekli")
        
        attrs['user'] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(required=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Yeni şifreler eşleşmiyor"})
        
        return attrs

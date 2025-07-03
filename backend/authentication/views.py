from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    UserProfileSerializer,
    UserCompanySerializer,
    ImapSettingsSerializer
)
from .models import UserProfile


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Log the request data for debugging
        print(f"RegisterView POST request - Path: {request.path}")
        print(f"RegisterView POST data: {request.data}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate token for the user
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key
            }, status=status.HTTP_201_CREATED)
        
        # Log validation errors
        print(f"RegisterView validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                "user": UserSerializer(user).data,
                "token": token.key
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Delete the token to logout
        request.user.auth_token.delete()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user

            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": "Mevcut şifre yanlış"}, status=status.HTTP_400_BAD_REQUEST)

            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            # Update token (force re-login)
            user.auth_token.delete()
            token = Token.objects.create(user=user)

            return Response({
                "detail": "Şifre başarıyla değiştirildi.",
                "token": token.key
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class UserProfileEmailSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's email settings"""
        print(f"=== EMAIL SETTINGS GET REQUEST ===")
        print(f"User: {request.user}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"Request path: {request.path}")

        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        print(f"Profile created: {created}, Profile: {profile}")
        serializer = UserProfileSerializer(profile)
        print(f"Serialized data: {serializer.data}")
        return Response(serializer.data)

    def put(self, request):
        """Update user's email settings"""
        print(f"=== EMAIL SETTINGS PUT REQUEST ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")

        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            print(f"Updated profile: {serializer.data}")
            return Response(serializer.data)
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserImapSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user's IMAP settings"""
        print(f"=== IMAP SETTINGS GET REQUEST ===")
        print(f"User: {request.user}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"Request path: {request.path}")

        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = ImapSettingsSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        """Update user's IMAP settings"""
        print(f"=== IMAP SETTINGS PUT REQUEST ===")
        print(f"User: {request.user}")
        print(f"Request data: {request.data}")
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=401)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = ImapSettingsSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserCompanyInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Kullanıcının şirket bilgilerini getirir."""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserCompanySerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        """Kullanıcının şirket bilgilerini günceller."""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserCompanySerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

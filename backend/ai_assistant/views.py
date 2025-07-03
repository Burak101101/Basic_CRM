from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
import logging

from .ai_service import ai_service
from .serializers import (
    EmailComposeAIRequestSerializer,
    EmailReplyAIRequestSerializer,
    OpportunityAIRequestSerializer,
    AIResponseSerializer
)
from .models import AIRequest

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_email_content(request):
    """
    E-posta içeriği oluşturma endpoint'i
    """
    serializer = EmailComposeAIRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'success': False, 'error': 'Geçersiz veri', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        data = serializer.validated_data
        content = ai_service.generate_email_content(
            user=request.user,
            subject=data.get('subject', ''),
            company_id=data.get('company_id'),
            contact_id=data.get('contact_id'),
            opportunity_id=data.get('opportunity_id'),
            additional_context=data.get('additional_context', '')
        )

        return Response({
            'success': True,
            'content': content
        })

    except Exception as e:
        logger.error(f"E-posta içeriği oluşturma hatası: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_email_reply(request):
    """
    E-posta yanıtı oluşturma endpoint'i
    """
    serializer = EmailReplyAIRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'success': False, 'error': 'Geçersiz veri', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        data = serializer.validated_data
        content = ai_service.generate_email_reply(
            user=request.user,
            incoming_email_id=data['incoming_email_id'],
            additional_context=data.get('additional_context', '')
        )

        return Response({
            'success': True,
            'content': content
        })

    except Exception as e:
        logger.error(f"E-posta yanıtı oluşturma hatası: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_opportunity_proposal(request):
    """
    Fırsat önerisi oluşturma endpoint'i
    """
    serializer = OpportunityAIRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'success': False, 'error': 'Geçersiz veri', 'details': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        data = serializer.validated_data
        opportunity_data = ai_service.generate_opportunity_proposal(
            user=request.user,
            company_id=data.get('company_id'),
            contact_id=data.get('contact_id'),
            additional_context=data.get('additional_context', '')
        )

        return Response({
            'success': True,
            'data': opportunity_data
        })

    except Exception as e:
        logger.error(f"Fırsat önerisi oluşturma hatası: {str(e)}")
        return Response(
            {'success': False, 'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ai_requests(request):
    """
    Kullanıcının AI isteklerini listele
    """
    requests = AIRequest.objects.filter(user=request.user).order_by('-created_at')[:20]

    data = []
    for req in requests:
        data.append({
            'id': req.id,
            'request_type': req.request_type,
            'request_type_display': req.get_request_type_display(),
            'status': req.status,
            'status_display': req.get_status_display(),
            'created_at': req.created_at,
            'completed_at': req.completed_at,
            'error_message': req.error_message
        })

    return Response({'requests': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_ai_status(request):
    """
    AI servis durumunu kontrol et
    """
    try:
        # Basit bir test isteği gönder
        test_messages = [
            {"role": "system", "content": "Sen bir test asistanısın."},
            {"role": "user", "content": "Merhaba, test mesajı"}
        ]

        response = ai_service._make_api_request(test_messages, max_tokens=50)

        return Response({
            'success': True,
            'status': 'active',
            'model': ai_service.config.model_name,
            'provider': ai_service.config.provider
        })

    except Exception as e:
        return Response({
            'success': False,
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationCreateSerializer,
    NotificationPreferenceSerializer,
    BulkNotificationSerializer
)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    Bildirimler için API endpoint'i
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        # Kullanıcı sadece kendi bildirimlerini görebilir
        queryset = Notification.objects.filter(recipient=self.request.user)
        # Reminder tipinde ve is_sent=False olan bildirimleri HER ZAMAN dışla
        queryset = queryset.exclude(notification_type='reminder', is_sent=False)
        # Ekstra tip filtresi varsa uygula
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        elif self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer

    def perform_create(self, serializer):
        # Bildirimi oluşturan kullanıcıyı alıcı olarak ayarla
        serializer.save(recipient=self.request.user)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Okunmamış bildirimleri listeler
        """
        unread_notifications = self.get_queryset().filter(is_read=False)
        serializer = NotificationListSerializer(unread_notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Okunmamış bildirim sayısını döner
        """
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """
        Bildirimi okundu olarak işaretle
        """
        notification = self.get_object()
        notification.mark_as_read()

        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Tüm bildirimleri okundu olarak işaretle
        """
        unread_notifications = self.get_queryset().filter(is_read=False)
        now = timezone.now()

        unread_notifications.update(
            is_read=True,
            read_at=now
        )

        return Response({'message': 'Tüm bildirimler okundu olarak işaretlendi'})

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Bildirim tipine göre filtreleme
        """
        notification_type = request.query_params.get('type')
        if not notification_type:
            return Response(
                {"error": "Bildirim tipi belirtilmelidir"},
                status=status.HTTP_400_BAD_REQUEST
            )

        notifications = self.get_queryset().filter(notification_type=notification_type)
        serializer = NotificationListSerializer(notifications, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """
        Toplu bildirim oluşturma
        """
        serializer = BulkNotificationSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            recipient_ids = data.pop('recipient_ids')

            # Her alıcı için bildirim oluştur
            notifications = []
            for recipient_id in recipient_ids:
                notification = Notification(
                    recipient_id=recipient_id,
                    **data
                )
                notifications.append(notification)

            # Toplu oluşturma
            created_notifications = Notification.objects.bulk_create(notifications)

            return Response({
                'message': f'{len(created_notifications)} bildirim oluşturuldu',
                'created_count': len(created_notifications)
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    Bildirim tercihleri için API endpoint'i
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Kullanıcı sadece kendi tercihlerini görebilir
        return NotificationPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Tercihi oluşturan kullanıcıyı ayarla
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """
        Kullanıcının bildirim tercihlerini getirir
        """
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
            serializer = self.get_serializer(preferences)
            return Response(serializer.data)
        except NotificationPreference.DoesNotExist:
            # Varsayılan tercihlerle yeni bir kayıt oluştur
            preferences = NotificationPreference.objects.create(user=request.user)
            serializer = self.get_serializer(preferences)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def update_preferences(self, request):
        """
        Kullanıcının bildirim tercihlerini günceller
        """
        try:
            preferences = NotificationPreference.objects.get(user=request.user)
            serializer = self.get_serializer(preferences, data=request.data, partial=True)
        except NotificationPreference.DoesNotExist:
            # Yeni tercih oluştur
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

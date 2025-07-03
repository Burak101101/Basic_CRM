from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import Event, EventParticipant
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateUpdateSerializer,
    EventParticipantSerializer
)


class EventViewSet(viewsets.ModelViewSet):
    """
    Etkinlikler için API endpoint'i
    """
    queryset = Event.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'status', 'priority', 'company', 'assigned_to']
    search_fields = ['title', 'description', 'location', 'company__name']
    ordering_fields = ['start_datetime', 'created_at', 'priority']
    ordering = ['-start_datetime']

    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventDetailSerializer

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Yaklaşan etkinlikleri listeler
        """
        now = timezone.now()
        upcoming_events = self.queryset.filter(
            start_datetime__gte=now,
            status__in=['scheduled', 'in_progress']
        ).order_by('start_datetime')

        serializer = EventListSerializer(upcoming_events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Bugünkü etkinlikleri listeler
        """
        today = timezone.now().date()
        today_events = self.queryset.filter(
            start_datetime__date=today
        ).order_by('start_datetime')

        serializer = EventListSerializer(today_events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def this_week(self, request):
        """
        Bu haftaki etkinlikleri listeler
        """
        now = timezone.now()
        week_start = now - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)

        week_events = self.queryset.filter(
            start_datetime__date__range=[week_start.date(), week_end.date()]
        ).order_by('start_datetime')

        serializer = EventListSerializer(week_events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Etkinliği tamamlandı olarak işaretle
        """
        event = self.get_object()
        event.status = 'completed'
        event.completed_at = timezone.now()

        # Sonuç notunu ekle
        outcome = request.data.get('outcome', '')
        if outcome:
            event.outcome = outcome

        event.save()

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Etkinliği iptal et
        """
        event = self.get_object()
        event.status = 'cancelled'

        # İptal sebebini ekle
        reason = request.data.get('reason', '')
        if reason:
            if event.notes:
                event.notes += f"\n\nİptal Sebebi: {reason}"
            else:
                event.notes = f"İptal Sebebi: {reason}"

        event.save()

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def company_events(self, request):
        """
        Belirli bir firmaya ait etkinlikleri listeler
        """
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response(
                {"error": "Firma ID'si belirtilmelidir"},
                status=status.HTTP_400_BAD_REQUEST
            )

        events = self.queryset.filter(company_id=company_id)
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def contact_events(self, request):
        """
        Belirli bir kişiye ait etkinlikleri listeler
        """
        contact_id = request.query_params.get('contact_id')
        if not contact_id:
            return Response(
                {"error": "Kişi ID'si belirtilmelidir"},
                status=status.HTTP_400_BAD_REQUEST
            )

        events = self.queryset.filter(contacts__id=contact_id)
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)


class EventParticipantViewSet(viewsets.ModelViewSet):
    """
    Etkinlik katılımcıları için API endpoint'i
    """
    queryset = EventParticipant.objects.all()
    serializer_class = EventParticipantSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['event', 'contact', 'status']
    search_fields = ['contact__first_name', 'contact__last_name', 'contact__email']

    @action(detail=False, methods=['get'])
    def event_participants(self, request):
        """
        Belirli bir etkinliğin katılımcılarını listeler
        """
        event_id = request.query_params.get('event_id')
        if not event_id:
            return Response(
                {"error": "Etkinlik ID'si belirtilmelidir"},
                status=status.HTTP_400_BAD_REQUEST
            )

        participants = self.queryset.filter(event_id=event_id)
        serializer = self.get_serializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_attended(self, request, pk=None):
        """
        Katılımcıyı katıldı olarak işaretle
        """
        participant = self.get_object()
        participant.status = 'attended'
        participant.save()

        serializer = self.get_serializer(participant)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_no_show(self, request, pk=None):
        """
        Katılımcıyı gelmedi olarak işaretle
        """
        participant = self.get_object()
        participant.status = 'no_show'
        participant.save()

        serializer = self.get_serializer(participant)
        return Response(serializer.data)

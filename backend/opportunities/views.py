from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone

from .models import OpportunityStatus, Opportunity, OpportunityActivity
from .serializers import (
    OpportunityStatusSerializer,
    OpportunityListSerializer, 
    OpportunityDetailSerializer, 
    OpportunityCreateUpdateSerializer,
    OpportunityActivitySerializer,
    OpportunityActivityCreateSerializer
)


class OpportunityStatusViewSet(viewsets.ModelViewSet):
    """
    Satış fırsatı durumları için API endpoint'i
    """
    queryset = OpportunityStatus.objects.all().order_by('order')
    serializer_class = OpportunityStatusSerializer


class OpportunityViewSet(viewsets.ModelViewSet):
    """
    Satış fırsatları için API endpoint'i
    """
    queryset = Opportunity.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'company__name']
    ordering_fields = ['created_at', 'updated_at', 'expected_close_date', 'value', 'priority']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OpportunityListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return OpportunityCreateUpdateSerializer
        return OpportunityDetailSerializer
    
    def perform_create(self, serializer):
        """
        Fırsat oluşturulduğunda, mevcut kullanıcıyı sorumlu olarak ata
        (eğer kullanıcı tarafından belirtilmediyse)
        """
        if not serializer.validated_data.get('assigned_to'):
            serializer.save(assigned_to=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Dashboard istatistikleri için veri sağlar
        """
        # Son 30 gündeki fırsatlar
        days30 = timezone.now() - timezone.timedelta(days=30)
        opportunities30 = Opportunity.objects.filter(created_at__gte=days30)
        
        # Statülere göre tüm fırsatlar
        status_counts = Opportunity.objects.values('status__name', 'status__color').annotate(
            count=Count('id'),
            total_value=Sum('value')
        ).order_by('status__order')
        
        # Kazanılan ve kaybedilen fırsatlar
        won_opportunities = Opportunity.objects.filter(status__is_won=True)
        lost_opportunities = Opportunity.objects.filter(status__is_lost=True)
        
        # Açık fırsatlar (ne kazanılmış ne de kaybedilmiş)
        open_opportunities = Opportunity.objects.filter(
            ~Q(status__is_won=True) & ~Q(status__is_lost=True)
        )
        
        # Önceliklere göre fırsatlar
        priority_counts = Opportunity.objects.values('priority').annotate(
            count=Count('id'),
            total_value=Sum('value')
        ).order_by('priority')
        
        # Beklenilen yakın tarihli kapanışlar (önümüzdeki 30 gün)
        next30days = timezone.now() + timezone.timedelta(days=30)
        upcoming_closures = Opportunity.objects.filter(
            expected_close_date__gte=timezone.now().date(),
            expected_close_date__lte=next30days.date(),
            closed_at__isnull=True  # Henüz kapanmamış olanlar
        ).order_by('expected_close_date')
        
        upcoming_data = OpportunityListSerializer(upcoming_closures, many=True).data
        
        response_data = {
            'total_count': Opportunity.objects.count(),
            'total_value': Opportunity.objects.aggregate(total=Sum('value'))['total'] or 0,
            
            'open_count': open_opportunities.count(),
            'open_value': open_opportunities.aggregate(total=Sum('value'))['total'] or 0,
            
            'won_count': won_opportunities.count(),
            'won_value': won_opportunities.aggregate(total=Sum('value'))['total'] or 0,
            
            'lost_count': lost_opportunities.count(),
            'lost_value': lost_opportunities.aggregate(total=Sum('value'))['total'] or 0,
            
            'last30days_count': opportunities30.count(),
            'last30days_value': opportunities30.aggregate(total=Sum('value'))['total'] or 0,
            
            'status_distribution': status_counts,
            'priority_distribution': priority_counts,
            'upcoming_closures': upcoming_data,
        }
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """
        Fırsat durumunu değiştir (drag-and-drop için)
        """
        try:
            opportunity = self.get_object()
            status_id = request.data.get('status_id')

            if not status_id:
                return Response(
                    {"error": "status_id gereklidir"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Status'un var olduğunu kontrol et
            try:
                new_status = OpportunityStatus.objects.get(id=status_id)
            except OpportunityStatus.DoesNotExist:
                return Response(
                    {"error": "Geçersiz status ID"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Opportunity'nin status'unu güncelle
            opportunity.status = new_status
            opportunity.save()

            # Güncellenmiş opportunity'yi döndür
            serializer = OpportunityDetailSerializer(opportunity)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def company_opportunities(self, request):
        """
        Belirli bir firmaya ait fırsatları listeler
        """
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({"error": "Firma ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        opportunities = self.queryset.filter(company_id=company_id)
        page = self.paginate_queryset(opportunities)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(opportunities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """
        Kanban görünümü için durumlarına göre gruplandırılmış fırsatlar
        """
        statuses = OpportunityStatus.objects.all().order_by('order')
        kanban_data = []
        
        for status in statuses:
            opportunities = Opportunity.objects.filter(status=status)
            
            # Filtreler uygula
            company_id = request.query_params.get('company_id')
            if company_id:
                opportunities = opportunities.filter(company_id=company_id)
                
            assigned_to_id = request.query_params.get('assigned_to_id')
            if assigned_to_id:
                opportunities = opportunities.filter(assigned_to_id=assigned_to_id)
                
            priority = request.query_params.get('priority')
            if priority:
                opportunities = opportunities.filter(priority=priority)
                
            # Açık/kapalı filtresi
            is_closed = request.query_params.get('is_closed')
            if is_closed == 'true':
                opportunities = opportunities.filter(closed_at__isnull=False)
            elif is_closed == 'false':
                opportunities = opportunities.filter(closed_at__isnull=True)
            
            serializer = OpportunityListSerializer(opportunities, many=True)
            
            kanban_data.append({
                'status_id': status.id,
                'status_name': status.name,
                'status_color': status.color,
                'count': opportunities.count(),
                'total_value': opportunities.aggregate(total=Sum('value'))['total'] or 0,
                'opportunities': serializer.data
            })
        
        return Response(kanban_data)


class OpportunityActivityViewSet(viewsets.ModelViewSet):
    """
    Satış fırsatı aktiviteleri için API endpoint'i
    """
    queryset = OpportunityActivity.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['performed_at', 'type']
    ordering = ['-performed_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OpportunityActivityCreateSerializer
        return OpportunityActivitySerializer
    
    def perform_create(self, serializer):
        """
        Aktivite oluşturulduğunda, mevcut kullanıcıyı aktiviteyi gerçekleştiren kişi olarak ata
        (eğer kullanıcı tarafından belirtilmediyse)
        """
        if not serializer.validated_data.get('performed_by'):
            serializer.save(performed_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def opportunity_activities(self, request):
        """
        Belirli bir fırsata ait aktiviteleri listeler
        """
        opportunity_id = request.query_params.get('opportunity_id')
        if not opportunity_id:
            return Response({"error": "Fırsat ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        activities = self.queryset.filter(opportunity_id=opportunity_id)
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

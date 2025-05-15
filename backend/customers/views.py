from django.shortcuts import render
from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
import re

from .models import Company, Contact, Note
from .serializers import (
    CompanyListSerializer, 
    CompanyDetailSerializer, 
    CompanyCreateUpdateSerializer,
    ContactSerializer,
    NoteSerializer
)
from crm_project.supabase_helpers import CustomerSupabaseService


def is_advanced_query(query):
    """
    Bir sorgunun gelişmiş olup olmadığını belirler.
    
    Şu durumlarda sorgu gelişmiş olarak kabul edilir:
    1. Sorgu birden fazla kelime içeriyorsa
    2. Sorgu özel karakterler içeriyorsa
    3. Sorgu çok kısa ise (tek karakter)
    4. Sorgu bir e-posta veya telefon numarası formatındaysa
    5. Sorgu vergi numarası formatındaysa
    """
    # Sorgu boşsa
    if not query or query.strip() == '':
        return False
        
    # Sorgu birden fazla kelime içeriyorsa
    if len(query.split()) > 1:
        return True
    
    # Özel karakterler içeriyorsa
    special_chars = ['*', '%', '?', '+', '-', '&', '|', '!', '(', ')', '[', ']', '{', '}', '^', '~']
    if any(char in query for char in special_chars):
        return True
    
    # Çok kısa sorgular
    if len(query) == 1:
        return True
    
    # Muhtemel telefon numarası
    if re.search(r'^\+?[\d\s\-()]+$', query) and len(query) > 5:
        return True
    
    # Muhtemel email adresi
    if '@' in query and '.' in query:
        return True
        
    # Muhtemel vergi numarası
    if query.isdigit() and 10 <= len(query) <= 11:
        return True
    
    return False


class CompanyViewSet(viewsets.ModelViewSet):
    """
    Firma verilerini yönetmek için API endpoint'i
    """
    queryset = Company.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'tax_number', 'industry', 'email', 'phone']
    ordering_fields = ['name', 'industry', 'created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CompanyListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CompanyCreateUpdateSerializer
        return CompanyDetailSerializer
    
    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        """
        Belirli bir firmanın iletişim kişilerini göstermek için özel endpoint
        """
        company = self.get_object()
        contacts = Contact.objects.filter(company=company)
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Akıllı arama endpoint'i - hem firmalar hem de iletişim kişileri içinde arama yapar.
        Sorgu parametrelerine göre Django ORM veya Supabase kullanır.
        
        Query parametreleri:
        - q: Arama terimi
        - use_supabase: (opsiyonel) '1' veya 'true' ise Supabase kullanır
        - advanced: (opsiyonel) '1' veya 'true' ise gelişmiş arama yapar (Supabase kullanır)
        - limit: (opsiyonel) Sonuç sayısı limiti
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Arama parametresi sağlanmadı"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Supabase kullanılıp kullanılmayacağını belirle
        use_supabase = request.query_params.get('use_supabase', '').lower() in ['1', 'true']
        advanced_search = request.query_params.get('advanced', '').lower() in ['1', 'true'] or is_advanced_query(query)
        
        # Gelişmiş arama veya açıkça Supabase istendiyse Supabase kullan
        if advanced_search or use_supabase:
            limit = request.query_params.get('limit', 50)
            try:
                limit = int(limit)
            except ValueError:
                limit = 50
                
            # Supabase ile arama
            results = CustomerSupabaseService.search_all(query, limit=limit)
            return Response(results)
        else:
            # Django ORM ile basit arama
            companies = Company.objects.filter(
                Q(name__icontains=query) | 
                Q(tax_number__icontains=query) |
                Q(industry__icontains=query) |
                Q(email__icontains=query) |
                Q(phone__icontains=query)
            )
            
            company_serializer = CompanyListSerializer(companies, many=True)
            return Response({
                "companies": company_serializer.data,
                "contacts": [],
                "status": "success"
            })
    
    @action(detail=False, methods=['get'], url_path='supabase-companies')
    def supabase_companies(self, request):
        """
        Supabase kullanarak tüm firmaları listeler, filtreleme ve sıralama destekler
        """
        # Query parametrelerini al
        search = request.query_params.get('search', None)
        limit = int(request.query_params.get('limit', 100))
        offset = int(request.query_params.get('offset', 0))
        order_by = request.query_params.get('order_by', 'name')
        industry = request.query_params.get('industry', None)
        
        # İsteğe bağlı filtreler
        filters = {}
        if industry:
            filters['industry'] = {'operator': 'ilike', 'value': f"%{industry}%"}
        
        # Supabase ile firma listesi al
        results = CustomerSupabaseService.get_companies(
            search=search,
            limit=limit,
            offset=offset,
            order_by=order_by,
            filters=filters
        )
        
        return Response(results)


class ContactViewSet(viewsets.ModelViewSet):
    """
    İletişim kişilerini yönetmek için API endpoint'i
    """
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'position', 'email', 'phone', 'company__name']
    ordering_fields = ['first_name', 'last_name', 'company__name', 'created_at']
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        İletişim kişileri içinde arama yapmak için özel endpoint
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({"error": "Arama parametresi sağlanmadı"}, status=status.HTTP_400_BAD_REQUEST)
        
        contacts = Contact.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(position__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query) |
            Q(company__name__icontains=query)
        )
        
        serializer = ContactSerializer(contacts, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path=r'supabase-by-company/(?P<company_id>\d+)')
    def supabase_by_company(self, request, company_id=None):
        """
        Belirli bir firmaya ait tüm iletişim kişilerini getirir
        Supabase'in direkt sorgu özelliklerini kullanır
        """
        # Supabase ile iletişim kişilerini al
        results = CustomerSupabaseService.get_contacts_by_company(company_id)
        return Response(results)


class NoteViewSet(viewsets.ModelViewSet):
    """
    Notlar için API endpoint'i
    """
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'content']
    
    @action(detail=False, methods=['get'])
    def company_notes(self, request):
        """
        Belirli bir firmaya ait notları listeler
        """
        company_id = request.query_params.get('company_id')
        if not company_id:
            return Response({"error": "Firma ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        notes = self.queryset.filter(company_id=company_id)
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def contact_notes(self, request):
        """
        Belirli bir kişiye ait notları listeler
        """
        contact_id = request.query_params.get('contact_id')
        if not contact_id:
            return Response({"error": "Kişi ID'si belirtilmelidir"}, status=status.HTTP_400_BAD_REQUEST)
            
        notes = self.queryset.filter(contact_id=contact_id)
        serializer = self.get_serializer(notes, many=True)
        return Response(serializer.data)

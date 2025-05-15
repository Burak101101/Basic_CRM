"""
Supabase entegrasyonu için genel yardımcı fonksiyonlar.
Bu modül, Django projesi içinde Supabase ile etkileşim kurmak için kullanılır.
"""
import os
from typing import Dict, List, Any, Optional, Union

from supabase import create_client, Client
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# Supabase istemcisini yapılandır
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("UYARI: Supabase bağlantı bilgileri bulunamadı. .env dosyasını kontrol ediniz.")


class SupabaseService:
    """
    Supabase ile etkileşim kurmak için temel servis sınıfı.
    Tüm Supabase sorguları için temel fonksiyonları sağlar.
    """
    
    @staticmethod
    def get_client() -> Optional[Client]:
        """Supabase istemcisini döndürür"""
        return supabase
    
    @staticmethod
    def execute_query(table_name: str, query_func=None, **kwargs) -> Dict[str, Any]:
        """
        Supabase tablosu üzerinde bir sorgu çalıştırır
        
        Args:
            table_name: Sorgu yapılacak tablo adı
            query_func: Sorguyu özelleştirmek için kullanılabilecek bir fonksiyon
            **kwargs: Sorgu parametreleri
            
        Returns:
            Dict: Sorgu sonucu
        """
        if not supabase:
            return {"error": "Supabase bağlantısı kurulamadı. .env dosyasını kontrol ediniz."}
        
        try:
            query = supabase.table(table_name)
            
            # Özel sorgu fonksiyonu varsa uygula
            if query_func and callable(query_func):
                query = query_func(query, **kwargs)
            
            # Filtreleme
            filters = kwargs.get('filters', {})
            for field, value in filters.items():
                if isinstance(value, dict):
                    # Özel operatörler (eq, gt, lt vb.)
                    op = value.get('operator', 'eq')
                    val = value.get('value')
                    if op == 'eq':
                        query = query.eq(field, val)
                    elif op == 'gt':
                        query = query.gt(field, val)
                    elif op == 'lt':
                        query = query.lt(field, val)
                    elif op == 'gte':
                        query = query.gte(field, val)
                    elif op == 'lte':
                        query = query.lte(field, val)
                    elif op == 'neq':
                        query = query.neq(field, val)
                    elif op == 'like':
                        query = query.like(field, f"%{val}%")
                    elif op == 'ilike':
                        query = query.ilike(field, f"%{val}%")
                else:
                    # Varsayılan olarak eşitlik (eq) kontrolü
                    query = query.eq(field, value)
            
            # Arama
            search = kwargs.get('search')
            if search:
                search_fields = kwargs.get('search_fields', [])
                if search_fields:
                    search_conditions = []
                    for field in search_fields:
                        search_conditions.append(f"{field}.ilike.%{search}%")
                    
                    if search_conditions:
                        query = query.or_(",".join(search_conditions))
            
            # Sıralama
            order_by = kwargs.get('order_by')
            ascending = kwargs.get('ascending', True)
            if order_by:
                query = query.order(order_by, ascending=ascending)
            
            # Limit ve offset
            limit = kwargs.get('limit')
            offset = kwargs.get('offset')
            if limit is not None:
                query = query.limit(limit)
            if offset is not None:
                query = query.offset(offset)
            
            # Sorguyu çalıştır
            result = query.execute()
            
            return {
                "data": result.data,
                "count": len(result.data) if result.data else 0,
                "status": "success"
            }
            
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }
    
    @staticmethod
    def create_item(table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tabloya yeni bir kayıt ekler
        
        Args:
            table_name: Kayıt eklenecek tablo adı
            data: Eklenecek veriler
            
        Returns:
            Dict: İşlem sonucu
        """
        if not supabase:
            return {"error": "Supabase bağlantısı kurulamadı", "status": "error"}
        
        try:
            result = supabase.table(table_name).insert(data).execute()
            return {
                "data": result.data[0] if result.data else None,
                "status": "success"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }
    
    @staticmethod
    def update_item(table_name: str, item_id: Union[int, str], data: Dict[str, Any], id_column: str = 'id') -> Dict[str, Any]:
        """
        Tablodaki bir kaydı günceller
        
        Args:
            table_name: Güncellenecek kayıt tablosu adı
            item_id: Güncellenecek kaydın ID'si
            data: Güncellenecek veriler
            id_column: ID alanının adı (varsayılan: 'id')
            
        Returns:
            Dict: İşlem sonucu
        """
        if not supabase:
            return {"error": "Supabase bağlantısı kurulamadı", "status": "error"}
        
        try:
            result = supabase.table(table_name).update(data).eq(id_column, item_id).execute()
            return {
                "data": result.data[0] if result.data else None,
                "status": "success"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }
    
    @staticmethod
    def delete_item(table_name: str, item_id: Union[int, str], id_column: str = 'id') -> Dict[str, Any]:
        """
        Tablodaki bir kaydı siler
        
        Args:
            table_name: Silinecek kayıt tablosu adı
            item_id: Silinecek kaydın ID'si
            id_column: ID alanının adı (varsayılan: 'id')
            
        Returns:
            Dict: İşlem sonucu
        """
        if not supabase:
            return {"error": "Supabase bağlantısı kurulamadı", "status": "error"}
        
        try:
            result = supabase.table(table_name).delete().eq(id_column, item_id).execute()
            return {
                "status": "success",
                "message": f"ID {item_id} olan kayıt başarıyla silindi"
            }
        except Exception as e:
            return {
                "error": str(e),
                "status": "error"
            }


# Belirli alanlara özgü servisler (domain specific services)
class CustomerSupabaseService:
    """
    Müşteri yönetimi için özel Supabase servisi.
    """
    
    COMPANY_TABLE = 'customers_company'
    CONTACT_TABLE = 'customers_contact'
    
    @staticmethod
    def get_companies(search=None, limit=100, offset=0, order_by='name', filters=None):
        """
        Firma listesi alır, opsiyonel olarak arama ve filtreleme yapar
        """
        search_fields = ['name', 'industry', 'tax_number', 'email', 'phone']
        return SupabaseService.execute_query(
            CustomerSupabaseService.COMPANY_TABLE,
            search=search,
            search_fields=search_fields,
            limit=limit,
            offset=offset,
            order_by=order_by,
            filters=filters or {}
        )
    
    @staticmethod
    def get_contacts_by_company(company_id):
        """
        Belirli bir firmaya ait tüm iletişim kişilerini alır
        """
        filters = {'company_id': company_id}
        return SupabaseService.execute_query(
            CustomerSupabaseService.CONTACT_TABLE,
            filters=filters,
            order_by='is_primary',
            ascending=False
        )
    
    @staticmethod
    def search_all(search_term, limit=50):
        """
        Hem firma hem de iletişim kişileri içinde arama yapar
        """
        if not search_term:
            return {"error": "Arama terimi belirtilmedi", "status": "error"}
        
        # Firmalarda ara
        companies = SupabaseService.execute_query(
            CustomerSupabaseService.COMPANY_TABLE,
            search=search_term,
            search_fields=['name', 'industry', 'email', 'phone', 'tax_number'],
            limit=limit
        )
        
        # İletişim kişilerinde ara
        contacts = SupabaseService.execute_query(
            CustomerSupabaseService.CONTACT_TABLE,
            search=search_term,
            search_fields=['first_name', 'last_name', 'email', 'phone', 'position'],
            limit=limit
        )
        
        return {
            "companies": companies.get("data", []),
            "contacts": contacts.get("data", []),
            "status": "success"
        }


# Yeni modüller için ek servis sınıfları buraya eklenebilir
# Örnek: ProjectSupabaseService, InvoiceSupabaseService, etc.
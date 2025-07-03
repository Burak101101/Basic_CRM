#!/usr/bin/env python
"""
Basic AI Integration Test Script (without API calls)
Bu script AI entegrasyonunun temel yapısını test eder
"""

import os
import sys
import django

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')
django.setup()

from django.contrib.auth.models import User
from customers.models import Company, Contact
from opportunities.models import Opportunity
from ai_assistant.models import AIConfiguration, AIRequest


def test_models():
    """AI modellerini test et"""
    print("=== AI Model Testi ===")
    
    # AI Configuration test
    config_count = AIConfiguration.objects.count()
    print(f"   AI Konfigürasyonları: {config_count}")
    
    if config_count > 0:
        config = AIConfiguration.objects.first()
        print(f"   Varsayılan config: {config.name}")
        print(f"   Model: {config.model_name}")
        print(f"   Provider: {config.provider}")
    
    # AI Request test
    request_count = AIRequest.objects.count()
    print(f"   AI İstekleri: {request_count}")
    
    return config_count > 0


def test_data_relationships():
    """Veri ilişkilerini test et"""
    print("\n=== Veri İlişkileri Testi ===")
    
    companies = Company.objects.all()
    print(f"   Şirket sayısı: {companies.count()}")
    
    for company in companies[:3]:  # İlk 3 şirket
        contacts = Contact.objects.filter(company=company)
        opportunities = Opportunity.objects.filter(company=company)
        print(f"   {company.name}:")
        print(f"     Kişiler: {contacts.count()}")
        print(f"     Fırsatlar: {opportunities.count()}")
        
        if contacts.exists():
            contact = contacts.first()
            print(f"     Örnek kişi: {contact.first_name} {contact.last_name} ({contact.position})")
    
    return companies.count() > 0


def test_ai_service_structure():
    """AI servis yapısını test et"""
    print("\n=== AI Servis Yapı Testi ===")
    
    try:
        from ai_assistant.ai_service import AIService
        print("✅ AIService sınıfı import edildi")
        
        # Servis instance oluştur
        service = AIService()
        print("✅ AIService instance oluşturuldu")
        
        # Konfigürasyon yükleme testi
        try:
            service._ensure_config()
            print("✅ Konfigürasyon yükleme fonksiyonu çalışıyor")
        except Exception as e:
            print(f"⚠️  Konfigürasyon yükleme uyarısı: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI servis yapı hatası: {str(e)}")
        return False


def test_context_methods():
    """Bağlam oluşturma metodlarını test et"""
    print("\n=== Bağlam Metodları Testi ===")
    
    try:
        from ai_assistant.ai_service import AIService
        service = AIService()
        
        # Test kullanıcısı
        user = User.objects.first()
        if not user:
            print("❌ Test kullanıcısı bulunamadı")
            return False
        
        # Kullanıcı bağlamı testi
        user_context = service._get_user_company_context(user)
        print(f"✅ Kullanıcı bağlamı oluşturuldu ({len(user_context)} karakter)")
        
        # Şirket bağlamı testi
        company = Company.objects.first()
        if company:
            customer_context = service._get_customer_context(company_id=company.id)
            print(f"✅ Müşteri bağlamı oluşturuldu ({len(customer_context)} karakter)")
        
        # Fırsat bağlamı testi
        opportunity = Opportunity.objects.first()
        if opportunity:
            opp_context = service._get_opportunity_context(opportunity_id=opportunity.id)
            print(f"✅ Fırsat bağlamı oluşturuldu ({len(opp_context)} karakter)")
        
        # E-posta geçmişi bağlamı testi
        email_context = service._get_email_history_context(company_id=company.id if company else None)
        print(f"✅ E-posta bağlamı oluşturuldu ({len(email_context)} karakter)")
        
        return True
        
    except Exception as e:
        print(f"❌ Bağlam metodları hatası: {str(e)}")
        return False


def test_api_endpoints():
    """API endpoint yapısını test et"""
    print("\n=== API Endpoint Testi ===")
    
    try:
        from ai_assistant import views
        print("✅ AI views modülü import edildi")
        
        # View fonksiyonlarının varlığını kontrol et
        required_views = [
            'generate_email_content',
            'generate_email_reply', 
            'generate_opportunity_proposal',
            'get_ai_requests',
            'check_ai_status'
        ]
        
        for view_name in required_views:
            if hasattr(views, view_name):
                print(f"✅ {view_name} view fonksiyonu mevcut")
            else:
                print(f"❌ {view_name} view fonksiyonu eksik")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint hatası: {str(e)}")
        return False


def test_frontend_components():
    """Frontend bileşenlerinin varlığını test et"""
    print("\n=== Frontend Bileşen Testi ===")
    
    frontend_files = [
        'frontend/src/services/aiService.ts',
        'frontend/src/components/ai/AIButton.tsx',
        'frontend/src/components/ai/AIResponseModal.tsx',
        'frontend/src/components/ai/OpportunityProposalModal.tsx'
    ]
    
    missing_files = []
    for file_path in frontend_files:
        full_path = os.path.join('..', file_path)
        if os.path.exists(full_path):
            print(f"✅ {file_path} mevcut")
        else:
            print(f"❌ {file_path} eksik")
            missing_files.append(file_path)
    
    return len(missing_files) == 0


def main():
    """Ana test fonksiyonu"""
    print("🧪 CRM AI Temel Entegrasyon Testi Başlıyor...\n")
    
    tests = [
        ("AI Modelleri", test_models),
        ("Veri İlişkileri", test_data_relationships),
        ("AI Servis Yapısı", test_ai_service_structure),
        ("Bağlam Metodları", test_context_methods),
        ("API Endpoints", test_api_endpoints),
        ("Frontend Bileşenleri", test_frontend_components),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} testi beklenmeyen hata: {str(e)}")
    
    print(f"\n=== Test Sonuçları ===")
    print(f"Geçen testler: {passed}/{total}")
    print(f"Başarı oranı: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("🎉 Tüm temel testler başarılı!")
        print("\n📝 Sonraki Adımlar:")
        print("1. OpenRouter API anahtarını gerçek bir anahtar ile değiştirin")
        print("2. Frontend uygulamasını başlatın ve AI butonlarını test edin")
        print("3. E-posta oluşturma, yanıtlama ve fırsat önerisi özelliklerini deneyin")
    else:
        print("⚠️  Bazı temel testler başarısız oldu.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

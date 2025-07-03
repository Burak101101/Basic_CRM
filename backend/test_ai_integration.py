#!/usr/bin/env python
"""
AI Integration Test Script
Bu script AI entegrasyonunu test eder
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
from ai_assistant.ai_service import ai_service
from ai_assistant.models import AIConfiguration


def test_ai_configuration():
    """AI konfigürasyonunu test et"""
    print("=== AI Konfigürasyon Testi ===")
    
    config = AIConfiguration.objects.first()
    if not config:
        print("❌ AI konfigürasyonu bulunamadı!")
        return False
    
    print(f"✅ AI Konfigürasyonu: {config.name}")
    print(f"   Model: {config.model_name}")
    print(f"   Provider: {config.provider}")
    print(f"   Aktif: {config.is_active}")
    print(f"   Varsayılan: {config.is_default}")
    return True


def test_ai_status():
    """AI servis durumunu test et"""
    print("\n=== AI Servis Durum Testi ===")
    
    try:
        # Basit bir test mesajı gönder
        test_messages = [
            {"role": "system", "content": "Sen bir test asistanısın."},
            {"role": "user", "content": "Merhaba, bu bir test mesajıdır. Kısa bir yanıt ver."}
        ]
        
        response = ai_service._make_api_request(test_messages, max_tokens=50)
        
        if response and 'choices' in response:
            print("✅ AI servis çalışıyor")
            print(f"   Yanıt: {response['choices'][0]['message']['content'][:100]}...")
            return True
        else:
            print("❌ AI servis yanıt vermiyor")
            return False
            
    except Exception as e:
        print(f"❌ AI servis hatası: {str(e)}")
        return False


def test_email_generation():
    """E-posta oluşturma fonksiyonunu test et"""
    print("\n=== E-posta Oluşturma Testi ===")
    
    try:
        # Test kullanıcısı al
        user = User.objects.first()
        if not user:
            print("❌ Test kullanıcısı bulunamadı")
            return False
        
        # Test şirketi al
        company = Company.objects.first()
        if not company:
            print("❌ Test şirketi bulunamadı")
            return False
        
        # Test kişisi al
        contact = Contact.objects.filter(company=company).first()
        
        print(f"   Kullanıcı: {user.username}")
        print(f"   Şirket: {company.name}")
        print(f"   Kişi: {contact.first_name + ' ' + contact.last_name if contact else 'Yok'}")
        
        # E-posta içeriği oluştur
        content = ai_service.generate_email_content(
            user=user,
            subject="Test E-posta",
            company_id=company.id,
            contact_id=contact.id if contact else None,
            additional_context="Bu bir test e-postasıdır."
        )
        
        print("✅ E-posta içeriği oluşturuldu")
        print(f"   İçerik uzunluğu: {len(content)} karakter")
        print(f"   İçerik önizleme: {content[:200]}...")
        return True
        
    except Exception as e:
        print(f"❌ E-posta oluşturma hatası: {str(e)}")
        return False


def test_opportunity_generation():
    """Fırsat önerisi oluşturma fonksiyonunu test et"""
    print("\n=== Fırsat Önerisi Testi ===")
    
    try:
        # Test kullanıcısı al
        user = User.objects.first()
        if not user:
            print("❌ Test kullanıcısı bulunamadı")
            return False
        
        # Test şirketi al
        company = Company.objects.first()
        if not company:
            print("❌ Test şirketi bulunamadı")
            return False
        
        print(f"   Kullanıcı: {user.username}")
        print(f"   Şirket: {company.name}")
        
        # Fırsat önerisi oluştur
        opportunity_data = ai_service.generate_opportunity_proposal(
            user=user,
            company_id=company.id,
            additional_context="Bu şirket için yeni fırsat önerileri gerekiyor."
        )
        
        print("✅ Fırsat önerileri oluşturuldu")
        print(f"   Öneri sayısı: {len(opportunity_data.get('opportunities', []))}")
        
        for i, opp in enumerate(opportunity_data.get('opportunities', [])[:2]):  # İlk 2 öneri
            print(f"   Öneri {i+1}: {opp.get('title', 'Başlık yok')}")
            print(f"            Değer: {opp.get('estimated_value', 0):,} TL")
            print(f"            Öncelik: {opp.get('priority', 'Belirtilmemiş')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Fırsat önerisi hatası: {str(e)}")
        return False


def test_data_availability():
    """Test verilerinin varlığını kontrol et"""
    print("\n=== Test Verisi Kontrolü ===")
    
    user_count = User.objects.count()
    company_count = Company.objects.count()
    contact_count = Contact.objects.count()
    opportunity_count = Opportunity.objects.count()
    
    print(f"   Kullanıcılar: {user_count}")
    print(f"   Şirketler: {company_count}")
    print(f"   Kişiler: {contact_count}")
    print(f"   Fırsatlar: {opportunity_count}")
    
    if company_count > 0 and contact_count > 0:
        print("✅ Test verileri mevcut")
        return True
    else:
        print("❌ Yeterli test verisi yok")
        return False


def main():
    """Ana test fonksiyonu"""
    print("🤖 CRM AI Entegrasyon Testi Başlıyor...\n")
    
    tests = [
        ("Veri Kontrolü", test_data_availability),
        ("AI Konfigürasyon", test_ai_configuration),
        ("AI Servis Durumu", test_ai_status),
        ("E-posta Oluşturma", test_email_generation),
        ("Fırsat Önerisi", test_opportunity_generation),
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
        print("🎉 Tüm testler başarılı!")
    else:
        print("⚠️  Bazı testler başarısız oldu.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

#!/usr/bin/env python
"""
Test e-posta konfigürasyonu kurulum scripti
Bu script, CRM uygulamasında e-posta gönderme özelliğini test etmek için
gerekli konfigürasyonu oluşturur.
"""

import os
import sys
import django
from communications.models import EmailConfig

# Django ayarlarını yükle
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm.settings')
django.setup()



def setup_test_email_config():
    """Test e-posta konfigürasyonu oluştur"""
    
    print("Test e-posta konfigürasyonu kontrol ediliyor...")
    
    # Mevcut test konfigürasyonunu kontrol et
    test_config = EmailConfig.objects.filter(name='Test Configuration').first()
    
    if test_config:
        print("✓ Test e-posta konfigürasyonu zaten mevcut.")
        print(f"  - Konfigürasyon: {test_config.name}")
        print(f"  - E-posta: {test_config.email_address}")
        print(f"  - Aktif: {'Evet' if test_config.is_active else 'Hayır'}")
        print(f"  - Varsayılan: {'Evet' if test_config.is_default else 'Hayır'}")
        return
    
    # Test konfigürasyonu oluştur
    print("Test e-posta konfigürasyonu oluşturuluyor...")
    
    EmailConfig.objects.create(
        name='Test Configuration',
        smtp_server='localhost',
        smtp_port=587,
        use_tls=True,
        email_address='test@example.com',
        display_name='Test Sender',
        username='test',
        password='test',
        is_active=True,
        is_default=True
    )
    
    print("✓ Test e-posta konfigürasyonu başarıyla oluşturuldu!")
    print("\nÖNEMLİ NOTLAR:")
    print("- Debug modunda (DEBUG=True) e-postalar gerçekten gönderilmez")
    print("- E-postalar backend/test_emails/ klasörüne JSON dosyası olarak kaydedilir")
    print("- Bu sayede e-posta gönderme özelliğini güvenle test edebilirsiniz")
    print("- Gerçek e-posta göndermek için production ayarlarını yapılandırın")

if __name__ == '__main__':
    try:
        setup_test_email_config()
    except Exception as e:
        print(f"Hata: {e}")
        sys.exit(1)

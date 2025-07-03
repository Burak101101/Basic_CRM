#!/usr/bin/env python
"""
SMTP e-posta konfigürasyonu kurulum scripti
Bu script artık kullanılmamaktadır.
Lütfen CRM uygulamasında Profil > E-posta Ayarları sekmesinden
SMTP ayarlarınızı yapılandırın.
"""

print("=" * 50)
print("BU SCRIPT ARTIK KULLANILMAMAKTADIR")
print("=" * 50)
print()
print("SMTP e-posta ayarlarını yapmak için:")
print("1. CRM uygulamasına giriş yapın")
print("2. Profil sayfasına gidin")
print("3. 'E-posta Ayarları' sekmesini seçin")
print("4. SMTP bilgilerinizi girin:")
print("   - SMTP Sunucusu (örn: smtp.gmail.com)")
print("   - SMTP Port (örn: 587)")
print("   - Kullanıcı Adı (e-posta adresiniz)")
print("   - Şifre (Gmail için App Password)")
print("   - TLS Kullan (önerilen)")
print()
print("Popüler SMTP ayarları:")
print("- Gmail: smtp.gmail.com:587 (2FA + App Password gerekli)")
print("- Outlook: smtp-mail.outlook.com:587")
print("- Yahoo: smtp.mail.yahoo.com:587")
print("- Yandex: smtp.yandex.com:587")
print()
print("Not: Gmail kullanıyorsanız 2FA aktif olmalı ve App Password")
print("     oluşturmalısınız: Google Account > Security > App passwords")
print()

import sys
sys.exit(0)

# Bu fonksiyonlar artık kullanılmamaktadır
def setup_email_config():
    """Gerçek e-posta konfigürasyonu oluştur"""
    
    print("=== CRM E-posta Konfigürasyonu ===\n")
    
    # Mevcut konfigürasyonları listele
    existing_configs = EmailConfig.objects.all()
    if existing_configs:
        print("Mevcut e-posta konfigürasyonları:")
        for config in existing_configs:
            print(f"  - {config.name} ({config.email_address}) - {'Aktif' if config.is_active else 'Pasif'}")
        print()
    
    print("Yeni e-posta konfigürasyonu oluşturmak için bilgileri girin:")
    print("(Çıkmak için Ctrl+C basın)\n")
    
    try:
        # Kullanıcıdan bilgileri al
        name = input("Konfigürasyon adı: ").strip()
        if not name:
            name = "Varsayılan SMTP"
        
        email_address = input("E-posta adresi: ").strip()
        if not email_address:
            print("E-posta adresi zorunludur!")
            return
        
        display_name = input("Görünen ad (opsiyonel): ").strip()
        if not display_name:
            display_name = email_address.split('@')[0]
        
        print("\nSMTP Ayarları:")
        smtp_server = input("SMTP sunucusu (örn: smtp.gmail.com): ").strip()
        if not smtp_server:
            smtp_server = "smtp.gmail.com"
        
        smtp_port = input("SMTP port (varsayılan: 587): ").strip()
        if not smtp_port:
            smtp_port = 587
        else:
            smtp_port = int(smtp_port)
        
        use_tls = input("TLS kullan? (y/n, varsayılan: y): ").strip().lower()
        use_tls = use_tls != 'n'
        
        username = input("Kullanıcı adı (genelde e-posta adresi): ").strip()
        if not username:
            username = email_address
        
        password = input("Şifre (Gmail için App Password): ").strip()
        if not password:
            print("Şifre zorunludur!")
            return
        
        is_default = input("Bu konfigürasyonu varsayılan yap? (y/n, varsayılan: y): ").strip().lower()
        is_default = is_default != 'n'
        
        # Eğer varsayılan yapılacaksa, diğerlerini varsayılan olmaktan çıkar
        if is_default:
            EmailConfig.objects.filter(is_default=True).update(is_default=False)
        
        # Konfigürasyonu oluştur
        config = EmailConfig.objects.create(
            name=name,
            smtp_server=smtp_server,
            smtp_port=smtp_port,
            use_tls=use_tls,
            email_address=email_address,
            display_name=display_name,
            username=username,
            password=password,
            is_active=True,
            is_default=is_default
        )
        
        print(f"\n✓ E-posta konfigürasyonu başarıyla oluşturuldu!")
        print(f"  - ID: {config.id}")
        print(f"  - Ad: {config.name}")
        print(f"  - E-posta: {config.email_address}")
        print(f"  - SMTP: {config.smtp_server}:{config.smtp_port}")
        print(f"  - Varsayılan: {'Evet' if config.is_default else 'Hayır'}")
        
        print("\nÖNEMLİ NOTLAR:")
        print("- Gmail kullanıyorsanız, 2FA aktif olmalı ve App Password kullanmalısınız")
        print("- App Password oluşturmak için: Google Account > Security > App passwords")
        print("- Diğer e-posta sağlayıcıları için SMTP ayarlarını kontrol edin")
        print("- SendGrid kullanmak için SENDGRID_API_KEY environment variable'ını ayarlayın")
        
    except KeyboardInterrupt:
        print("\n\nİşlem iptal edildi.")
    except Exception as e:
        print(f"\nHata: {e}")

if __name__ == '__main__':
    setup_email_config()

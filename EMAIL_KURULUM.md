# SMTP E-posta Gönderimi Kurulumu

## 1. E-posta Ayarlarını Yapılandırma

### CRM Uygulaması Üzerinden (Önerilen)
1. CRM uygulamasına giriş yapın
2. Profil sayfasına gidin
3. "E-posta Ayarları" sekmesini seçin
4. SMTP bilgilerinizi girin:
   - **Gönderen E-posta Adresi**: E-postalarınızın gönderileceği adres
   - **Gönderen Adı**: E-postalarda görünecek isim
   - **SMTP Sunucusu**: E-posta sağlayıcınızın SMTP sunucusu
   - **SMTP Port**: Genellikle 587 (TLS için)
   - **SMTP Kullanıcı Adı**: Genellikle e-posta adresiniz
   - **SMTP Şifre**: E-posta şifreniz (Gmail için App Password)
   - **TLS Kullan**: Güvenlik için önerilen

### Manuel Kurulum (Geliştiriciler için)
Artık EmailConfig modeli kullanılmamaktadır. Tüm SMTP ayarları kullanıcı profilinde saklanır.

## 2. Gmail Kurulumu (En Yaygın)

### Adım 1: 2FA Aktifleştirin
1. Google Account > Security
2. 2-Step Verification'ı aktifleştirin

### Adım 2: App Password Oluşturun
1. Google Account > Security > App passwords
2. "Mail" seçin
3. Oluşturulan 16 haneli şifreyi kopyalayın

### Adım 3: Konfigürasyon
- **SMTP Server**: smtp.gmail.com
- **Port**: 587
- **TLS**: Evet
- **Username**: Gmail adresiniz
- **Password**: App Password (16 haneli)

## 3. SMTP Test Etme

### Bağlantı Testi
SMTP ayarlarınızı girdikten sonra, e-posta göndermeyi test edin:
1. CRM'de İletişim > E-posta Oluştur sayfasına gidin
2. Test e-postası gönderin
3. Hata alırsanız SMTP ayarlarınızı kontrol edin

## 4. Diğer E-posta Sağlayıcıları

### Outlook/Hotmail
- **SMTP Server**: smtp-mail.outlook.com
- **Port**: 587
- **TLS**: Evet

### Yahoo
- **SMTP Server**: smtp.mail.yahoo.com
- **Port**: 587 veya 465
- **TLS**: Evet

### Yandex
- **SMTP Server**: smtp.yandex.com
- **Port**: 587
- **TLS**: Evet

## 5. Test Etme

### Frontend'den Test
1. CRM'e giriş yapın
2. Profil > E-posta Ayarları'ndan SMTP ayarlarınızı yapın
3. İletişim > E-posta Oluştur sayfasına gidin
4. Firma seçin (zorunlu)
5. Alıcı e-posta adresi girin
6. Konu ve içerik yazın
7. "Gönder" butonuna tıklayın

## 6. Hata Giderme

### "SMTP ayarları eksik" Hatası
- Profil > E-posta Ayarları'ndan tüm SMTP alanlarını doldurun
- Özellikle SMTP sunucusu, port, kullanıcı adı ve şifre zorunludur

### Gmail "Authentication failed"
- App Password kullandığınızdan emin olun
- 2FA aktif olmalı
- Normal Gmail şifresi çalışmaz
- App Password oluşturmak için: Google Account > Security > App passwords

### "SMTP connection failed"
- İnternet bağlantınızı kontrol edin
- Firewall/antivirus SMTP portlarını engelliyor olabilir
- SMTP sunucu adresi ve port numarasını kontrol edin
- TLS ayarını kontrol edin (çoğu sağlayıcı için gerekli)

## 7. Güvenlik Notları

- **Asla** gerçek şifrelerinizi kullanmayın
- Gmail için mutlaka App Password kullanın
- SMTP şifrelerini güvenli tutun
- Production'da hassas bilgileri environment variable olarak saklayın
- SMTP bağlantılarında TLS kullanın
- Düzenli olarak şifrelerinizi değiştirin

## 8. Production Ayarları

### Güvenlik
- Production ortamında SMTP şifrelerini environment variable olarak saklayın
- Database'de şifreler şifrelenmiş olarak saklanmalıdır
- HTTPS kullanın
- Güvenlik duvarı ayarlarını kontrol edin

### Performans
- E-posta gönderimini asenkron hale getirin (Celery kullanabilirsiniz)
- Rate limiting uygulayın
- E-posta loglarını takip edin

# CRM AI Integration Guide

## 🤖 DeepSeek R1 0528 AI Assistant Integration

Bu dokümantasyon, CRM sistemine entegre edilen DeepSeek R1 0528 AI asistanının kullanımını ve yapılandırmasını açıklar.

## 📋 Özellikler

### ✅ Tamamlanan Özellikler

1. **E-posta Oluşturma AI Asistanı**
   - E-posta gönderme sayfasında AI butonu
   - Müşteri, firma ve fırsat verilerini analiz eder
   - Kişiselleştirilmiş e-posta içeriği oluşturur
   - Kullanıcı onayı ile içerik düzenlenebilir

2. **Gelen Kutusu Yanıt AI Asistanı**
   - Gelen e-postalarda AI yanıt butonu
   - Gelen mesaj içeriğini analiz eder
   - Uygun yanıt önerileri oluşturur
   - Doğrudan e-posta oluşturma sayfasına yönlendirir

3. **Fırsat Oluşturma AI Asistanı**
   - Kişiler ve firmalar sayfasında AI fırsat öner butonu
   - Müşteri/firma profilini analiz eder
   - Özelleştirilmiş satış fırsatı önerileri oluşturur
   - Çoklu fırsat seçimi ve oluşturma imkanı

## 🏗️ Teknik Yapı

### Backend Bileşenleri

#### Models (`ai_assistant/models.py`)
- `AIConfiguration`: AI servis yapılandırması
- `AIRequest`: AI istekleri ve yanıtları için log

#### AI Service (`ai_assistant/ai_service.py`)
- `AIService`: Ana AI servis sınıfı
- OpenRouter API entegrasyonu
- DeepSeek R1 0528 model kullanımı
- Bağlam analizi ve içerik oluşturma

#### API Endpoints (`ai_assistant/views.py`)
- `/api/v1/ai/email/compose/`: E-posta içeriği oluşturma
- `/api/v1/ai/email/reply/`: E-posta yanıtı oluşturma
- `/api/v1/ai/opportunity/generate/`: Fırsat önerisi oluşturma
- `/api/v1/ai/status/`: AI servis durumu
- `/api/v1/ai/requests/`: AI istek geçmişi

### Frontend Bileşenleri

#### Services (`frontend/src/services/aiService.ts`)
- AI API çağrıları için servis sınıfı
- TypeScript tip tanımları
- Hata yönetimi

#### Components
- `AIButton`: Yeniden kullanılabilir AI butonu
- `AIResponseModal`: AI yanıtlarını gözden geçirme modalı
- `OpportunityProposalModal`: Fırsat önerilerini görüntüleme modalı

## 🚀 Kurulum ve Yapılandırma

### 1. AI Konfigürasyonu

```bash
# Backend dizininde
python manage.py setup_ai_config --api-key "YOUR_OPENROUTER_API_KEY"
```

### 2. Test Verisi Oluşturma

```bash
# Gerçek şirket ve kişi verileri ile test verisi oluştur
python manage.py create_test_data
```

### 3. Temel Test

```bash
# AI entegrasyonunu test et (API anahtarı olmadan)
python test_ai_basic.py
```

## 📊 Test Verileri

Sistem aşağıdaki gerçek Türk şirketleri ve kişileri içerir:

### Şirketler
- **Türk Telekom A.Ş.** (Telekomünikasyon)
- **Garanti BBVA** (Bankacılık ve Finans)
- **Arçelik A.Ş.** (Beyaz Eşya ve Elektronik)
- **Migros Ticaret A.Ş.** (Perakende)
- **Anadolu Efes** (İçecek ve Gıda)
- **Teknoloji Çözümleri Ltd.** (Bilgi Teknolojileri)
- **Yeşil Enerji Sistemleri** (Yenilenebilir Enerji)
- **Kreatif Ajans** (Reklam ve Pazarlama)

### Kişiler
Her şirket için 2-3 gerçekçi kişi profili:
- Genel Müdür, Satış Müdürü, Teknik Müdür
- Gerçek Türk isimleri ve pozisyonları
- E-posta adresleri ve telefon numaraları

### Fırsatlar
- CRM Yazılım Projesi (250.000 TL)
- Mobil Uygulama Geliştirme (150.000 TL)
- Dijital Dönüşüm Danışmanlığı (75.000 TL)
- Bulut Altyapı Migrasyonu (180.000 TL)
- E-ticaret Platformu (120.000 TL)

## 🎯 Kullanım Senaryoları

### E-posta Oluşturma
1. E-posta gönderme sayfasına git
2. Firma ve kişi seç
3. Fırsat seç (opsiyonel)
4. "AI ile Oluştur" butonuna tıkla
5. Oluşturulan içeriği gözden geçir ve düzenle
6. Onayla ve gönder

### E-posta Yanıtlama
1. Gelen kutusu sayfasına git
2. Bir e-postayı aç
3. "AI ile Yanıtla" butonuna tıkla
4. Oluşturulan yanıtı gözden geçir
5. Onayla ve e-posta oluşturma sayfasına git

### Fırsat Oluşturma
1. Kişi veya firma detay sayfasına git
2. "AI Fırsat Öner" butonuna tıkla
3. Önerilen fırsatları gözden geçir
4. İstediğin fırsatları seç
5. "Seçili Fırsatları Oluştur" butonuna tıkla

## 🔧 Yapılandırma

### AI Konfigürasyon Parametreleri
- **Model**: `deepseek/deepseek-r1`
- **Provider**: `openrouter`
- **Max Tokens**: 4000
- **Temperature**: 0.7
- **API URL**: `https://openrouter.ai/api/v1/chat/completions`

### Güvenlik
- API anahtarları şifrelenmiş olarak saklanır
- Tüm AI istekleri loglanır
- Kullanıcı onayı olmadan hiçbir işlem yapılmaz

## 📈 Performans ve Monitoring

### AI İstek Logları
- Tüm AI istekleri `AIRequest` modelinde saklanır
- İstek türü, durum, yanıt süresi takip edilir
- Hata durumları loglanır

### Metrikler
- E-posta oluşturma başarı oranı
- Yanıt süresi ortalaması
- Kullanıcı memnuniyet oranı (onay/red)

## 🚨 Hata Yönetimi

### Yaygın Hatalar
1. **401 Unauthorized**: API anahtarı geçersiz
2. **Rate Limit**: API çağrı limiti aşıldı
3. **JSON Parse Error**: AI yanıtı geçersiz format

### Çözümler
- API anahtarını kontrol et
- Rate limit ayarlarını gözden geçir
- AI prompt'larını optimize et

## 🔄 Güncellemeler ve Bakım

### Düzenli Bakım
- AI istek loglarını temizle (30 gün)
- API kullanım istatistiklerini gözden geçir
- Model performansını değerlendir

### Güncelleme Süreci
1. Yeni AI konfigürasyonu oluştur
2. Test ortamında dene
3. Aşamalı olarak production'a geç
4. Eski konfigürasyonu devre dışı bırak

## 📞 Destek

### Teknik Destek
- Backend: Django REST Framework + OpenRouter API
- Frontend: React + TypeScript
- AI Model: DeepSeek R1 0528

### İletişim
- Teknik sorular için: AI Assistant logs
- API sorunları için: OpenRouter documentation
- Genel destek için: CRM admin panel

---

**Not**: Bu entegrasyon, kullanıcı onayı gerektiren AI asistanı özelliklerini içerir. Tüm AI önerileri kullanıcı tarafından gözden geçirilmeli ve onaylanmalıdır.

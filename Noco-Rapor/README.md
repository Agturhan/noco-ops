# 📊 NOCO Rapor Sistemi v2.0 - Server-less Edition

Tamamen tarayıcı tabanlı, server gerektirmeyen sosyal medya rapor oluşturma sistemi.

## 🚀 Hızlı Başlangıç

### ✅ Sunucusuz Kullanım (ÖNERİLEN)

Hiçbir server kurmadan, dosyalara çift tıklayarak kullanın:

```bash
1. data-editor.html'i açın (çift tıklayın)
2. Formu doldurun
3. "JSON Oluştur" butonuna tıklayın
4. JSON'u kopyalayın
5. viewer.html'i açın (çift tıklayın)
6. JSON'u yapıştırın
7. "Raporu Göster" butonuna tıklayın
```

### 📂 Dosya Yapısı

```
Noco-Rapor/
├── data-editor.html      # 1️⃣ Form ile veri girişi
├── viewer.html           # 2️⃣ JSON yapıştır ve görüntüle
├── template/
│   └── onepage.html      # 3️⃣ Rapor çıktısı
├── sample-data.json      # Örnek veri (opsiyonel)
├── README.md
└── start-server.sh       # (Sadece fetch testi için)
```

## 💾 Veri Nasıl Kaydedilir?

- **localStorage kullanılır** → Tarayıcınızda saklanır
- **Server gerekmez** → Tamamen offline çalışır  
- **Kalıcıdır** → Tarayıcı verisini silmediğiniz sürece durur
- **Güvenlidir** → Sadece sizin bilgisayarınızda

## 🎯 Kullanım Senaryoları

### Senaryo 1: Yeni Rapor Oluştur

```
data-editor.html → JSON oluştur → viewer.html → Raporu göster
```

### Senaryo 2: Kaydedilen Raporu Görüntüle

```
viewer.html'i aç (otomatik yüklenir) → Raporu göster
```

### Senaryo 3: Raporu Güncelle

```
viewer.html → JSON düzenle → Raporu göster
```

## 🔧 Özellikler

✅ **Server-sız çalışma** - Localhost gerekmez  
✅ **localStorage ile kalıcı veri** - Veriler tarayıcıda saklanır  
✅ **Otomatik JSON validasyon** - Hatalı veri kontrolü  
✅ **Dark/Light tema** - Göz rahatlığı  
✅ **PDF export** - Print ile PDF oluşturma  
✅ **CSV export** - Excel uyumlu veri dışa aktarımı  
✅ **HTML export** - Standalone rapor dosyası  
✅ **Responsive tasarım** - Mobil uyumlu  
✅ **Grafik desteği** - Chart.js ile görselleştirme  

## 📋 JSON Format

```json
{
  "brand": {
    "name": "Marka Adı",
    "period": "Kasım 2025"
  },
  "summary": {
    "followers": 18834,
    "followers_change": 2.6,
    "reach": 96450,
    "reach_change": -35.2,
    "impressions": 399764,
    "eng_rate": 0
  },
  "profile_actions": {
    "profile_visits": 9919,
    "external_link_taps": 769,
    "address_taps": 100
  },
  "content_mix": [
    { "name": "Reels", "percent": 84 },
    { "name": "Hikaye", "percent": 8 }
  ],
  "growth_trend": {
    "reach": [
      { "period": "Eylül", "value": 140649 },
      { "period": "Ekim", "value": 96459 }
    ]
  },
  "top_contents": [
    {
      "title": "İçerik Başlığı",
      "type": "Reel",
      "reach": 16889,
      "eng": 49,
      "rate": 0.3
    }
  ],
  "campaigns": [
    {
      "name": "Kampanya Adı",
      "objective": "traffic",
      "spend": 3313,
      "metric1": { "label": "Tıklama", "value": 4453 },
      "metric2": { "label": "CPC (₺)", "value": 0.74 }
    }
  ],
  "strategies": [
    "Strateji 1",
    "Strateji 2"
  ],
  "recommendations": [
    "Öneri 1",
    "Öneri 2"
  ],
  "service_fee": {
    "amount": 40000,
    "currency": "TRY"
  },
  "bank_info": {
    "account_name": "NOCO CREATIVE DIGITAL STUDIOS",
    "bank_name": "Garanti BBVA",
    "iban": "TR12 0006 2000 4720 0006 2968 14"
  }
}
```

## 🐛 Sorun Giderme

### "Rapor Verisi Bulunamadı" hatası alıyorum

→ viewer.html üzerinden JSON kodunu yapıştırın ve "Raporu Göster" butonuna tıklayın

### JSON hatası alıyorum

→ data-editor.html kullanarak JSON oluşturun (manuel yazma yerine)

### Veri kayboldu

→ Tarayıcı önbelleğini temizlediyseniz veriler silinmiş olabilir. JSON'u başka yere de yedekleyin.

### Dark tema çalışmıyor

→ Tema tercihi de localStorage'da saklanır, çalışması gerekir

## 🔄 Veri Yedekleme

LocalStorage verileri tarayıcıya bağlıdır. Önemli raporları yedeklemek için:

1. viewer.html'de JSON'u kopyalayın
2. `.json` uzantılı dosya olarak kaydedin
3. Gerektiğinde tekrar yapıştırın

## 📱 Tarayıcı Uyumluluğu

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  

## 🎨 Tema

- **Light Mode**: Bej tonları, göz yormuyor
- **Dark Mode**: Koyu ton, gece çalışması için ideal

Tema tercihi tarayıcıda saklanır.

## 📊 Export Özellikleri

### PDF Export
1. Raporu açın
2. "📑 PDF İndir" butonuna tıklayın
3. Veya: Ctrl/Cmd + P → PDF olarak kaydet

### CSV Export
1. Herhangi bir sayfada "📊 CSV İndir" butonuna tıklayın
2. Excel veya Google Sheets'te açın
3. Tüm metrikler ve veriler yapılandırılmış biçimde aktarılır

**CSV İçeriği:**
- Özet Metrikler (Takipçi, Erişim, Görüntüleme, Etkileşim)
- Profil Hareketleri (Ziyaret, Bağlantı, Adres dokunmaları)
- İçerik Dağılımı (Reels, Hikaye, Tasarım yüzdeleri)
- Büyüme Trendi (Erişim ve Görüntüleme grafik verileri)
- En İyi İçerikler (Başlık, tür, metrikler)
- Kampanyalar (Ad, amaç, bütçe, metrikler)
- Stratejiler ve Öneriler
- Teslim Edilen İçerikler (Reels ve Tasarımlar)
- Hizmet Bedeli ve Banka Bilgileri

### HTML Export
1. Rapor sayfasında "📄 HTML İndir" butonuna tıklayın
2. Tek dosya olarak tüm rapor indirilir
3. Herhangi bir tarayıcıda açılabilir (internet bağlantısı gerekmez)

## ⚙️ Gelişmiş: Server ile Kullanım (Opsiyonel)

Eğer sample-data.json dosyasını fetch ile test etmek isterseniz:

```bash
./start-server.sh
# http://localhost:8000
```

**NOT**: Normal kullanım için server gerekmez!

## 📞 Destek

NOCO CREATIVE DIGITAL STUDIOS  
Reklam Ticaret Limited Şirketi

---

**v2.0 Güncellemeleri:**
- ✅ Tamamen server-sız çalışma
- ✅ localStorage tabanlı veri yönetimi
- ✅ Geliştirilmiş kullanıcı arayüzü
- ✅ Otomatik veri yükleme
- ✅ Veri yoksa yönlendirme ekranı
- ✅ Dark/Light tema desteği
- ✅ Responsive tasarım
- ✅ **YENİ:** CSV Export özelliği - Excel uyumlu veri dışa aktarımı
- ✅ **YENİ:** HTML Export - Standalone rapor dosyası

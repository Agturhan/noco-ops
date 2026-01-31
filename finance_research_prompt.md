# 🤖 Noco Ops - Finans & Muhasebe Modülü Araştırma ve Mimari Promptu

Aşağıdaki metni kopyalayıp gelişmiş bir AI modeline (ChatGPT Pro, Claude 3.5 Opus vb.) göndererek projemiz için en uygun mimariyi çıkartabilirsin.

---

**PROMPT BAŞLANGICI**

Merhaba, ben modern bir İçerik Üretim ve Ajans Yönetim Sistemi (Noco Ops) geliştiriyorum. Bu uygulama şu anda aktif olarak bir içerik ajansı tarafından kullanılıyor ve içerisinde;
*   **İçerik Üretim Takibi** (Kanban, Liste, Arşiv),
*   **Stüdyo Rezervasyon Yönetimi** (Takvim entegreli),
*   **Görev Yönetimi** (Kişi atama, deadline, sürükle-bırak),
*   **Takvim** (Global içerik ve etkinlik takvimi),
*   **Hakediş (Retainer) Takibi** (Müşteri bazlı aylık üretim kotaları)
modülleri bulunuyor.

**Teknoloji Yığını:**
*   Next.js 14 (App Router)
*   TypeScript & React
*   Supabase (PostgreSQL)
*   Tailwind CSS & Shadcn UI

### 🎯 Hedef
Uygulamaya **kapsamlı, uzun vadeli ve ölçeklenebilir bir "Finans & Muhasebe" modülü** eklemek istiyoruz. Bu modül sıradan bir gelir-gider takibinden öte, ajansın finansal sağlığını gösteren, operasyonel verilerle (Hakediş, Stüdyo kullanımı) konuşan entegre bir yapı olmalı.

### 💼 Gereksinimler ve Özellikler

1.  **Finansal Yapı & Veri Tutumu:**
    *   **Gelirler:** Retainer (Aylık Sabit) anlaşmalar, Proje bazlı işler, Ekstra Stüdyo gelirleri.
    *   **Giderler:** Sabit giderler (Kira, Yazılım), Değişken giderler (Freelancer ödemeleri, Prodüksiyon masrafları), Personel maaşları.
    *   **Excel Entegrasyonu:** Kullanıcılar banka dökümlerini veya eski kayıtlarını Excel/CSV olarak içeri aktarabilmeli (Import) ve raporları dışarı aktarabilmeli (Export).
    *   **İçsel Hesaplamalar:** KDV, Stopaj hesaplamaları, Karlılık oranları (ROI), Müşteri bazlı karlılık (Hangi müşteri bize ne kadar kazandırdı vs ne kadar efor harcandı).

2.  **Erişim ve Güvenlik (RBAC):**
    *   Şu an 4 kişilik çekirdek bir ekip kullanıyor (Admin yetkisinde).
    *   İleride ekip büyüyeceği için bu "Finans" sekmesi sadece yetkili "Admin" veya "Muhasebe" rolündeki kullanıcılara açık olmalı.
    *   Veritabanı düzeyinde (RLS - Row Level Security) bu ayrımın nasıl yapılacağını (Supabase özelinde) planlamalısın.

3.  **Kullanıcı Deneyimi (UX) & Wireframe:**
    *   Kullanıcı Finans modülüne girdiğinde onu nasıl bir **Dashboard** karşılamalı? Hangi grafikler (Nakit Akışı, Aylık Kar/Zarar) en üstte olmalı?
    *   Gelir/Gider ekleme formları nasıl olmalı? (Hızlı ekleme vs. Detaylı fatura girişi).
    *   Verilere ulaşım hiyerarşisi nasıl olmalı? (Örn: Finans > Faturalar > Bekleyen Ödemeler).

### 🚀 Senden İstediklerim

Bana bu modülü **Senior Software Architect** bakış açısıyla tasarlamanı istiyorum. Lütfen çıktılarını şu başlıklar altında detaylandır:

1.  **Veritabanı Şeması (SQL/Supabase):**
    *   `transactions`, `invoices`, `categories`, `accounts` vb. tabloların ilişkisel yapısı.
    *   Retainer modülüyle (Clients tablosuyla) nasıl ilişki kuracağı.

2.  **Wireframe & Akış Tasarımı:**
    *   Adım adım hangi menülerin olacağı, sayfaların yerleşimi.
    *   Wireframe'i metin tabanlı (ASCII veya detaylı description) olarak anlat. "Sağ üstte 'Yeni Fatura', solda filtreler..." gibi.

3.  **Excel & Hesaplama Mantığı:**
    *   Excel import için hangi kütüphaneleri ve mantığı önerirsin? (Sütun eşleştirme algoritması vb.)
    *   Otomatik hesaplamalar için Backend (Server Actions) tarafında nasıl bir yapı kurmalıyım?

4.  **En İyi Pratikler (Best Practices):**
    *   Çift taraflı kayıt (Double-entry bookkeeping) gerekli mi yoksa ajans için tek taraflı (Cash-flow) yeterli mi? Neden?
    *   Geleceğe dönük (Multi-currency, Tax rules) esneklik için önerilerin.

Bu analiz, doğrudan koda dökebileceğim netlikte ve profesyonellikte olmalı.

---
**PROMPT BİTİŞİ**

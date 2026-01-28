# NOCO Creative Operations System

Yaratıcı ajanslar için iş kurallarını zorlayan operasyon yönetim sistemi.

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- PostgreSQL (veya Supabase)
- npm veya pnpm

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla
# .env dosyası oluştur ve aşağıdaki değişkenleri ekle:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/noco_ops"
# NEXTAUTH_SECRET="your-secret-key-change-in-production"
# NEXTAUTH_URL="http://localhost:3000"

# Veritabanını oluştur
npx prisma migrate dev

# Seed data yükle
npx prisma db seed

# Geliştirme sunucusunu başlat
npm run dev
```

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── dashboard/         # Ana uygulama sayfaları
│   ├── login/             # Giriş sayfası
│   └── api/               # API endpoints
├── components/
│   ├── ui/                # Button, Card, Badge, Modal, Input
│   └── layout/            # Sidebar, Header
├── lib/
│   ├── machines/          # XState state machines
│   ├── actions/           # Server actions
│   ├── prisma.ts          # Database client
│   └── rules.ts           # Kural değerlendirme
└── styles/
    ├── tokens.css         # Design tokens
    └── components.css     # Component stilleri
```

## 🔐 Demo Kullanıcılar

| E-posta | Şifre | Rol |
|---------|-------|-----|
| admin@noco.digital | demo123 | OWNER |
| ops@noco.digital | demo123 | OPS |
| design@noco.digital | demo123 | DIGITAL |
| client@abc.com | client123 | CLIENT |

## 🔒 İş Kuralları

Sistem aşağıdaki kuralları otomatik olarak zorlar:

1. **Ödeme Olmadan Teslimat Yok**: Fatura ödenmeden dosyalar teslim edilemez
2. **Sınırlı Revizyon**: Sözleşmede belirtilen revizyon sayısı aşılamaz
3. **Rol Bazlı Erişim**: Her kullanıcı sadece yetkili olduğu işlemleri yapabilir
4. **Audit Logging**: Tüm işlemler ve override'lar kayıt altına alınır

## 🛠️ Teknolojiler

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: CSS Design Tokens (NOCO standartları)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js
- **State Machine**: XState

## 📝 Lisans

Bu proje NOCO Digital için özel olarak geliştirilmiştir.

## 🧪 Dashboard Reskin Smoke Test Checklist

Before merging visual changes, verify:

- [ ] **/login**: Standard design preserved?
- [ ] **/dashboard**: Background is dark glass? Cards are glass?
- [ ] **/dashboard/tasks**: Tasks list visible? No infinite loader?
- [ ] **/dashboard/content-production**: Table renders correctly?
- [ ] **/dashboard/invoices**: Layout breaks?
- [ ] **Mobile View**: Resize to < 768px. Do cards stack? Is text readable?
- [ ] **Rollback**: Set `NEXT_PUBLIC_DASHBOARD_RESKIN=false`. Does it revert perfectly?


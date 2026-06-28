# Parfumerya — Premium E-Ticarət Platforması

Azərbaycan bazarı üçün ətir və kosmetika e-ticarət sistemi. Clean Architecture (.NET 8) backend, React (TypeScript) frontend.

## Layihə Strukturu

```
Parfumerya/
├── backend/                    # .NET 8 Web API
│   ├── Parfumerya.sln
│   └── src/
│       ├── Parfumerya.Domain/       # Entity-lər, Enum-lar
│       ├── Parfumerya.Application/  # CQRS (MediatR), DTO-lar
│       ├── Parfumerya.Infrastructure/ # EF Core, Identity, JWT, File Storage
│       └── Parfumerya.WebAPI/       # REST API Controllers
├── frontend/
│   ├── storefront/             # Müştəri saytı (port 3000)
│   └── admin/                  # Admin panel (port 3001)
```

## Dizayn

- **Rəng palitrası:** Tünd bənövşəyi/plum (`#2a1f2d`) + mint yaşıl accent (`#a8e6cf`)
- **Fontlar:** Playfair Display (başlıqlar) + DM Sans (mətn)
- Şəkildə göstərilən "Perf" landing dizaynına uyğun

## Backend — Quraşdırma

**Tələb:** .NET 8 SDK, SQL Server (və ya LocalDB)

```bash
cd backend
dotnet restore
dotnet ef migrations add InitialCreate --project src/Parfumerya.Infrastructure --startup-project src/Parfumerya.WebAPI
dotnet ef database update --project src/Parfumerya.Infrastructure --startup-project src/Parfumerya.WebAPI
dotnet run --project src/Parfumerya.WebAPI
```

API: `https://localhost:5001` (Swagger: `/swagger`)

**Default Admin:**
- Email: `admin@parfumerya.az`
- Şifrə: `Admin123!`

## Frontend — Quraşdırma

```bash
# Müştəri saytı
cd frontend/storefront
npm install
npm run dev

# Admin panel
cd frontend/admin
npm install
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3001

## Modullar

### Admin Panel (18 modul)
Dashboard, Məhsullar, Kateqoriyalar, Brendlər, Sifarişlər, İstifadəçilər, Rəylər, Hesabatlar, Kampaniyalar, Çatdırılma, Ödəniş, Bildirişlər, Banner, Stok, Sevimlilər, Email/SMS, Ayarlar, Təhlükəsizlik

### Müştəri Saytı
Ana səhifə, Mağaza, Məhsul detalları, Səbət, Checkout, Login/Register, Favoritlər, Profil, Sifarişlər

## Arxitektura Xüsusiyyətləri

- **Clean Architecture** — Domain → Application → Infrastructure → WebAPI
- **CQRS + MediatR** — Command/Query ayrımı
- **JWT Authentication** — SuperAdmin, Admin, Customer rolları
- **Soft Delete** — EF Core global query filter
- **Product Variants** — 50ml/100ml, SKU, qiymət, stok
- **Təhlükəsiz ödəniş** — Kart məlumatı DB-də saxlanılmır (Mock → Stripe/Bank API)
- **Guest Cart** — localStorage, login-dən sonra sinxronizasiya
- **Stok idarəsi** — Sifariş zamanı stok yoxlanışı + StockHistory

## Növbəti Addımlar

1. .NET SDK quraşdırın və backend-i işə salın
2. Real bank/Stripe ödəniş inteqrasiyası
3. SignalR real-time bildirişlər
4. Cloudinary/S3 şəkil storage
5. Email (SendGrid) və SMS inteqrasiyası

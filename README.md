# Parfumerya — Premium E-Ticarət Platforması

Azərbaycan bazarı üçün ətir və kosmetika e-ticarət sistemi. React (TypeScript) frontend + Node.js (Express) API + **MongoDB**.

## Layihə Strukturu

```
Parfumerya/
├── api/                        # ⭐ İşlək API (Node.js/Express + MongoDB) — Render-də deploy olunur
│   ├── server.js               # Giriş nöqtəsi (boot + listen)
│   ├── src/
│   │   ├── config.js           # Port və yollar
│   │   ├── app.js              # Express app (CORS, middleware, route-lar)
│   │   ├── db/                 # readDb/writeDb, MongoDB store, default seed
│   │   ├── routes/             # auth, products, orders, users, wishlist, ...
│   │   ├── middleware/         # auth, upload (multer), error handler
│   │   ├── helpers/            # biznes məntiqi (stok, kupon, rəy hesablamaları)
│   │   └── lib/                # mailer, OTP, validasiya
│   └── data/db.json            # MONGODB_URI olmayanda fallback fayl bazası
├── backend/                    # .NET 8 Web API (skelet — hazırda istifadə olunmur)
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

## Verilənlər bazası — MongoDB

API `MONGODB_URI` environment variable-ı ilə MongoDB-yə qoşulur:

- **URI var** → bütün məlumat MongoDB-də saxlanılır (kolleksiyalar: `users`, `products`, `orders`, `categories`, `brands`, `coupons`, `reviews`, ...). İlk işə düşəndə mövcud `db.json` məlumatı avtomatik Mongo-ya köçürülür.
- **URI yoxdur** → köhnə qaydada `api/data/db.json` faylı ilə işləyir (lokal inkişaf üçün rahatdır).

```bash
# api/.env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/parfumerya?retryWrites=true&w=majority
```

MongoDB Atlas-ın qurulması üçün: **[DEPLOY.md](./DEPLOY.md)** (bölmə 2).

Test: `cd api && npm run test:mongo` — yaddaşda Mongo qaldırıb migrasiya + restart davamlılığını yoxlayır.

## Dizayn

- **Rəng palitrası:** Tünd bənövşəyi/plum (`#2a1f2d`) + mint yaşıl accent (`#a8e6cf`)
- **Fontlar:** Playfair Display (başlıqlar) + DM Sans (mətn)
- Şəkildə göstərilən "Perf" landing dizaynına uyğun

## Backend (.NET skeleti) — Quraşdırma

> ⚠️ Bu bölmə istifadə olunmayan .NET skeletinə aiddir. İşlək API `api/` qovluğundadır (`npm run dev`).

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

## Canlıya çıxarma (Vercel + Render)

Tam addım-addım təlimat: **[DEPLOY.md](./DEPLOY.md)**

Qısa:
- **API** → Render.com (`api/` qovluğu, `render.yaml`)
- **Storefront** → Vercel, Root: `frontend/storefront`
- **Admin** → Vercel, Root: `frontend/admin` (ayrı layihə)

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

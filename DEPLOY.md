# Canlıya çıxarma (Vercel + Render)

Layihə **3 hissədən** ibarətdir:

| Hissə | Harada deploy | Qovluq |
|-------|---------------|--------|
| Müştəri saytı | **Vercel** | `frontend/storefront` |
| Admin panel | **Vercel** (ayrı layihə) | `frontend/admin` |
| API (backend) | **Render.com** | `api` |

> Vercel yalnız React frontend-i host edir. Express API (`api/server.js`) Vercel-də işləmir.

---

## 1. GitHub-a push

```bash
git add .
git commit -m "Deploy konfiqurasiyası"
git push origin main
```

---

## 2. Verilənlər bazası — MongoDB Atlas (pulsuz)

> **Niyə vacibdir:** Render-in pulsuz planında disk hər deploy-da sıfırlanır — `db.json` faylındakı bütün sifarişlər/istifadəçilər silinirdi. MongoDB ilə məlumat həmişəlik qalır.

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) → qeydiyyatdan keç
2. **Create a Cluster** → **M0 Free** → provayder/region fərq etmir → **Create**
3. **Database Access** → **Add New Database User** → istifadəçi adı + şifrə yarat (şifrəni yadda saxla, xüsusi simvollardan qaçın)
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) ⚠️ **Vacib!** (Render-in IP-ləri dəyişkəndir)
5. **Clusters** → **Connect** → **Drivers** → connection string-i kopyala:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/parfumerya?retryWrites=true&w=majority
   ```
   - `USER` və `PASSWORD`-u öz yaratdıqlarınla əvəz et
   - `/parfumerya` — database adıdır, `/` ilə `?` arasına yaz

Bu URL-i aşağıda Render-də `MONGODB_URI` kimi qoyacaqsan. **Başqa heç nə lazım deyil** — API ilk işə düşəndə kolleksiyaları özü yaradır və mövcud `db.json` məlumatını avtomatik köçürür.

> Lokal test üçün: `api/.env` faylına `MONGODB_URI=...` yaz. Boş qalsa köhnə kimi `db.json` ilə işləyir.

---

## 3. API — Render.com

1. [render.com](https://render.com) → **Sign Up** → GitHub ilə qoşul
2. **New +** → **Blueprint** → bu repo-nu seç
3. `render.yaml` avtomatik `parfumerya-3` servisini yaradacaq
4. **Environment Variables** (Render dashboard):
   ```
   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/parfumerya?retryWrites=true&w=majority
   CORS_ORIGINS=https://SIZIN-STORE.vercel.app,https://SIZIN-ADMIN.vercel.app
   ```
   (CORS URL-ləri Vercel deploy-dan sonra yeniləyin)
5. **Deploy** — bitəndə API ünvanını götürün:
   ```
   https://parfumerya-3.onrender.com
   ```
6. Yoxlama: brauzerdə açın → `https://parfumerya-3.onrender.com/api/health`

---

## 4. Müştəri saytı — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. GitHub repo-nu import et
3. **Root Directory:** `frontend/storefront` ⚠️ **Vacib!**
4. Framework: **Vite** (avtomatik tanınmalıdır)
5. **Environment Variables:**

   | Ad | Dəyər |
   |----|-------|
   | `VITE_API_URL` | `https://parfumerya-3.onrender.com/api` |
   | `VITE_ADMIN_URL` | `https://SIZIN-ADMIN.vercel.app` |

6. **Deploy**

---

## 5. Admin panel — Vercel (2-ci layihə)

1. Vercel-də yenidən **Add New → Project** → eyni repo
2. **Root Directory:** `frontend/admin`
3. **Environment Variables:**

   | Ad | Dəyər |
   |----|-------|
   | `VITE_API_URL` | `https://parfumerya-3.onrender.com/api` |
   | `VITE_STOREFRONT_URL` | `https://SIZIN-STORE.vercel.app` |

4. **Deploy**

---

## 6. CORS-u yenilə

Hər iki Vercel URL-i hazır olandan sonra Render-də `CORS_ORIGINS`-i yeniləyib API-ni **Manual Deploy** et.

---

## 7. Yoxlama siyahısı

- [ ] `https://...onrender.com/api/health` → `{"success":true,...}` və içində `"storage":{"driver":"mongodb","connected":true,...}`
- [ ] Storefront açılır, məhsullar görünür
- [ ] Admin-ə daxil olmaq olur (`umud9832@gmail.com` / `12345678`)
- [ ] Sifariş vermək olur

---

## Tez-tez xətalar

### API başlamır — `[boot] storage init failed`
`MONGODB_URI` səhvdir və ya Atlas bağlantıya icazə vermir:
- Atlas → **Network Access** → `0.0.0.0/0` əlavə olunub?
- Şifrədə xüsusi simvol varsa URL-encode edin (məs. `@` → `%40`)
- Connection string-də `/parfumerya` database adı var?

### Build uğursuz — `VITE_API_URL` / prebuild
Vercel → Project → **Settings → Environment Variables** əlavə edin:
```
VITE_API_URL=https://parfumerya-3.onrender.com/api
```
Sonra **Redeploy** edin.

### Root Directory səhvdir / ENOENT package.json
**Root Directory** mütləq düzgün qovluq olmalıdır — əlavə `frontend/storefront` prefix YOX!

| Layihə | Root Directory |
|--------|----------------|
| Storefront | `frontend/storefront` |
| Admin | `frontend/admin` |

Vercel → Settings → General → **Root Directory** yoxlayın.
Kök `vercel.json` silinib — yalnız alt qovluqdakı `vercel.json` işləyir.

Settings → Build → **Install Command** boş və ya `npm install` olmalıdır (override etməyin).

### Sayt açılır, məlumat yoxdur
`VITE_API_URL` localhost qalıb və ya Render API yuxarı deyil (pulsuz planda 15 dəq idle-dan sonra oyana bilər).

### 404 — səhifə yeniləyəndə
`vercel.json` artıq repo-da var — Root Directory düzgün qovluq olmalıdır.

### CORS xətası
Render-də `CORS_ORIGINS`-ə hər iki Vercel URL-i əlavə edin.

---

## Lokal inkişaf (dəyişməz)

```bash
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:5005

`.env` faylları lokal üçündür — git-ə daxil olmur.

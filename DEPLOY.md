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

## 2. API — Render.com

1. [render.com](https://render.com) → **Sign Up** → GitHub ilə qoşul
2. **New +** → **Blueprint** → bu repo-nu seç
3. `render.yaml` avtomatik `amoria-api` servisini yaradacaq
4. **Environment Variables** (Render dashboard):
   ```
   CORS_ORIGINS=https://SIZIN-STORE.vercel.app,https://SIZIN-ADMIN.vercel.app
   ```
   (URL-ləri Vercel deploy-dan sonra yeniləyin)
5. **Deploy** — bitəndə API ünvanını götürün:
   ```
   https://amoria-api.onrender.com
   ```
6. Yoxlama: brauzerdə açın → `https://amoria-api.onrender.com/api/health`

---

## 3. Müştəri saytı — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. GitHub repo-nu import et
3. **Root Directory:** `frontend/storefront` ⚠️ **Vacib!**
4. Framework: **Vite** (avtomatik tanınmalıdır)
5. **Environment Variables:**

   | Ad | Dəyər |
   |----|-------|
   | `VITE_API_URL` | `https://amoria-api.onrender.com/api` |
   | `VITE_ADMIN_URL` | `https://SIZIN-ADMIN.vercel.app` |

6. **Deploy**

---

## 4. Admin panel — Vercel (2-ci layihə)

1. Vercel-də yenidən **Add New → Project** → eyni repo
2. **Root Directory:** `frontend/admin`
3. **Environment Variables:**

   | Ad | Dəyər |
   |----|-------|
   | `VITE_API_URL` | `https://amoria-api.onrender.com/api` |
   | `VITE_STOREFRONT_URL` | `https://SIZIN-STORE.vercel.app` |

4. **Deploy**

---

## 5. CORS-u yenilə

Hər iki Vercel URL-i hazır olandan sonra Render-də `CORS_ORIGINS`-i yeniləyib API-ni **Manual Deploy** et.

---

## 6. Yoxlama siyahısı

- [ ] `https://...onrender.com/api/health` → `{"success":true,...}`
- [ ] Storefront açılır, məhsullar görünür
- [ ] Admin-ə daxil olmaq olur (`umud9832@gmail.com` / `12345678`)
- [ ] Sifariş vermək olur

---

## Tez-tez xətalar

### Build uğursuz — `VITE_API_URL`
Vercel → Project → **Settings → Environment Variables** — API URL `https://` ilə başlamalıdır.

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

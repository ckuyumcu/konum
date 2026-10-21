# Konum — Sürekli Ürün Pazarlama İşletim Sistemi

İnsan onayı olmadan hiçbir içeriğin dışarı çıkamadığı, ajan destekli ürün pazarlama
platformu. Bu depo, tanıtım sitesi (landing) + uygulama panosunu (Aşama 1) içerir.
**Site dili İngilizce'dir** (Cem'in 2026-10-21 talimatı) ve site **"An AIWork
School company"** ibaresini taşır (footer + uygulama kabuğu).

## Sahiplik kararları (2026-10-21)

- **Dil:** Tüm kullanıcı arayüzü ve site metinleri yalnızca İngilizce.
- **İştirak:** Konum, AIWork School iştiraki olarak gösterilir.
- **E-posta:** `hello@…` adresi alınacak; Gmail üzerinden gönderme/alma yapılacak.
  Uygulamaya e-posta gönder/al entegrasyonu sonraki aşamada eklenecek (şu an
  yalnızca kayıt altına alınmış bir yönergedir; entegrasyon listesinde
  "E-posta (Mailchimp / Klaviyo)" planlandı rozeti bu karardan bağımsızdır).
- **Üslup:** Site dili "insan elinden çıkmış" gibi — kurumsal/AI kokan kalıplar
  yasak; doğrudan, birinci çoğul, kısaltmalı (we'd, here's) kurucu sesi.
- **Görsel standart:** Pazarlama şirketinin sitesi sıradan olamaz: canlı renk
  (sunset rampı: signal orange → coral → violet → amber), animasyonlu grafikler,
  sayaçlar ve akan çizgiler standarttır. `prefers-reduced-motion` her zaman
  desteklenir.
- **Birim ekonomi şeffaflığı:** Landing'de "The math" bölümü: müşteri başına
  maliyet ≈ $3/ay (Haiku 5.5 tarifesi + altyapı payı, varsayımlar açık), pilot
  hedef fiyat $149/workspace/ay → brüt marj ~%98. Nihai fiyat pilot ajanslarla
  ölçülen değere göre belirlenir.
- **Tam otonomi hedefi (Cem'in kendi işletmesi için):** Platform; işletme,
  bakım, sağlık kontrolü, pazarlama, e-posta gönder/al/yanıt dahil her şeyi
  kendi kendine yönetebilmeli — **tek istisna: para harcamak** (bütçe ve ödeme
  kararları her zaman insan onayında kalır). Bu, ürünün "ajan işletir, insan
  onaylar" ilkesiyle çelişmez; harcama dışı onaylar kendi instance'ımızda
  otomatikleştirilebilir. Aşama 2+ mimarisi bu yönde tasarlanır.
- **İsim:** Ürün adı şimdilik **Konum** olarak kalır; uluslararası alan adı ve
  marka tescili araştırması pilot öncesi yapılacak (bkz. sohbet 2026-10-21).

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000 — arayüz + API (/api) tek süreçte
npm run build    # tsc -b && vite build
npm test         # otomatik testler (17 adet)
```

**İlk giriş:** `/giris` → e-posta `cem@konum.local`, davet kodu `KONUM-PILOT-1`
(ilk açılışta tohumlanır). Davetler tek kullanımlıktır; hesabı açılmış kullanıcı
aynı e-posta + kodla tekrar giriş yapabilir (yerel geliştirme eşdeğeri).

## Ne gerçek, ne simülasyon, ne v1.1

**Gerçek (çalışıyor):**
- Davet kodu + e-posta ile giriş, oturum çerezi, davetsiz erişimin reddi
- Workspace oluşturma, üyelik/rol doğrulaması (sunucuda, her prosedürde)
- Kurulum sihirbazı: URL tarama (robots.txt saygısı, SSRF koruması, 10 sn / 2 MB
  sınırı, yönlendirme sonrası yeniden kontrol), tarama anlık kaydı
  (`crawl_snapshots`)
- Strateji Belleği editörü + insan onayı; bellek onaylanmadan diğer modüller
  UI'da kilitli **ve** sunucuda reddedilir (`bellekOnayZorla`)
- Denetçi deterministik katmanı (yasaklı ifade, kaynaksız istatistik)
- Tek durum makinesiyle durum geçişleri (`server/durum.ts`)
- Ajan günlüğü (yalnız workspace üyeleri), KVKK maskeleme (e-posta, telefon,
  TC, IBAN, ad-soyad), günlük LLM çağrı sınırı (varsayılan 50/workspace — [DV],
  Ayarlar'dan değiştirilebilir olacak)
- Landing pilot formu → `pilot_applications` tablosuna gerçek kayıt + rıza kutusu

**Simülasyon (açıkça etiketli):**
- **LLM ajan çıktıları.** Sağlayıcı: Anthropic (`claude-haiku-5-5`, resmî
  `@anthropic-ai/sdk`, JSON çıktı zod şemasıyla zorlanır; `LLM_PROVIDER=anthropic`).
  Anahtar iki yoldan gelir: `.env` içinde `ANTHROPIC_API_KEY` (git'e girmez) veya
  Ayarlar → "LLM bağlantısı" (yalnız platform sahibi; anahtar proje dışı gizli
  dosyaya `~/.konum/secrets.json` 600 izniyle yazılır, bir daha gösterilmez,
  istemciye asla dönmez). Anahtar yoksa deterministik taslak üretilir; çıktı ve
  günlük "simülasyon" etiketli. **EXTERNAL_GATE: LLM API anahtarı (Cem verecek).**

**v1.1 (yapılmadı, "Planlandı" rozetiyle işaretli):**
- Meta/Google Ads, e-posta ve analytics bağlantıları; API ile yayın; otomatik
  metrik çekme; otomatik e-posta gönderimi

**Yalnız sandbox'ta doğrulandı:** Tüm kabul ölçütleri bu makinedeki yerel
ortamda geçti; canlı alan adı, gerçek müşteri kabulü, ödeme veya e-posta teslimi
kanıtı değildir.

## Platform araçları eşdeğerleri (v2 Bölüm 4 [DV])

| Belgedeki araç | Durum | Kullanılan eşdeğer |
|---|---|---|
| backend-building skill | Yok | tRPC + Drizzle + Hono elle kuruldu (`server/`) |
| website-storage | Yok | Proje dışı yerel klasör: `server/data/` (Aşama 2 yüklemeleri) |
| agent-gw SDK | Yok | `server/agents/llm.ts` sağlayıcı arayüzü (`LLM_PROVIDER`) |
| website_version_manager | Yok | git tag (`asama-1`, `asama-2`, …) |
| Kimi OAuth | Yok | E-posta + davet kodu ile yerel oturum |
| MySQL | Yok | SQLite (better-sqlite3); şema taşınabilir yazıldı |

## Yerel ortam notu

Bu makinede disk %99 dolu ve `~/Documents` iCloud'a eşitleniyor; npm dosyalarına
erişim saniyeler sürüyor (yerinden çıkarılma). Bu yüzden çalışan kopya
`/var/tmp/konum-app` altında, kaynak kodun güncel hâli ise workspace'teki
`konum/` klasöründe tutulur. Veritabanı: `server/data/konum.db`.

## İstatistik varsayılanları (Aşama 2'de kullanılacak — [DV])

α = 0,05 (iki oranlı z-testi, p < 0,05), güç = 0,80; minimum örneklem kullanıcının
girdiği temel dönüşüm oranı ve MDE ile güç analizi formülünden hesaplanır.
Kazanan ilanını LLM değil kod verir; eşik sağlanmazsa sonuç "yetersiz veri"dir.

## Mimari

```
server/           Hono + tRPC API (Vite dev sunucusuna /api altında bağlı)
  schema.ts       Drizzle tabloları (18 tablo)
  durum.ts        Tek durum makinesi
  trpc.ts         Oturum, üyelik/rol, bellek kilidi
  agents/         llm.ts, scanner.ts (SSRF), denetci.ts, bellek.ts
  tests/run.ts    npm test
src/pages/        Landing + uygulama ekranları
src/app/          Uygulama kabuğu (sol nav, mobil sheet)
```

Rotalar: `/` landing · `/giris` · `/app` · `/app/yeni` (kurulum sihirbazı) ·
`/app/:id/bellek|kanit|icra|onay|radar|ayarlar` · `/app/konsol`

# Konum — Sürekli Ürün Pazarlama İşletim Sistemi

İnsan onayı olmadan hiçbir içeriğin dışarı çıkamadığı, ajan destekli ürün pazarlama
platformu. Bu depo, tanıtım sitesi (landing) + uygulama panosunu (Aşama 1) içerir.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000 — arayüz + API (/api) tek süreçte
npm run build    # tsc -b && vite build
npm test         # otomatik testler (15 adet)
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

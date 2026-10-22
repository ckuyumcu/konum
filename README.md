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

## Danışma turu 1 (2026-10-22) — alınan kararlar

Tam kıyaslama: `danisma/KIYAS-1.md`. Özet:
- **Kiracı katmanı eklendi:** `organizations` tablosu + `workspaces.org_id`
  (danışman P0; minimal — sahip başına otomatik org, mevcut veri dolduruldu).
- **Kanıt → bellek artık referans:** `kanitlanmisMesajlar` kayıtları
  `{metin, kanitId, zaman}` taşır; tek doğruluk kaynağı `evidence_files`.
- **Aşama 3 spec'ine giren danışman şartları:** içerik sürümleri + hash'e bağlı
  onay (düzenleme onayı bozar), test sonucu provenance enum'u (sentetikle terfi
  yok), olay sözlüğü (onay gecikmesi/düzenleme mesafesi/ret nedeni).
- **Pilot kilidi:** Kanıt Motoru'nun ticari değeri, gerçek performans verisinin
  hangi kanaldan (Meta/Google/CSV) içeri gireceği belirlenene kadar HOLD.

**Tur 2 (Kapı 2 yanıtları) — uygulananlar:** ölçüt pay/payda çifti
(tiklama|donusum × gosterim|tiklama, izinli çiftler kodda); CSV'de tarih kolonu
zorunlu, (test, varyant, tarih) tekil — aynı dosya iki kez yüklenemez; rapor
kimliği kriptografik rastgele; IP kimliği HMAC + günlük tuz + IPv6 /64; küresel
günlük LLM tavanı (300/gün şalter); simülasyon PDF'inde her sayfada filigran;
kanıt kaydında tekrarlanabilirlik bloğu (kod sürümü + α + girdi hash'i + an);
hipotez deneme sayısı (arka-kapı peeking ölçümü); ≥3 günlük veride yön
tutarsızsa "WEAK" etiketi. **Ertelenenler:** grup sıralı test (v2 — tetik:
ilk 20 gerçek testte "fark gösterilemedi" oranı > %50), teşhis hunisi panosu,
gözlem/dönüşüm penceresi, kısmi e-posta kilidi (PDF indirme e-postaya bağlanır
— A4, önce huni ölçümü).

**Tur 4 (Kapı 4 kabul paketi) — uygulananlar:** eskime karşılaştırması artık
son anlık kayda değil **kabul edilmiş esas kayda** yapılır (`esas=1`; alarm
ateşlenince yeni tarama yeni esas olur — kademeli drift alarmı atlatamaz);
alarm yaşam döngüsü (`acik / okundu / ertelendi-7gün / cozuldu`) + aynı
referansa 30 gün içinde ikinci alarm yok (okunmuş olsa bile); haftalık özet
gerçek 7-gün filtresiyle çalışır ve dönem sınırları sinyalde yazar; ulaşım
listesi kişisel e-posta alanlarını sunucuda reddeder (gmail/outlook/yahoo…);
"Sent (manual)" etiketi "Marked as sent (manual)" olarak düzeltildi; tümü
createCaller E2E testleriyle kilit altında (8 yeni test). Durum dürüstlüğü:
bu hâlâ **yerel prototip** — canlı yayın, gerçek pilot ve gelir kanıtı yok.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000 — arayüz + API (/api) tek süreçte
npm run build    # tsc -b && vite build
npm test         # otomatik testler (43 adet — endpoint E2E'leri dahil)
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

**Aşama 2 — gerçek (çalışıyor):**
- Kanıt Motoru (`/app/:id/kanit`): Strateji Asistanı hipotez kartları üretir
  (2–3 kanıtlanabilir iddia; bellek onayı + günlük LLM sınırı sunucuda zorlanır)
- Test Tasarımcısı: seçilen hipotezden A/B planı (varyantlar, ölçüt, temel oran,
  MDE, bütçe notu) + güç analiziyle minimum örneklem (α=0,05, güç=0,80)
- Test akışı tek durum makinesiyle: taslak → onayBekliyor → calisiyor →
  tamamlandi / yetersizVeri; onay yetkisi sunucuda zorlanır
- Sonuç girişi: varyant başına manuel form **ve** CSV (şablon indirilebilir,
  satır doğrulamalı toplu giriş)
- Kazanan kararını LLM değil kod verir (`server/stats.ts`): iki oranlı z-testi
  (p < 0,05); eşik sağlanmazsa sonuç "yetersiz veri". Ölçüt tıklama bazlıysa
  (CTR vb.) pay tıklama, değilse dönüşüm sayılır.
- Kazanan mesaj kanıt dosyasına yazılır **ve** Strateji Belleği'nin
  `kanitlanmisMesajlar` alanına işlenir; Markdown dışa aktarım
- `/teshis` — herkese açık ücretsiz Mesaj Haritası: URL tara → ana iddia,
  güçlü/eksik kanıtlar, 3 öneri, 0–100 kanıt skoru; limitler: IP başına 3/gün,
  global 100/gün (IP yalnızca hash'lenerek saklanır); isteğe bağlı e-posta
  rızaya bağlı; bağımlılıksız PDF raporu (`/api/teshis/:id.pdf`)

**Aşama 3 — gerçek (çalışıyor):**
- İcra Stüdyosu (`/app/:id/icra`): kanıt dosyasından tek tıkla 3 kanal
  varyasyonu (eposta / sosyal / reklam); Denetçi'den geçenler doğrudan onay
  kuyruğuna düşer, geçemeyenler "denetimde" kalır ve gerekçesi gösterilir
- İçerik sürümleri + hash'e bağlı onay: her öğenin `govde_hash`'i
  (sha256: kanal|başlık|gövde) tutulur; onay, onaylandığı metnin hash'ine
  bağlanır — onaylı içerik düzenlenirse onay otomatik bozulur, öğe kuyruğa
  döner ve `duzenleme-onayi-bozdu` olayı yazılır
- Onay Merkezi (`/app/:id/onay`): tekil onay kuyruğu (toplu/kör onay yok),
  klavye ile gezinme (↑/↓ veya j/k, A onay, R ret, V revize), kuyrukta bekleme
  süresi rozeti (onay gecikmesi ölçümü)
- Ret nedeni sözlüğü (ton / yanlış bilgi / marka dışı / hukuki risk / diğer)
  ve zorunlu revize notu — ikisi de karar geçmişine yazılır
- Yayın paketi: yalnızca onay hash'i güncel metinle birebir eşleşen öğeler
  pakete girer; uyumsuzluk varsa paket reddedilir (412). Paketlenen öğe
  terminal duruma geçer (`paketlendi`)
- Karar geçmişi: tüm onay/red/revize/paketleme olayları rol ve hash
  kopyasıyla listelenir

**Aşama 4 — gerçek (çalışıyor):**
- Sinyal Radarı (`/app/:id/radar`): Analist haftalık "ne öğrendik" özeti
  (salt-okur; test sonuçları + kanıt dosyaları + içerik durumlarından),
  simülasyon etiketi anahtar yokken zorunlu
- Eskime alarmı kuralı kodda: kanıt dosyası 30+ gün yenilenmediyse VEYA
  taranmış sayfanın (ürün/rakip) hash'i değişip metin farkı %20'yi aştıysa
  alarm üretilir; okunmamış alarm varken aynı referans için yinelenen alarm
  açılmaz. Metin farkı ölçüsü: normalize kelime kümelerinde simetrik
  fark/birleşim (`server/agents/analist.ts`, birim testli)
- **Otomatik zamanlama YOK** — haftalık özet ve yeniden tarama kullanıcı
  düğmesiyle çalışır ("Generate weekly brief" / "Rescan now"); çalışıyormuş
  gibi gösterilen sahte cron yok
- Rakip sayfası tabanı: Radar'dan URL eklenir, tarama `crawl_snapshots`'a
  `tip: rakip` olarak yazılır
- Ajans Konsolu (`/app/konsol`): bekleyen onay sayıları gerçek
  (`content_items.onayKuyrugu` sayımı, Onay Merkezi'ne bağlantılı), beyaz
  etiket ayarları (marka adı / vurgu rengi / alan adı — sahip rolü, sunucuda
  zorlanır; alan adı eşlemesi v1.1'de devreye girer, kayıt şimdiden gerçek)
- Ulaşım hazırlık listesi (Bölüm 15.2, yalnız platform sahibi): ajans URL'leri
  taranır, mesaj haritası + kişiselleştirilmiş e-posta **taslağı** üretilir;
  hiçbir e-posta otomatik gönderilmez (kopyala-yapıştır); durum takibi
  (taslak / gönderildi-manuel / yanıt geldi / pilot başvurdu) — e-posta
  `pilot_applications` ile eşleşirse durum otomatik "pilot başvurdu" olur

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

## İstatistik varsayılanları (Aşama 2'de kullanılıyor — [DV])

α = 0,05 (iki oranlı z-testi, p < 0,05), güç = 0,80; minimum örneklem kullanıcının
girdiği temel dönüşüm oranı ve MDE ile güç analizi formülünden hesaplanır.
Kazanan ilanını LLM değil kod verir; eşik sağlanmazsa sonuç "yetersiz veri"dir.

## Mimari

```
server/           Hono + tRPC API (Vite dev sunucusuna /api altında bağlı)
  schema.ts       Drizzle tabloları (18 tablo)
  durum.ts        Tek durum makinesi
  trpc.ts         Oturum, üyelik/rol, bellek kilidi
  agents/         llm.ts, scanner.ts (SSRF), denetci.ts, bellek.ts, kanit.ts, teshis.ts
  stats.ts        z-testi + güç analizi + kazanan kararı
  pdf.ts          bağımlılıksız minimal PDF üreteci
  tests/run.ts    npm test
src/pages/        Landing + uygulama ekranları
src/app/          Uygulama kabuğu (sol nav, mobil sheet)
```

Rotalar: `/` landing · `/teshis` (ücretsiz Mesaj Haritası) · `/giris` · `/app` ·
`/app/yeni` (kurulum sihirbazı) · `/app/:id/bellek|kanit|icra|onay|radar|ayarlar` ·
`/app/konsol` · API: `/api/trpc/*`, `/api/teshis/:id.pdf`

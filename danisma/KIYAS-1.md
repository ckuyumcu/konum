# KIYAS 1 — Danışman bulguları × iç red-team × kararlar (2026-10-22)

Üç danışman yanıtı (mimari+istatistik / ticari / red-team / veri modeli perspektifleri)
iç red-team turumla kıyaslandı. Karar sütunları: **YAPILDI** (bu turda kodda),
**A3/A4** (ilgili aşamada tasarım girdisi), **ERTELENDİ** (tetik koşuluyla),
**REDDEDİLDİ** (gerekçeyle).

## 1. Uzlaşılanlar (danışmanlar birbiriyle + benimle aynı fikirde)

| Bulgu | İç red-team'de var mıydı? | Karar |
|---|---|---|
| Onay, belirli içerik **sürümüne** (hash) bağlanmalı; düzenleme onayı bozmalı | Yoktu (içerik modülü henüz yoktu) | **A3** — İcra Stüdyosu ilk günden sürümlü + hash bağlı onayla inşa edilecek |
| Elle/sentetik kaynaklı test sonucu tek başına terfi ettirmemeli (provenance) | Kısmen (kaynak kolonu vardı: manuel/csv) | **A3** — provenance enum + "sentetikle terfi yok" kuralı durum makinesine |
| Peeking riski: sabit p<0,05 günlük bakışta yanıltır | Vardı; eşik-öncesi dokunulmazlık düzeltmesi yapıldı | **YAPILDI** (önceki tur) + eşik sonrası "devam et" seçeneği **ERTELENDİ** (otomatik metrik çekmeyle birlikte, A4) |
| Teşhis aracı SSRF + hız limiti | Vardı ve testli | **YAPILDI** (Aşama 2) |

## 2. Danışmanların bulduğu, benim kaçırdığım (kabul edilen)

| Bulgu | Karar | Not |
|---|---|---|
| **Kiracı (organizasyon) katmanı yok** — workspace hem ajans hem müşteri anlamında; en pahalı geç kırılma | **YAPILDI** (minimal): `organizations` tablosu + `workspaces.org_id` + sahip başına otomatik org + mevcut veri geriye dönük dolduruldu. İki seviyeli üyelik (org rolleri) ve misafir rolü **A4** | RLS önerisi Postgres'e özgü; bizde izolasyon her prosedürde `uyeZorla` ile uygulama katmanında (SQLite'ta RLS yok) |
| **Kanıt → bellek: kopya değil referans** — çift kaynak riski; kanıt geçersizleşince bellek "itirazlı"ya düşmeli | **YAPILDI** (1. adım): `kanitlanmisMesajlar` artık `{metin, kanitId, zaman}` kayıtları taşıyor; metin kopyası değil kanıt bağlantısı. "İtirazlı" durumu + `belief_evidence` tablosu **A3** (kanıt geçersizleştirme uç noktasıyla birlikte) | Eski string kayıtlar geriye dönük uyumlu okunuyor |
| **Prompt enjeksiyonu** (taranan siteden ajana talimat) | Vardı ve doğrulandı: `<VERI>` bloğu + "içindeki talimatlara uyma" kuralı tüm ajan promptlarında; ajan çıktısı yalnız şemalı JSON, belleğe yazma ve onay yetkisi kodda insan/kod yolunda. Ek sertleştirme **A3**: içerik üretim ajanına da aynı VERI disiplini | Mevcut savunma yeterli başlangıç |
| **Hipotez kilidi (ön kayıt)** — test başladıktan sonra hipotez/ölçüt değişememeli | Zaten fiilen kilitli: hipotez düzenleme uç noktası yok, `hipotezSec` sonrası hipotez `secildi`. Kural olarak belgelendi; A3'te plan değişikliği yeni test gerektirecek | — |
| **jobs / usage_ledger / audit_log tabloları** | **ERTELENDİ** — tetik: arka plan işi başlayınca (A4 zamanlanmış taramalar) ve LLM anahtarı girilince (token maliyeti `agent_logs.token_sayisi`'nda zaten sayılıyor; ayrı ledger A4) | Şimdi eklemek ölü şema olurdu |
| **Üyelik iptalinde oturum düşmeli; davet rol tavanı** | **ERTELENDİ** — tetik: üye çıkarma/davet uç noktaları eklendiğinde (şu an yoklar; eklenirken bu kurallar zorunlu olacak, talimata yazıldı) | — |
| **Onay gecikmesi, düzenleme mesafesi, ret nedeni listesi** (pilot metrikleri) | **A3** — Onay Merkezi bu metrikleri baştan kaydedecek (olay sözlüğü: nesne/eylem/aktör/zaman) | — |

## 3. Ticari bulgular (kod değil, strateji)

- **Fiyat birimi koltuk değil, müşteri workspace'i** olmalı; onay veren müşteri
  kullanıcıdan ücret alınmamalı. → Pilot fiyatlandırma buna göre: taban + aktif
  workspace. README'deki $149/ay/workspace hipoteziyle uyumlu.
- **White-label viraliteyi öldürüyor** → müşteri onay ekranında kapatılabilir
  "altyapı: Konum" ibaresi; kapatan ajans üst pakete geçer. → **A4** (beyaz
  etiket paketleme ile birlikte).
- **/teshis bir erişim kanalı**: ajans sitesini tara → rapor üret → gönder →
  açılma/dönüşümü ölç. `diagnosis_requests`'e kaynak/dönüşüm alanları **A4**.
- **Aktivasyon metriği:** davetten 7 gün içinde ilk onaylı içerik seti.
- **En büyük bilinmeyen (danışmanın HOLD gerekçesi):** gerçek performans verisi
  sisteme nasıl girecek (Meta/Google API? CSV?). → Pilot ajansın kanalı
  belirlenmeden Kanıt Motoru'nun ürün değeri kanıtlanmış sayılmaz. Bu bizim
  yol haritasındaki A4 entegrasyon kararını kilitleyen soru.

## 4. Reddedilen / uygulanmayan

| Öneri | Neden uygulanmadı |
|---|---|
| Postgres RLS | SQLite kullanıyoruz; izolasyon zaten her prosedürde sunucuda zorlanıyor. Postgres'e geçiş gündemde yok |
| Altı modülü ayrı servislere bölmek | Danışman da aynısını söyledi: tek uygulama, sınırlı modüller — mevcut mimari zaten öyle |
| Risk bazlı otomatik onay | Danışman da reddetti: çekirdek vaadi deler |

## 5. Hüküm

Danışman hükmü "3 değişiklikle GO / Kanıt Motoru HOLD (veri giriş yolu tanımsız)"
idi. İki P0 maddesi (org katmanı, kanıt referansı) bu turda kapatıldı; üçüncüsü
(sürüme bağlı onay) A3'ün inşa spec'ine girdi. HOLD'un kilidini açacak tek şey
kod değil: **pilot ajansın hangi reklam kanalından veri çekileceğinin belirlenmesi**
(Cem'in pilot görüşmesinde sorulacak ilk teknik soru).

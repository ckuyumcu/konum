# KAPI 5 — Danışma paketi: Aşama 5 (Yayın Planı) + LLM anahtar hattı + uydurma koruması

**Tarih:** 2026-10-22 · **Sürüm:** asama-5 (commit f8599e7) · **Test:** 55/55 geçiyor

Bu paket önceki Kapı 1–4 turlarının üzerine gelen üç değişikliği dış denetime açar.
Lütfen yanıtını şu formatta ver: her bulgu için [P0 = güvenlik/para/veri kaybı,
P1 = yanlış davranış, P2 = iyileştirme], ilgili kod satırı ve düzeltme önerisi.
Genel övgü istemiyoruz; hata avı istiyoruz.

## Bağlam (60 saniye)

Konum: ajanslar için sürekli pazarlama işletim sistemi. Tek repo, Hono + tRPC +
SQLite (Drizzle), React istemci. Değişmez kurallar:

1. Hiçbir içerik insan onayı olmadan yayına çıkmaz; onay, içerik gövdesinin
   hash'ine bağlanır (düzenleme onayı bozar).
2. Durum geçişleri tek makineden geçer (`server/durum.ts` → `gecisZorla`).
3. Simülasyon asla "gerçek" diye etiketlenmez; kazanan kararını kod verir.
4. Platform hiçbir reklam hesabında işlem yapmaz (otomatik yayın v1.1).
5. Workspace izolasyonu her prosedürde `uyeZorla`/`onayYetkisiZorla` ile zorlanır.

## Bu turun üç değişikliği

### A) Yayın Planı (yeni modül — `/app/:id/yayin`)

v1-yasal kanal yayın akışı: onaylı/paketlenmiş içerik → tarihli plan → sunucuda
üretilen dışa aktarım metni → kullanıcı kendi hesabında yayınlar → "yayınlandı
(manuel)" işareti. Otomatik yayın YOK.

- Yeni tablo `publish_plan_items`: id, workspace_id, content_item_id, kanal,
  planlanan_tarih (yyyy-mm-dd), durum, not, olusturan, created_at, updated_at.
- Durum makinesi: `planlandi → disaAktarildi → yayinlandiManuel`; iptal her
  aşamadan; `iptal → planlandi` serbest; `yayinlandiManuel` terminal.
- `planla`: yalnız sahip/onaylayıcı; içerik `onayli|paketlendi` olmalı; geçmiş
  tarih reddedilir; aynı içerik için ikinci AKTİF plan CONFLICT; **kanal istemci
  girişinden alınmaz, içerik kaydından okunur**.
- `disariAktar`: metin sunucuda üretilir; üretim gerçekleşince plan
  `planlandi → disaAktarildi` geçer (kullanıcı beyanına değil fiili olaya bağlı).
- Her adım `approval_events`'e yazılır (yayin-planlandi / yayin-disaAktarildi /
  yayin-yayinlandiManuel / yayin-iptal).

Sorular:
A1. İptal → yeniden planlama serbestisi denetim izini zayıflatır mı?
A2. "disaAktarildi"nin metin üretimine bağlanması yeterli mi; kullanıcı metni
    kopyalayıp yayınlamadıysa "yayinlandiManuel" işaretinin değeri nedir —
    ek kanıt (ekran görüntüsü yükleme, link yapıştırma) gerekir mi, yoksa
    v1 için beyan yeterli mi?
A3. Planlanan tarih sunucu yerel günüyle kıyaslanıyor (`yyyy-mm-dd` string
    karşılaştırması). Kullanıcı başka saat dilimindeyse "geçmiş tarih" reddi
    yanlış tetiklenebilir mi; pratik risk ne?

### B) LLM anahtar hattı (Anthropic, claude-haiku-5-5, resmî SDK, zod şema)

- Anahtar iki kaynaktan: `.env` (`ANTHROPIC_API_KEY`) veya Ayarlar'dan girilip
  proje DIŞI gizli dosyaya yazılır (`~/.konum/secrets.json`, 600). **Öncelik
  env > dosya.** Anahtar istemciye asla dönmez; durum uç noktası yalnız
  kaynağın adını döner (env|dosya|yok).
- `llmAnahtariKaydet`: yaz → **1 token'lık canlı doğrulama çağrısı** →
  401/403 ise anahtarı SİL ve BAD_REQUEST; ağ/başka hata ise tut ve
  "dogrulanamadi" dön. Gerekçe: yanlış anahtar sistemi sessizce sonsuz
  simülasyonda bırakırdı (çağrılar 2 denemeden sonra simülasyona düşüyor ve
  dürüstçe öyle etiketleniyor — ama kullanıcı "gerçek" sanırdı).
- Maliyet freni: workspace başına 50/gün, küresel 300/gün LLM çağrısı
  (`agent_logs` mod='llm' sayımıyla).
- `generateJson`: LLM başarısızsa simülasyona düşer, mod='simulasyon'
  etiketiyle. Asla gerçek gibi göstermez.

Sorular:
B1. **env > dosya önceliği çelişkisi:** `.env`'de eski/bozuk anahtar varken
    Ayarlar'dan yeni anahtar girilirse, doğrulama YENİ anahtarı test eder ama
    çalışma zamanı ESKİ env anahtarını kullanır — sistem yine simülasyonda
    kalır ve kimse fark etmez. Bu senaryo gerçekçi mi; nasıl kapanmalı?
B2. Doğrulama çağrısının kendisi de günlük limite sayılmalı mı?
B3. `timeout: 15000, maxRetries: 0` doğrulama için yeterli mi; kurumsal
    proxy/SSL durumunda yanlış "gecersiz" riski var mı (401 dışı ağ hatası
    "bilinmiyor" dediğimiz için risk sınırlı görünüyor — katılıyor musun)?
B4. Gizli dosya düz metin JSON (600 izinli). Bu tekil makine (kurucunun
    bilgisayarı) için yeterli mi; anahtarın bellekte/dosyada kalıcılığına
    dair gözden kaçan bir yüzey var mı?

### C) Uydurma koruması (bellek taslağı)

Saha testinde yakalandı: `bellek.taslakUret` boş tarama metniyle çağrılabiliyordu
ve LLM siteyi hiç okumadan isimden makul GÖRÜNEN taslak üretti. Düzeltme:
`taramaMetni` zod şemasında min 200 karakter; altındaysa BAD_REQUEST.
Testi var (boş ve kısa metin reddediliyor).

Sorular:
C1. 200 karakter eşiği yeterli mi; metin gerçek ama ALAKASIZ ise (ör. park
    sayfası, domain satılık sayfası) taslak yine uydurma olur — tarama metniyle
    müşteri adı/sektör arasında tutarlılık kontrolü gerekir mi, nasıl?
C2. Aynı risk başka uç noktalarda var mı: hangi ajan çağrıları dış veriyi
    (tarama, müşteri metni) varsayarak içerik üretiyor ve boş girdiyle
    çağrılabilir?

## Canlı kanıt (bu turda gerçekten çalışanlar)

- Gerçek API anahtarıyla doğrulama: sahte anahtar Anthropic'ten 401 aldı,
  saklanmadı; gerçek anahtar doğrulandı, rozet "Live calls active".
- 4 gerçek site (aiworkschool.com, plancatch.com, hestiadata.net,
  askthousand.com) tarandı, bellek taslakları ve hipotezler gerçek LLM ile
  üretildi; Denetçi hepsini geçti; ajan günlüğünde mod=llm + token sayıları.
- A/B test planı gerçek LLM ile kuruldu ve insan onayıyla "calisiyor" durumunda.

## Bilinen ve BİLİNÇLİ ertelenenler (bunları bulgu olarak yazma)

- Otomatik yayın ve otomatik metrik çekme (v1.1 — API entegrasyonları).
- Grup sıralı test (O'Brien-Fleming) — tetik: ilk 20 testte "fark yok" > %50.
- jobs/usage_ledger/audit_log tabloları — tetik: arka plan işleri.
- Gösterim biriminin bağımsızlığı (şimdilik WEAK etiketiyle işaretleniyor).

## Beklenen çıktı

En değerli yanıt: bizim görmediğimiz bir P0/P1. Her bulgu için tek cümlelik
"neden önemli" + tek cümlelik "minimal düzeltme" yeterli.

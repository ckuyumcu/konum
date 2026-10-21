# KONUM — Platform İnşaat Talimatı (Kimi Work İçin Ana Belge)

> **Bu belge ne işe yarar:** Bu talimatı bir yapay zekâ ajanına (Kimi Work vb.) olduğu gibi ver.
> Ajan, bu belgeyi okuyarak "Konum" platformunun çalışan ilk sürümünü (MVP) inşa edecek.
> Belgedeki her adım sıralıdır; atlamadan ilerle. Belirsizlikte durma kuralları Bölüm 12'dedir.

---

## 0. Kimlik ve bağlam

**Proje adı:** Konum
**Tek cümlelik tanım:** Deneyimli pazarlamacıların ve ajansların stratejisini, yapay zekâ ajanlarının 7/24 icrasıyla birleştiren; "insanlar neden bizi seçsin?" sorusunun cevabını testle kanıtlayıp tüm kanallara yayan, insan-onaylı sürekli ürün pazarlama işletim sistemi.

**Mevcut durum:** Ürünün tanıtım sitesi (landing page) zaten inşa edildi ve `/mnt/agents/output/app` altında çalışıyor. Tasarım dili, renkler, tipografi ve terminoloji o siteden alınacak — bu talimattaki tasarım kuralları (Bölüm 9) o siteyle birebir aynıdır. Yeni iş, bu projenin **üzerine** gerçek ürünü (uygulama panosu) inşa etmektir; landing page korunacak, uygulama ona eklenecektir.

**Temel ürün ilkesi (pazarlık konusu değildir):** Hiçbir içerik, reklam, e-posta veya yayın, insan onayı olmadan dışarı çıkamaz. Ajanlar üretir, insan karar verir. Bu ilke hem kalite hem sorumluluk sınırıdır ve tüm mimariyi şekillendirir.

---

## 1. Hedef kullanıcı ve kapsam

**Birincil kullanıcı:** 5–50 müşterili butik pazarlama/growth ajansları ve kıdemli bağımsız pazarlama danışmanları. Platformu kendi markalarıyla (beyaz etiket) müşterilerine açarlar.

**İkincil kullanıcı:** SaaS ve e-ticaret şirketlerinin içindeki ürün pazarlaması / growth ekipleri.

**Bu sürümde OLMAYACAKLAR (v1 dışı kapsam):**
- Doğrudan KOBİ self-servis kayıt akışı (v1'de hesaplar davetle açılır)
- Otonom bütçe yönetimi (ajan bütçe değiştiremez; yalnızca önerir, insan onaylar)
- Başarı ücreti / reklam harcamasından komisyon modeli
- Gerçek reklam platformu yayınlama (v1'de "hazır paket" üretilir; canlı API yayını v1.1 hedefidir — aşağıda işaretlidir)

---

## 2. Modül haritası (inşa edilecek ekranlar)

Platform 6 modülden oluşur. Her modül bir rota (route) ve bir veri alanıdır:

| # | Modül | Rota | Sahip |
|---|-------|------|-------|
| 1 | Strateji Belleği | `/app/:workspaceId/bellek` | İnsan kurar |
| 2 | Kanıt Motoru | `/app/:workspaceId/kanit` | Ajan çalışır, insan seçer |
| 3 | İcra Stüdyosu | `/app/:workspaceId/icra` | Ajan üretir, insan onaylar |
| 4 | Onay Merkezi | `/app/:workspaceId/onay` | Tek yayın kapısı |
| 5 | Sinyal Radarı | `/app/:workspaceId/radar` | Ajan izler, insan karar verir |
| 6 | Ajans Konsolu | `/app/konsol` | Çok-müşterili görünüm + beyaz etiket ayarları |

Ek rotalar: `/giris` (Kimi ile giriş), `/app` (workspace listesi / yönlendirme), `/app/:workspaceId/ayarlar` (entegrasyonlar, ekip, marka ayarları).

**Kullanıcı yolculuğu (mutlaka bu sırayla çalışmalı):**
1. Ajans sahibi giriş yapar → ilk **workspace** (müşteri çalışma alanı) açar: müşteri adı, sektör, ürün URL'si.
2. Kurulum sihirbazı: ürün URL'si verilir → sistem siteyi tarar ve Strateji Belleği taslağı üretir → **insan düzenler ve onaylar** (bellek onaylanmadan diğer modüller kilitli kalır — kilitli modüllerde açıklama ve yönlendirme göster).
3. Kanıt Motoru: bellekten ve taramadan 2–3 mesaj hipotezi önerir → insan birini seçer → Test Tasarımcısı test planı üretir → insan onaylar → test "çalışıyor" durumuna geçer.
4. Test sonucu gelince kazanan varyant **kanıt dosyasına** işlenir → İcra Stüdyosu bu kanıttan kanal varyasyonları (Instagram metni, Meta Ads birincil metin, Google Ads başlıkları, e-posta konusu + gövde) üretir → hepsi Onay Merkezi kuyruğuna düşer.
5. İnsan, Onay Merkezi'nden her öğeye **Onayla / Revize iste / Reddet** der. Onaylanan öğe "Yayın paketi"ne geçer (v1: indirilebilir/kopyalanabilir paket; v1.1: API ile yayın).
6. Sinyal Radarı: haftalık "ne öğrendik" özeti ve konumlandırma eskime alarmları üretir.

---

## 3. AI ajan mimarisi

Her ajan tek sorumluluk taşır, yapılandırılmış çıktı (JSON) üretir ve tüm çıktıları Strateji Belleği'ne karşı **Denetçi** süzgecinden geçer.

| Ajan | Görev | Girdi | Çıktı | İnsan onayı |
|------|-------|-------|-------|-------------|
| **Araştırmacı** | Rakip ve kategori mesajlarını tara; müşteri dilinden (yorum, SSS, destek metni) ifade/itiraz çıkar | Ürün URL'si, rakip listesi, yüklenen metinler | Mesaj haritası + dil madenciliği özeti | İlk kurulumda kaynak onayı |
| **Stratejist Yardımcısı** | Konumlandırma hipotezleri üret | Bellek + Araştırmacı özeti | 2–3 hipotez (JSON: iddia, hedef kitle, kanıt önerisi) | Hipotez seçimi yalnızca insan |
| **Test Tasarımcısı** | Küçük bütçeli A/B test planı kur | Seçili hipotez | Test planı: varyantlar, ölçüt, minimum örneklem, süre | Test başlatma onayı |
| **İçerik Üretici** | Kanıtlanmış mesajdan kanal varyasyonları yaz | Kanıt dosyası + kanal şablonları | Kanal başına varyasyon seti | Her yayın öğesi |
| **Yayıncı** | Onaylanan öğeleri yayın paketine dönüştür (v1: dosya/pano kopyası; v1.1: API yayını) | Onaylı öğeler | Yayın paketi | Paket dışa aktarımı |
| **Analist** | Performansı oku, haftalık öğrenim özeti ve eskime alarmı üret | Test ve yayın metrikleri | Haftalık rapor + alarmlar | Yok (salt-okur); alarm eylemi onaylı |
| **Denetçi** | Tüm ajan çıktısını Strateji Belleği + marka kuralları + yasaklı ifadelerle karşılaştır | Her ajan çıktısı | Geçti / reddedildi (gerekçeyle) | Kural setini insan tanımlar |

**Zorunlu mimari kurallar:**
1. Ajan çıktıları ham serbest metin değil, şemalı JSON olsun (alanlar: `baslik`, `govde`, `kanal`, `kanitReferansi`, `guvenNotu`).
2. Her ajan çağrısı loglansın (zaman, girdi özeti, çıktı, denetçi kararı) → Ayarlar'da "Ajan günlüğü" ekranı.
3. Denetçi reddederse öğe Onay Merkezi'ne **hiç düşmez**; kullanıcıya "Denetçi engelledi + gerekçe" olarak görünür.
4. LLM çağrıları sunucu tarafında yapılır; API anahtarı istemciye asla gelmez.
5. "Yetersiz veri" meşru bir test sonucudur; Test Tasarımcısı minimum örneklem sağlanmadan kazanan ilan edemez.

---

## 4. Teknik altyapı (bağlayıcı)

- **Mevcut proje:** `/mnt/agents/output/app` — React + TypeScript + Vite + Tailwind + shadcn/ui. Landing page'e DOKUNMA; ürünü aynı projeye ekle.
- **Backend:** backend-building skill'i ile graft et: tRPC + Drizzle ORM + Hono. Giriş: Kimi OAuth (auth özelliği). Veritabanı: platformun varsayılanı (MySQL).
- **Dosyalar:** Kullanıcı yüklemeleri (müşteri metinleri, marka dosyaları) ve üretilen yayın paketleri için website-storage skill'i (object storage); repo'ya veya localStorage'a dosya koyma.
- **Yönlendirme:** BrowserRouter zaten `src/main.tsx` içinde var — tekrar ekleme. Tüm uygulama rotaları kökten erişilebilir olsun (statik önizlemede doğrudan alt rota açılmaz; uygulama içi navigasyon kullan).
- **Paketler:** Kullanmadan önce `npm install` + `import`; eksik import boş ekran demektir. `package.json` build script'ini değiştirme.
- **LLM:** Ajan çağrıları için agent-gw SDK (sunucu tarafı). Yanıtlar yapılandırılmış JSON olarak zorlansın; başarısız ayrıştırmada yeniden deneme (maks. 2) + kullanıcıya anlaşılır hata.

**Veri modeli (Drizzle tabloları — minimum):**
- `users` (Kimi auth'tan), `workspaces` (id, ownerId, müşteri adı, sektör, ürün URL'si, beyaz-etiket ayarları: logo, renk, alan adı notu)
- `strategy_beliefs` (workspaceId, hikâye, konumlandırma, hedef kitle, yasaklı ifadeler[], kanıtlanmış mesajlar[], onayDurumu, güncelleyen, güncellemeZamanı)
- `hypotheses` (workspaceId, iddia, kitle, kanitOnerisi, durum: öneri/seçildi/reddedildi)
- `tests` (hypothesisId, varyantlar[], ölçüt, minimumÖrneklem, başlangıç, durum: taslak/onayBekliyor/çalışıyor/tamamlandı/yetersizVeri, sonuç, kazananVaryantId)
- `evidence_files` (workspaceId, testId, kazananMesaj, öğrenim, dışaAktarımFormatı)
- `content_items` (workspaceId, evidenceId, kanal, başlık, gövde, durum: denetimde/onayKuyruğunda/revize/onaylı/reddedildi/paketlendi, denetçiNotu, sürüm)
- `publish_packages` (workspaceId, öğeler[], oluşturmaZamanı, dışaAktarımAnahtarı)
- `agent_logs` (workspaceId, ajan, girdiÖzeti, çıktıÖzeti, denetçiKararı, zaman)
- `signals` (workspaceId, tip: haftalıkÖzet/eskimeAlarmı, içerik, okundu)

---

## 5. Entegrasyonlar (v1 kapsamı ve sınırları)

**v1'de gerçekten çalışacak:**
- Web sitesi tarama (ürün URL'sinden metin çıkarımı; robots.txt'ye saygı)
- Dosya yükleme (müşteri yorumları/SSS/destek metinleri, .txt/.csv)
- Dışa aktarım: yayın paketi (Markdown + kanal bazlı .txt) ve kanıt dosyası (PDF/Markdown) indirme

**v1.1 hedefi (şimdi sadece arayüzde "yakında" olarak işaretle, sahte buton KOYMA):**
- Meta Ads / Instagram, Google Ads, e-posta (Mailchimp/Klaviyo), analytics bağlantıları
- Kural: API'si bağlanmamış hiçbir entegrasyon için "bağlandı" gösterme. Ayarlar > Entegrasyonlar'da her biri "Planlandı — pilot aşamasında" rozeti taşır.

---

## 6. Güvenlik, hukuk ve veri kuralları (uygulanacak)

1. **KVKK/GDPR:** Yüklenen müşteri metinleri LLM'e gönderilmeden önce kişisel veriler anonimleştirilir (ad, e-posta, telefon maskeleme). Ayarlar'da "Veri işleme" bilgilendirme metni göster.
2. **Yetki:** Her workspace yalnızca sahibine (ve davetli ekip üyelerine) görünür; sunucu tarafında her tRPC prosedüründe workspace sahipliği doğrulanır.
3. **Sorumluluk sınırı:** Onay Merkezi'nde her onay işlemi loglanır (kim, ne, ne zaman).
4. **Ajan günlüğü** herkesçe görülebilir (şeffaflık satış argümanıdır).
5. Landing page ve uygulamada uydurma istatistik/pazar büyüklüğü YAZMAZ; demo veriler "simülasyon" olarak etiketlenir (mevcut sitedeki kural aynen korunur).

---

## 7. Onay Merkezi — en kritik ekran (detay)

- Sol: kuyruk listesi (kanal rozeti, denetçi durumu, üretim zamanı). Sağ: seçili öğenin tam önizlemesi + kanıt referansı + Denetçi notu.
- Üç eylem: **Onayla** / **Revize iste** (metin alanı: talimat ajanlara geri gider, yeni sürüm kuyruğa düşer) / **Reddet** (gerekçe zorunlu).
- Klavye: `j/k` öğe gezinme, `a` onayla, `r` revize, `x` reddet. Tümü focus-visible ile erişilebilir.
- Toplu onay YOK (her öğe tekil karar ister — bu ürünün vaadidir).
- Boş durum: "Kuyruk temiz. Ajanlar yeni varyasyon ürettiğinde burada görünecek." + İcra Stüdyosu'na bağlantı.

---

## 8. MVP aşamaları (sırayla, her biri ayrı versiyon)

**Aşama 1 — İskelet + Bellek (önce bu çalışsın):** Kimi girişi, workspace oluşturma, kurulum sihirbazı (URL tara → bellek taslağı → insan onayı), Strateji Belleği editörü. Kabul ölçütü: bellek onaylanmadan diğer modüller kilitli görünür.
**Aşama 2 — Kanıt Motoru:** Araştırmacı + Stratejist Yrd. (gerçek LLM çağrıları), hipotez kartları, Test Tasarımcısı + test onay akışı, "yetersiz veri" durumu.
**Aşama 3 — İcra + Onay:** İçerik Üretici (4 kanal şablonu), Denetçi süzgeci, Onay Merkezi (Bölüm 7'deki tüm davranışlar), yayın paketi dışa aktarımı.
**Aşama 4 — Radar + Konsol:** Analist haftalık özet, eskime alarmı (kural: kanıt dosyasındaki mesaj 30+ gün yenilenmediyse veya rakip mesaj haritası belirgin değiştiyse alarm), Ajans Konsolu (workspace listesi + beyaz etiket ayarları), Ajan günlüğü ekranı.

Her aşama sonunda: `npm run build` temiz geçmeli, gerçek tarayıcıda (Chromium) ekran görüntüsüyle doğrulanmalı, `website_version_manager` ile versiyon kaydedilmeli (type: "dynamic", project_dir: /mnt/agents/output/app).

---

## 9. Tasarım sistemi (landing ile birebir — değiştirme)

- **Renkler:** Kâğıt `#fcfcf9`, kâğıt-2 `#efefe4`, mürekkep `#181818`, sinyal `#ff3500` (grafik/vurgu), metin vurgusu `#c52a00` (kontrast için), odak halkası koyu mavi. Turuncu üzerine küçük beyaz metin YASAK (kontrast); büyük başlık kullan.
- **Tipografi:** Başlıklar Fraunces (font-display, opsz 144), gövde/UI Archivo. Eyebrow: uppercase, 0.18em tracking, kalın. Türkçe'de italik yok.
- **Doku/malzeme:** ince noise overlay (multiply, %5), 120px ızgara deseni kahraman alanlarda, kartlarda çift katmanlı yumuşak gölge.
- **Hareket:** framer-motion; girişler translateY+opacity (≤600ms, easeOut [0.16,1,0.3,1]); hover/press ≤300ms; buton active `scale(0.97)`; `prefers-reduced-motion`'da tüm dekoratif animasyon kapalı.
- **Yasaklar:** emoji ikon yok (inline SVG), mor-mavi gradyan yok, gradyan metin yok, iç içe kart yok, varsayılan şablon görünümü yok, `href="#"` yok.
- **Erişilebilirlik:** gövde metni ≥16px, kontrast ≥4.5:1 (büyük metin ≥3:1), tüm etkileşimler klavyeyle çalışır, dokunma hedefleri ≥44px, 375px'te yatay kayma yok.
- **Uygulama kabuğu:** Sol dikey navigasyon (6 modül + Ayarlar), üstte workspace seçici; koyu yan çubuk (`#181818`) + kâğıt içerik alanı. Landing'in editoryal tonunu koru ama uygulama yoğunluğu öncelikli: tablolar sıkı, başlıklar küçülür.

---

## 10. İçerik dili ve ton

Tüm arayüz Türkçe. Ton: kıdemli pazarlamacıya konuşan, laubali olmayan, iddiasını kanıta bağlayan bir dil. Boş övgü ("güçlü", "devrim niteliğinde") YASAK. Her iddianın yanında ya kanıt ya "doğrulanacak" notu olur. Boş durumlar ve hata mesajları da bu tonda yazılır.

---

## 11. Kabul ölçütleri (Definition of Done)

1. Bölüm 2'deki kullanıcı yolculuğu uçtan uca gerçek veriyle çalışıyor (mock değil; LLM ve veritabanı gerçek).
2. Onaysız hiçbir öğe "paketlendi" durumuna geçemiyor (kodda zorlanıyor, UI'da değil sadece).
3. Denetçi kural ihlalinde öğe kuyruğa düşmüyor.
4. Mobil 375px ve masaüstü 1440px'te görsel kontrol yapıldı; konsol hatası yok, 404 yok.
5. Tüm formlar doğrulama + geri bildirim gösteriyor; tüm boş/hata durumları tasarlanmış.
6. README güncel: ne çalışıyor, ne simülasyon, ne v1.1'de.
7. Her aşama ayrı versiyon olarak kaydedildi.
8. Bölüm 12'deki 4 danışma kapısı işlendi: her kapıda ya dış AI yanıtları ya da "kullanıcı danışmayı atladı" kaydı `ADVISORS.md`'de belgelendi.

---

## 12. Dış Yapay Zekâ Danışma Kurulu Protokolü (zorunlu)

**Amaç:** Kritik kararlar tek bir modelin görüşüyle kapanmasın; Claude, ChatGPT, Grok, Gemini gibi dış modeller acımasız eleştirmen olarak kullanılsın.

**Önemli gerçek (bunu bilerek hareket et):** Dış AI'lara erişimin üç yolu var; hangisinin mümkün olduğunu çalışma başında doğrula ve kullandığın modu `ADVISORS.md`'ye yaz. "Diğer AI'ya sordum" iddiası, kanıtı (ham yanıt metni) olmadan uydurma kabul edilir ve yasaktır. Öncelik sırası: Mod C → Mod A → Mod B.

### Mod C — Tarayıcı üzerinden danışma (bilgisayar/tarayıcı kontrolün varsa)
Kullanıcının bilgisayarındaki tarayıcıyı kontrol edebiliyorsan ve kullanıcı o oturumda Claude/ChatGPT/Grok/Gemini'ye zaten giriş yapmışsa:
1. Danışma Paketi'ni ilgili sitenin sekmesine yapıştır, yanıtı oku, ham metni `ADVISORS.md`'ye kaydet (hangi model, hangi soru, tarih).
2. Kurallar: giriş duvarı, CAPTCHA veya şifre ekranı çıkarsa **kendi başına çözmeye kalkma** — dur, kullanıcıdan oturum açmasını iste; kullanıcının hesap bilgilerini asla sen girme. Yalnızca Bölüm 12'deki 4 kapıda sor; sürekli sekme gezintisi ve otomatik sorgu yağmuru yapma (web arayüzleri otomasyonu kısıtlar, kullanıcının hesabı riske girer). Site erişimi reddederse veya oturum yoksa Mod B'ye düş.
3. Her model için perspektif ataması aynı: Claude → teknik mimari, ChatGPT → ticari model, Grok → red-team, Gemini → veri ve ölçüm. Hangi sekmeler açık/ulaşılabilir durumdaysa onlarla çalış; ulaşılamayan modeli "erişilemedi" diye kaydet, uydurma yanıt üretme.

### Mod A — API üzerinden danışma (kullanıcı API anahtarı sağladıysa)
- Kullanıcı en az bir dış sağlayıcının (Anthropic/OpenAI/xAI/Google) API anahtarını ortam değişkeni olarak sunucu tarafına tanımladıysa: karar noktalarında danışma paketini (aşağıda) o servislere gönder, yanıtları ham haliyle kaydet.
- Kurallar: anahtarlar asla repoya/istemciye yazılmaz; çağrılar sunucudan çıkar; her yanıt `agent_logs`'a "dış danışman" tipinde işlenir; sağlayıcı yanıt vermezse Mod B'ye düş.

### Mod B — İnsan-köprülü danışma (varsayılan)
Kullanıcı (Cem) köprüdür. Akış:
1. Karar noktasında **dur**: o aşamayı tamamla ama bir sonrakine başlama.
2. Bir **Danışma Paketi** üret ve kullanıcıya teslim et: (a) 10 satırlık bağlam özeti, (b) verilen karar ve gerekçesi, (c) 3 somut soru, (d) eleştiri perspektifi atamaları — örn. "Claude: teknik mimari / ChatGPT: ticari model / Grok: red-team / Gemini: veri ve ölçüm".
3. Kullanıcıya açıkça söyle: "Bu paketi diğer AI'lara ver, cevaplarını buraya yapıştır."
4. Kullanıcı cevapları yapıştırdığında: her itirazı **kabul / kısmen kabul / red + gerekçe** ile `ADVISORS.md` dosyasına işle, gerekli revizyonu yap, sonra devam et.
5. Çelişen tavsiyelerde ürün ilkeleri üstün gelir (Bölüm 0'daki onay ilkesi, Bölüm 6'daki hukuk kuralları). Dış tavsiye bu ilkeleri gevşetmeyi öneriyorsa reddedilir ve gerekçesi yazılır.

### Zorunlu karar noktaları (4 kapı)
1. **Veri modeli ve modül haritası sonrası** (Aşama 1 sonu)
2. **Ajan mimarisi + prompt seti sonrası** (Aşama 2 sonu)
3. **Onay Merkezi akışı sonrası** (Aşama 3 sonu — MVP'nin vaat ekranı)
4. **Aşama 4 öncesi** (Radar/Konsol'a geçmeden önce son gözden geçirme)

Kullanıcı "kapıyı geç, danışmadan devam et" derse bu kararı `ADVISORS.md`'ye "kullanıcı danışmayı atladı" olarak kaydet ve devam et — ama kendin danışmış gibi yapma.

---

## 13. Belirsizlik ve durma kuralları

- Bu belgede **[DV]** (doğrulanması gereken) işaretli konularda tahmin yürütme; kullanıcıya sor veya güvenli varsayılanı seçip README'ye yaz.
- Aynı yaklaşım 3 kez başarısız olursa dur, sorunu raporla, alternatif öner — kör deneme yapma.
- Kapsam dışı istek (ör. "reklamları otomatik yayınla") gelirse: v1.1 olarak işaretle, bu sürümde yapma.
- İş bittiğinde teslim notunda: neyin gerçek, neyin simülasyon, neyin eksik olduğunu açıkça yaz.

---

## 14. Açık sorular [DV] — inşaat sırasında değil, iş tarafında cevaplanacak

1. Pilot fiyatlandırma (ilk 10 ajansla birlikte belirlenecek)
2. Meta/Google API onay süreçleri ve gerekli uygulama incelemeleri
3. KVKK/GDPR sözleşme seti (hukuk danışmanı)
4. Marka tescili: "Konum" adı + logo
5. Test minimum örneklem eşikleri (istatistik danışmanlığı)

---

*Bu belge, önceki iş fikri raporunun (3 yaklaşım → 4 perspektif eleştirisi → hibrit seçim) ve canlı landing page'in devamıdır. Fikir sabitleri: insan onayı zorunlu, kanıt > varyasyon, beyaz etiket, kilitlenme yok, uydurma rakam yok.*

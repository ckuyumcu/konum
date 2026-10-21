# KIYAS 2 — Kapı 2 danışman bulguları × kararlar (2026-10-22)

İki Kapı 2 yanıtı (istatistik ağırlıklı + dört perspektifli) değerlendirildi.
Kararlar: **YAPILDI** (bu turda kodda + canlı doğrulandı), **A3/A4**, **ERTELENDİ**.

## YAPILDI — bu turda kodda

| Danışman bulgusu | Uygulama | Doğrulama |
|---|---|---|
| Pay/payda çifti: "donusum" paydasız tanımsız; serbest custom yanlış test açar | `olcutPayi`/`olcutPaydasi` enum çifti + izinli kombinasyonlar kodda (`payPaydaGecerliMi`): tiklama/gosterim, donusum/gosterim, donusum/tiklama. Oran olmayan ölçütler (gelir, sepet, CPA) bilinçli engellendi | Canlı: plan `tiklama/gosterim` ile kuruldu, oranlar 2,00%/4,00% doğru paydadan |
| CSV tekrarı / kümülatif dosya şişirmesi | CSV şablonuna zorunlu `tarih` kolonu; (test, varyant, tarih) tekil; dosya içi tekrar da reddedilir. Her satır günlük ARTIŞ olarak tanımlandı | Canlı: aynı dosyanın ikinci yüklemesi 409 CONFLICT döndü |
| Küresel maliyet şalteri (botnet → sınırsız fatura) | Workspace başına 50/gün'e ek küresel 300/gün LLM tavanı; teşhis aracında zaten 100/gün küresel tarama tavanı var | Kod incelemesi + mevcut tavanlar |
| Rapor linki tahmin edilemez olmalı | `tsh_` kimliği artık 64-bit kriptografik rastgele (`randomBytes`) | Canlı: `tsh_3e74decabd8ad78f` |
| IP hash: sabit tuz kaba kuvvete açık; IPv6 kaçağı; CGNAT notu | HMAC-SHA256, anahtar proje dışı gizli dosyada (600), günlük dönen tuz, IPv6 /64 normalizasyonu | 3 yeni birim testi |
| Simülasyon etiketi PDF'te atlatılabilir | Filigran her sayfanın altına gömülü: "SIMULATION — NOT A LIVE ANALYSIS" | Birim testi: çok sayfada her sayfada mevcut |
| Sonuç tekrarlanabilirliği (kod sürümü + girdi hash'i + α + an) | Kanıt kaydına reproduce bloğu: `stats v1.2 · α=0.05 two-sided · pair · input sha256 · ISO zaman` | Canlı kanıt kaydında görüldü |
| Arka-kapı peeking: sonuçsuz testi yeniden açmak | Hipotez başına `deneme` sayacı; kanıt kaydında "Attempt #N" yazıyor | Canlı: deneme alanı kayıtlı |
| Gösterim bağımsız birim değil (varyans küçülür) | v1 düzeltmesi: ≥3 günlük tarihli veride günlük kazanan yönü karışıksa sonuç "WEAK" etiketi alır; hesap değişmez | Kodda; dev veri 2 günlük olduğundan tetiklenmedi (beklenen) |
| "Anlamlı değil" ≠ "yetersiz veri" adlandırması | UI etiketi: "Insufficient data" → "No winner shown (p ≥ 0.05)" | Build |

## Danışman hükmüne yanıt

Danışman 1: "Teşhis aracı maliyet şalteri olmadan NO-GO" → şalter kuruldu
(küresel 300/gün LLM + 100/gün tarama tavanı). Danışman 2: "peeking disiplini
v1 için yeterli, şartlarla" → şartların hepsi kodda (eşik öncesi dokunulmazlık
önceki turda, deneme zinciri ve adlandırma bu turda).

## ERTELENDİ (tetik koşullu)

- **Grup sıralı test (O'Brien-Fleming, ≤3 bakış)** → v2. Tetik: ilk 20 gerçek
  testte "fark gösterilemedi" oranı > %50.
- **Teşhis hunisi panosu** (tarama→rapor→e-posta→PDF→pilot) + anonim çerez
  kimliği (CGNAT dostu limit) → A4. Tetik: /teshis trafiği anlamlı hacme ulaşınca.
- **Kısmi e-posta kilidi** (PDF indirme e-postaya bağlanır) → A4, huni ölçümü
  kurulduktan sonra; iki danışman da "tam kilit HAYIR" dedi, bu ortak nokta.
- **Dönüşüm penceresi / gözlem süresi** → v2 istatistik paketiyle.
- **Erişim (tekil kişi) paydası** → `test_results`'a `erisim` kolonu eklemek
  gerektirir; otomatik metrik entegrasyonuyla (A4) birlikte.

## REDDEDİLDİ

- **"Custom + pay seçici"** → iki danışman da açma dedi; oran olmayan ölçütler
  z-testiyle hesaplanamaz. Kontrollü çift yeterli.

## Cebimde kalan tek açık soru (pilot görüşmesine)

Danışmanların ortak HOLD gerekçesi: gerçek performans verisi sisteme nasıl
girecek? Pilot ajansın kanalı (Meta/Google/LinkedIn) ve API erişimi sorulacak.

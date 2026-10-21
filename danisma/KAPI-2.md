# KAPI 2 — Danışma Paketi (Kanıt Motoru + ücretsiz teşhis aracı, Aşama 2 sonu)

> Bu paketi Claude / ChatGPT / Grok / Gemini'ye ayrı ayrı ver, yanıtları ham hâliyle geri yapıştır.
> Yanıt formatı talebi: her itiraz için **itiraz / şiddet (kritik-orta-düşük) / önerilen değişiklik**.

## (a) Bağlam özeti (anonim, en fazla 10 satır)

Ajan destekli, insan onaylı ürün pazarlama platformunun ikinci aşaması tamamlandı:
Kanıt Motoru (hipotez → A/B test planı → sonuç → kazanan) ve herkese açık ücretsiz
teşhis aracı ("/teshis" — site taranır, mesajın kanıt haritası + 0-100 skor + PDF rapor).
Kazanan kararını LLM değil kod verir: iki oranlı z-testi (p<0,05), minimum örneklem
güç analiziyle (α=0,05, güç=0,80) hesaplanır; eşik sağlanmazsa sonuç "yetersiz veri".
Test sonuçları v1'de kullanıcı tarafından form/CSV ile girilir (otomatik metrik çekme yok).
Kazanan mesaj hem kanıt dosyasına hem Strateji Belleği'ne yazılır. Teşhis aracı limitleri:
IP başına 3/gün, global 100/gün; IP yalnızca hash'lenerek saklanır; e-posta rızaya bağlı.
LLM: Anthropic claude-haiku-5-5, resmî SDK, zod→JSON Schema zorlaması; anahtar yoksa
çıktılar deterministik ve açıkça "simülasyon" etiketli.

## (b) Verilen kararlar ve gerekçeleri

1. **Kazanan kararı kodda (LLM'de değil).** z-testi + güç analizi `server/stats.ts`
   içinde; LLM yalnız hipotez/plan metni üretir. Gerekçe: istatistiksel karar
   dil modelinin keyfîliğine bırakılamaz; denetlenebilir ve tekrarlanabilir olmalı.
2. **Ölçüt-pay eşleşmesi sezgisel:** test planının ölçüt metni "click/CTR/tıklama"
   içeriyorsa z-testinin payı tıklama, değilse dönüşüm sayılır. Gerekçe: ölçüt serbest
   metin; planlayıcının yazdığı metne göre karar vermek katı bir enum'dan daha esnek,
   ama sezgisel eşleşmenin yanlış pozitif riski var.
3. **Minimum örneklem dolmadan "değerlendir" sonuç üretmez** — "yetersiz veri"
   döner ve test kapanmaz (yeniden veri girilebilir). Gerekçe: erken durdurma
   (peeking) yanlış pozitifleri şişirir; v1'de bayesci/sequential analiz yok [DV].
4. **Teşhis aracı limitleri IP hash'iyle:** SHA-256(ip + tuz), ilk 24 hex.
   Gerekçe: ham IP saklamak KVKK/gizlilik yükü; hash yeterli ayırt edicilik verir.
5. **E-posta yalnız rıza ile saklanır** (rıza kutusu olmadan istek reddedilir).
   PDF rapor bağımlılıksız minimal üreteçle (harici kütüphane yok) sunucuda üretilir.
6. **Simülasyon etiketi her yüzeyde:** hipotez, plan, teşhis raporu ve PDF'te
   anahtar yokken "SIMULATION" rozeti zorunlu. Gerekçe: ürün vaadi "kanıt"ken
   sahte kanıt göstermek vaadi içeriden çürütür.

## (c) Üç somut soru

1. z-testi + sabit minimum örneklem yaklaşımı, kullanıcıların veriyi parça parça
   (günlük CSV) girdiği bir ortamda peeking yanlılığını pratikte ne kadar büyütür?
   v1.1'de otomatik metrik çekme gelince sequential test (örn. mSPRT) mı yoksa
   "karar yalnız eşik dolunca bir kez" kuralının korunması mı daha sağlam?
2. Ölçüt metni serbest olduğu için "click" geçen ama aslında dönüşüm kasteden
   (veya tersi) planlarda sezgisel eşleşme sessizce yanlış pay kullanır. Ölçütü
   yapısal alana (enum: ctr / signup / purchase / custom+pay-seçici) çevirmek
   esnekliği öldürür mü, yoksa bu tam olarak gerekli sertleşme mi?
3. Ücretsiz teşhis aracı lead mıknatısı olarak tasarlandı: 3/gün IP limiti ve
   rızalı e-posta. "Raporu görmek için e-posta" zorunluluğu eklemek dönüşümü
   artırır mı yoksa ürünün "kanıt önce" duruşunu zayıflatır mı?

## (d) Perspektif atamaları

- **Claude → istatistik** (soru 1, peeking/sequential tasarım)
- **ChatGPT → ürün/büyüme** (soru 3, lead mıknatısı ekonomisi)
- **Grok → red-team** (teşhis aracının suistimali: limit aşma, tarama kötüye
  kullanımı, simülasyon etiketini atlatma)
- **Gemini → veri modeli** (soru 2, ölçüt şeması ve test_results yapısı)

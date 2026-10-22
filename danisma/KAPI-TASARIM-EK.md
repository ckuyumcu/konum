# EK ÖNERİ — Arayüz Tonu: "Neşeli / Renkli / Animasyonlu"

> KAPI-3 ve KAPI-4 danışma paketlerine **(e) Ek öneri — tasarım yönü** başlığı olarak eklenir.
> Yanıt formatı aynı: **itiraz / şiddet (kritik-orta-düşük) / önerilen değişiklik**.

## 1. Karar (sahibin açık talimatı)

Platformun **pazarlama sitesi ve ürün karşılama yüzeyi** daha neşeli, daha renkli ve
animasyonlu olacak. Bu bir tercih değil, verilen yön. Danışmaya açılan şey "yapılsın mı"
değil, **"güven kaybı olmadan nasıl yapılır"**dır.

## 2. İki katmanlı ton ayrımı (çatışmayı çözen tasarım kuralı)

| Katman | Ton | Animasyon izni |
|---|---|---|
| **A. Pazarlama sitesi** (ana sayfa, nasıl çalışır, fiyat, ajans sayfası) | Tam neşeli, yüksek renk, sahne animasyonları | Serbest: scroll-reveal, akan boru hattı, hover sahneleri |
| **B. İcra Stüdyosu / Onay Merkezi** (çalışma ekranları) | Aynı palet, düşük doygunluk; renk **anlam taşır** | Yalnız mikro-geri bildirim (120–200 ms). Dekoratif hareket yok |
| **C. Denetim izi, hash, paket ekranları** | Nötr, sakin, veri odaklı | Yalnız durum geçişi vurgusu |

Gerekçe: onay/denetim ürünü satın alan kişi **enerjik bir marka** ister ama
**sakin bir kontrol paneli** ister. Aynı palet, farklı doygunluk = marka tutarlı,
güven bozulmaz.

## 3. Somut tasarım belirtimi (uygulanacak değerler)

### Palet
```
--zemin        #FFFDF7   sıcak kırık beyaz (ana zemin)
--zemin-alt    #F3EFE6   bölüm ayrımı
--metin        #14121F
--birincil     #FF6B3D   mercan — tüm birincil CTA
--ikincil      #2EC4B6   turkuaz — "onaylandı / doğrulandı"
--ajan         #7C5CFF   mor — ajan/AI üretimi olan her şey
--vurgu        #FFC93C   sarı — "onay bekliyor / kuyrukta"
--uyari        #FF4D6D   mercan-kırmızı — "red / hash uyuşmazlığı"
```
Kural: **renk tek başına anlam taşımaz** — her durum rengi + ikon + metin ile
birlikte gelir (erişilebilirlik + renk körlüğü). Metin/zemin kontrastı ≥ 4.5:1.

### Tipografi
- Başlık: **Space Grotesk** (700) — karakterli, Türkçe glifleri tam.
- Gövde: **Inter** (400/500).
- Dekoratif font (Clash Display vb.) kullanılacaksa önce **ş/ğ/İ/ı/ç/ö/ü glif testi** şart.

### Animasyon seti (pazarlama sitesi)
1. **Hero'da canlı boru hattı**: kanıt → mesaj → 3 varyasyon → onay damgası → yayın.
   Döngüsel, 8 sn, SVG + transform. Ürünün tek cümlelik anlatımı bu animasyondur.
2. **Scroll-reveal**: bölümler alttan 16 px + opaklık, 400 ms, 60 ms kademeli (stagger).
3. **Onay damgası mikro-sahnesi**: hash eşleşince mühür + turkuaz dalga (600 ms).
4. **Ajan nabzı**: mor noktada 2 sn'lik yumuşak pulse — "ajan çalışıyor" hissi.
5. **Sayı sayaçları**: metrikler görünür olunca 800 ms'de sayarak yükselir.
6. **Hover**: kartlarda 2° eğim + gölge derinliği (yalnız fare girdili cihazlarda).

### Zorunlu sınırlar (bunlar olmadan animasyon zarar verir)
- `prefers-reduced-motion: reduce` → tüm dekoratif hareket kapanır, içerik eksiksiz kalır.
- Yalnız `transform` ve `opacity` animasyonu (layout/paint tetikleyen özellik yok).
- Otomatik oynatılan video yok; hero animasyonu ≤ 60 KB.
- Performans bütçesi: LCP ≤ 2.5 sn, CLS ≤ 0.1, animasyon JS ≤ 120 KB (gzip).
- Mobilde boru hattı animasyonu 3 kareli sadeleşmiş sürüme düşer.

## 4. Sentetik panel sonucu (simülasyon — gerçek saha verisi DEĞİL)

n=100 sentetik katılımcı; 3 segment. İki ana sayfa varyantı gösterildi:
**V1 kurumsal-sade**, **V2 neşeli-renkli-animasyonlu**.

| Segment | n | V2'yi seçen | Ana gerekçe | V2 itirazı |
|---|---|---|---|---|
| Butik ajans sahibi | 40 | %62 | "Müşterime gösterebileceğim bir marka" | "Fiyat/güvenlik sayfası da böyleyse ciddiyetsiz durur" (%28) |
| Ajans içi pazarlamacı | 35 | %77 | "Ne yaptığını animasyondan 5 sn'de anladım" | "Çalışma ekranı da bu kadar hareketliyse yorar" (%31) |
| KOBİ marka sahibi | 25 | %56 | "Daha ulaşılabilir, korkutmuyor" | "Onay/denetim vaadiyle oyuncak görünüm çelişiyor" (%36) |

**Panelin tek net sinyali:** itirazların tamamı V2'nin *kendisine* değil,
**V2 tonunun çalışma/fiyat ekranlarına taşmasına** yönelik. Bölüm 2'deki
katman ayrımı bu itirazı doğrudan kapatıyor.

## 5. Danışmaya eklenen 4. soru

> **Soru 4.** Pazarlama yüzeyi yüksek renk + animasyonla "neşeli", çalışma
> ekranları aynı paletin düşük doygunluklu sürümüyle sakin tasarlanıyor.
> Bu iki katmanlı ton ayrımı, "onay/denetim ciddiyeti" algısını korurken marka
> enerjisini veriyor mu; yoksa kullanıcı siteden ürüne geçerken **ton kırılması**
> (bekledigim ürün bu değil) mi yaşar? Eğer kırılma riski varsa, köprü neresi
> olmalı — onboarding mi, ürün içi ilk 60 saniye mi?

## 6. Perspektif atamaları (4. soru için)

- **Claude → bilgi mimarisi & erişilebilirlik** (renk-anlam eşlemesi, reduced-motion, kontrast)
- **ChatGPT → marka/konumlandırma** (ajans alıcısında enerji ↔ güven dengesi)
- **Grok → red-team** (animasyonun gizlediği şeyler: hareket altında kaybolan hash
  uyuşmazlığı uyarısı, dikkat çalan sahne, performans regresyonu)
- **Gemini → tasarım sistemi** (iki katmanlı tonun tek token setinden türetilmesi)

## 7. Karar kartı

- **Kanıt:** Sahibin açık talimatı + sentetik panel sinyali (simülasyon).
- **Karşı tez:** Denetim/onay ürününde aşırı hareket güven düşürür (panelde %28–36 itiraz).
- **Bilinmeyen:** Gerçek ajans alıcısında ton kırılması etkisi ölçülmedi.
- **Geri dönüş maliyeti:** Düşük — palet ve hareket token'larda; katman B/C'nin
  doygunluk ve süre değerleri tek dosyadan geri alınır.
- **Hüküm: GO** (pazarlama yüzeyi için), **katman ayrımı ve zorunlu sınırlar şartıyla.**
- **Hükmü değiştirecek kanıt:** İlk 20 gerçek ziyaretçide "ciddiye almadım /
  oyuncak göründü" geri bildirimi ≥ %20 ise katman A'nın doygunluğu düşürülür.

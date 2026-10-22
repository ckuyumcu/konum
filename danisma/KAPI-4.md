# KAPI 4 — Danışma Paketi (Sinyal Radarı + Ajans Konsolu, Aşama 4 sonu)

> Bu paketi Claude / ChatGPT / Grok / Gemini'ye ayrı ayrı ver, yanıtları ham hâliyle geri yapıştır.
> Yanıt formatı talebi: her itiraz için **itiraz / şiddet (kritik-orta-düşük) / önerilen değişiklik**.

## (a) Bağlam özeti (anonim, en fazla 10 satır)

Ajan destekli, insan onaylı ürün pazarlama platformunun dördüncü (son) aşaması
tamamlandı: Sinyal Radarı (salt-okur Analist'in haftalık "ne öğrendik" özeti +
konumlandırma eskime alarmları) ve Ajans Konsolu (çok-müşterili görünüm, beyaz
etiket ayarları, platform sahibine özel ulaşım hazırlık listesi). Eskime alarmı
LLM'e bırakılmadı: kanıt dosyası 30+ gün yenilenmediyse VEYA taranmış sayfanın
(ürün/rakip) metin hash'i değişip kelime-kümesi farkı %20'yi aştıysa kural kodda
ateşlenir. Otomatik zamanlama bilerek yok — yenileme kullanıcı düğmesiyle
çalışır ve bu durum README'de açıkça yazar. Ulaşım listesi hiçbir e-postayı
otomatik göndermez; kişiselleştirilmiş taslak kopyala-yapıştır içindir; e-posta
pilot başvurularıyla eşleşirse durum otomatik güncellenir. LLM anahtarı yoksa
özet/taslak deterministik ve "simülasyon" etiketlidir.

## (b) Verilen kararlar ve gerekçeleri

1. **Eskime alarmı kural tabanlı, LLM'siz.** Gerekçe: alarm güvenilirliği
   dil modelinin hâlüsinasyonuna bağlanamaz; eşik (30 gün, %20 fark) spec'te
   [DV] olarak verildi, kodda sabit ve birim testli.
2. **Metin farkı ölçüsü: normalize kelime kümelerinde simetrik fark/birleşim.**
   Gerekçe: bağımlılıksız, deterministik, açıklanabilir. Kelime sırası
   değişimini ölçmez — sayfa yeniden yapılandırması (aynı kelimeler, yeni
   düzen) alarm üretmez; bu bilinçli bir ödünleşim.
3. **Otomatik zamanlama yok, düğme var.** Platform cron'u bu ortamda
   doğrulanamadığı için spec'in izin verdiği dürüst yol seçildi: "Şimdi
   yeniden tara" + README notu. Sahte "haftalık otomatik" rozeti yok.
4. **Yinelenen alarm yok:** okunmamış alarm açıkken aynı referans (kanıt
   kimliği / URL) için yeni alarm açılmaz. Gerekçe: alarm yorgunluğu alarmı
   değersizleştirir; kullanıcı okuyup kapatana kadar konu zaten gündemde.
5. **Analist salt-okur ve günlüğe yazılır:** özet üretimi `agent_logs`'a
   mod etiketiyle (llm/simulasyon) kaydedilir; alarm eylemi üretmez, yalnız
   sinyal yazar — eylem her zaman insan onayından geçer.
6. **Ulaşım listesi yalnız platform sahibine** (sunucuda e-posta kontrolüyle
   zorlanır) ve kişisel adres değil kurumsal genel adres kabul eder.
   Gerekçe: KVKK + itibar; soğuk e-posta kişisel adrese değil kurumsal
   genel iletişim adresine tasarlanır.
7. **Beyaz etiket kaydı gerçek, alan adı eşlemesi v1.1:** marka adı/renk
   bugün raporlara işlenebilir; DNS eşlemesi yapılmadan "özel alan adı
   aktif" denmez — formda açıkça "v1.1" yazar.

## (c) Üç somut soru

1. Eskime eşikleri (30 gün, %20) spec'ten gelen varsayılanlar. Erken pilot
   verisi olmadan bu eşikler rastgele kalıyor: eşikleri workspace başına
   ayarlanabilir yapmak mı, yoksa ilk 3 ay sabit tutup alarm/aksiyon oranını
   ölçerek mi kalibre etmek daha doğru?
2. Kelime-kümesi fark ölçüsü "aynı kelimeler, yeni anlam" değişimini kaçırır
   (ör. fiyat tablosu güncellenir ama kelime envanteri sabit kalır). Sayı
   çıkarma (regex ile sayısal ifadeleri ayrıca karşılaştırma) eklemek alarm
   isabetini anlamlı artırır mı, yoksa gürültü mü üretir?
3. Ulaşım taslağı alıcının sitesinden üretilen teşhis raporuna dayanıyor —
   yani ürün, satış aracının ta kendisi. Bu taslağa rakip karşılaştırması
   ("alanınızdaki ajansların kanıt skorları") eklemek dönüşümü artırır mı,
   yoksa soğuk e-postada fazla agresif mi kaçar?

## (d) Perspektif atamaları

- **Claude → ölçüm tasarımı** (soru 1, eşik kalibrasyon stratejisi)
- **ChatGPT → büyüme/satış** (soru 3, soğuk e-posta içeriği)
- **Grok → red-team** (alarm atlatma: rakibin taramayı algılayıp sabit içerik
  sunması, alarm flooding, ulaşım listesinin suistimali)
- **Gemini → sinyal işleme** (soru 2, fark ölçüsünün iyileştirilmesi)

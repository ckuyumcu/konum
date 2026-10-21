# KAPI 3 — Danışma Paketi (İcra Stüdyosu + Onay Merkezi, Aşama 3 sonu)

> Bu paketi Claude / ChatGPT / Grok / Gemini'ye ayrı ayrı ver, yanıtları ham hâliyle geri yapıştır.
> Yanıt formatı talebi: her itiraz için **itiraz / şiddet (kritik-orta-düşük) / önerilen değişiklik**.

## (a) Bağlam özeti (anonim, en fazla 10 satır)

Ajan destekli, insan onaylı ürün pazarlama platformunun üçüncü aşaması tamamlandı:
kanıtlanmış mesajdan tek tıkla 3 kanal varyasyonu (eposta/sosyal/reklam) üreten
İcra Stüdyosu ve tekil onay kuyruklu Onay Merkezi. Her içerik öğesinin
sha256(kanal|başlık|gövde) hash'i tutulur; onay, onaylanan metnin hash'ine bağlanır.
Onaylı içerik düzenlenirse onay otomatik bozulur, öğe kuyruğa döner ve olay kaydı
yazılır. Yayın paketi yalnızca onay hash'i güncel metinle birebir eşleşen öğeleri
alır; uyumsuzluk varsa paket reddedilir. Ret nedeni sözlüğü (ton/yanlış bilgi/
marka dışı/hukuki risk/diğer) ve zorunlu revize notu karar geçmişine yazılır.
Denetçi (deterministik yasaklı-ifade katmanı) üretim ve her düzenlemede çalışır;
geçemeyen öğe kuyruğa girmez. Toplu/kör onay yok; klavye ile tekil gezinme var.
LLM anahtarı yoksa tüm üretim "simülasyon" etiketli deterministik taslaktır.

## (b) Verilen kararlar ve gerekçeleri

1. **Onay, metnin hash'ine bağlı; düzenleme onayı bozar.** Onay olayına o anki
   govde_hash kopyalanır; paketleme öncesi son onayın hash'i güncel hash'le
   karşılaştırılır. Gerekçe: "onayladığım şeyle yayınlanan şey aynı mı?" sorusu
   insan hafızasına bırakılamaz; danışma turu 1'in P0 şartıydı.
2. **Onay-bozma geçişi tek durum makinesinden geçer** (onayli → onayKuyrugu
   yalnız `duzenleme-onayi-bozdu` yoluyla). Gerekçe: durum geçişleri dağınık
   koşullara değil tek sözlüğe bağlı; makineye girmeyen geçiş kodda yoktur.
3. **Denetçi düzenlemede de çalışır; denetimde/revize durumundaki öğe denetçiyi
   geçince doğrudan kuyruğa terfi eder.** Gerekçe: insan düzeltmesi yasaklı
   ifadeyi geri sokabilir; her yazma yolu filtreden geçmeli.
4. **Paket terminaldir** (`paketlendi`'den çıkış yok; makine reddeder).
   Gerekçe: paket dışa aktarım anahtarıyla mühürlenir; sonradan sessizce
   değişen "paketlenmiş" içerik denetim izini bozar. Düzeltme gerekiyorsa yeni
   varyasyon + yeni paket.
5. **Kuyruk sırası FIFO** (kuyrugaGiris zamanına göre) ve her kartta bekleme
   süresi rozeti. Gerekçe: onay gecikmesi ölçülebilir bir hizmet metriği;
   danışmanın istediği olay sözlüğünün ilk metriği.
6. **Reddetme nedeni enum + revize notu zorunlu.** Gerekçe: serbest metin ret
   analizi yapılamaz; yazara geri bildirim taşımayan red öğrenme üretmez.
7. **Varyasyon üretimi tam 3 kanal sabit** (eposta/sosyal/reklam), şema zod ile
   zorlanır; eksik/fazla varyasyon reddedilir. Gerekçe: v1 kapsam disiplini;
   kanal seti büyürse şema değişikliği bilinçli karar olur.

## (c) Üç somut soru

1. Hash'e bağlı onay "onaylanan metin ≠ yayınlanan metin" riskini kapatıyor ama
   hash yalnız metni kapsıyor: kanal değişmeden başlık/gövde aynı kalsa bile
   bağlam (hedef kitle, zamanlama, kampanya) değişebilir. Onayın kapsamını metin
   ötesine (örn. hedef segment + gönderim penceresi) genişletmek v1.1'de
   gereklilik mi, yoksa operasyonel ağırlık mı?
2. Paket terminalliği denetim izini korur ama "paketteki bir öğede yazım hatası
   fark edildi" senaryosunda tek yol yeni varyasyon + yeni onay + yeni paket.
   Bu sürtünme kabul edilebilir bir güvenlik bedeli mi, yoksa "paket iptali +
   öğeleri kuyruğa iade" eden ters geçiş eklemek denetim izini zayıflatmadan
   mümkün mü?
3. Onay Merkezi tek kullanıcılı pilotta hızlı; çok kişilik ekipte "kim onayladı"
   (rol kopyası + kullanıcı) kaydediliyor ama dört-göz ilkesi (üreten ≠ onaylayan)
   zorlanmıyor. Küçük ajans segmentinde dört-göz kuralını rol bazlı zorlamak
   (onay yetkisi yalnız sahip/yönetici, üretim herkes) gerçek bir satış argümanı
   mı, yoksa pilot ölçeğinde gereksiz mi?

## (d) Perspektif atamaları

- **Claude → denetim izi tasarımı** (soru 2, paket terminalliği vs iptal akışı)
- **ChatGPT → ürün/operasyon** (soru 3, dört-göz ilkesinin segment uygunluğu)
- **Grok → red-team** (hash kapsamını atlatma: aynı metin farklı bağlam,
  onay-bozma olayını atlayan yazma yolu, kuyruk sırası manipülasyonu)
- **Gemini → veri modeli** (soru 1, onay kapsamının şemaya taşınması)

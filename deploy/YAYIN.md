# KonumOS — Mevcut Yayın ve Güvenli Sürüm Değişikliği

Bu kılavuz mevcut KonumOS Render yayını içindir. AskThousand ayrı üründür;
eski `app.askthousand.com` / VPS / Caddy kurulum tarifi bu yayının talimatı değildir.

## Mevcut hizmet

- Depo: https://github.com/ckuyumcu/konum ; yayın dalı: `main`.
- Ürün adresi: https://konumos.com
- Mevcut servis: https://konum-y47v.onrender.com
- Render paneli: https://dashboard.render.com/web/srv-dbetc7ivcj2c73e3nuv0
- 8 Kasım 2026 kontrolünde hizmet Free; PR önizlemeleri kapalıdır.
  Plan ve önizleme ayarları zamanla değişebilir, işlemden önce panelden doğrulanır.

Bu belge yeni sunucu, disk, plan veya abonelik açılmasını; DNS değişikliğini;
yeniden başlatmayı veya dağıtımı başlatmayı yetkilendirmez. Birleştirmeler
otomatik yayın tetikleyebileceğinden belge değişiklikleri de yayın kapısından geçer.

## Uygulama ve API yolları

`server/serve.ts`, `dist/` içindeki arayüzü ve aynı süreçte API'yi sunar.
Dışarıdan gelen `/api` öneki kaldırılarak istek `server/app.ts` uygulamasına iletilir.

Sağlık denetimi:

```sh
curl --fail --silent --show-error https://konum-y47v.onrender.com/api/health
```

Beklenen: HTTP 200, JSON içerik türü ve aşağıdaki alanlar:

```json
{"ok":true,"servis":"konum-api"}
```

`/health` dış yolu API öneki taşımadığı için SPA arayüzüne düşebilir ve HTML ile
HTTP 200 dönebilir. Bu sonuç backend sağlığı kabul edilmez.
API sağlık yanıtı da ödeme, model bağlantısı, rapor doğruluğu, veri kalıcılığı
veya müşteri teslimatının kabulü değildir.

## Mevcut yapılandırma

İşlem öncesi gerçek servis yapılandırmasını doğrulayın; aşağıdaki adlar kaynak
davranışını anlatır, mevcut gizli değerleri açıklamaz veya değiştirme talimatı vermez.

| Alan | Kaynaktaki davranış |
|---|---|
| `PORT` | Sunucu portu; varsayılan 3000. |
| `KONUM_ENV` | `production` üretim modunu etkinleştirir. Kaynak `NODE_ENV=production` ve Render ortamını da üretim sayar. |
| `KONUM_PLATFORM_SAHIBI` | Gerçek sahibin e-postası. Üretimde örnek kişi/yerel adres atanmaz. |
| `KONUM_PILOT_DAVET` | Üretim ilk sahip daveti için özel değer gerekir; belgelenmiş geliştirme daveti üretimde reddedilir. Gerçek davet burada veya sohbette paylaşılmaz. |
| `KONUM_DATA_DIR` / `KONUM_DB_PATH` | SQLite konumu; `KONUM_DB_PATH` verilmişse dosya yolunu o belirler. Bir değişken tanımlamak tek başına kalıcı disk sağlamaz. |
| `KONUM_SECRET_DIR` | Gizli dosyanın dizini; varsayılan kullanıcı evindeki `.konum`. Veritabanından ayrı değerlendirilir. |
| `ANTHROPIC_API_KEY` | Ortam değişkeni veya mevcut Ayarlar akışıyla alınabilir. Anahtar git'e, log'a, belgeye veya ekran görüntüsüne yazılmaz. |
| `KONUM_YEDEK_ANAHTARI` | İsteğe bağlı korumalı yedek uçları için kullanılır; tanımsızsa uçlar kapalıdır. |

Üretimde sahip/davet kontrolü için geliştirme girişini kullanmayın. Gerçek
kullanıcı daveti, model çağrısı veya ücretli anahtar denemesi kabul kontrolüne
otomatik eklenmez.

## Veri koruma ve yayın kapısı

Free dosya sistemi kalıcı müşteri depolaması sayılmaz. Yeni sürüm veya restart
öncesinde o andaki veri durumu doğrulanır; geçmişte veri bulunmaması bugün de
bulunmadığının kanıtı değildir.

1. Canlı commit'i, aday commit'i ve değişen dosyaları kaydedin.
2. Mevcut kullanıcı/müşteri verisi ve korunacak yapılandırmayı yetkili yoldan belirleyin.
3. Veri varsa tutarlı tam SQLite yedeği ve ayrı konumda geri yükleme/bütünlük kontrolünü tamamlayın.
   Aktif WAL veritabanını yalnız ana dosyayı kopyalayarak yedeklenmiş saymayın.
4. Kaynak geri dönüşü ile veritabanı geri yüklemesini ayrı planlayın.
   Git commit'i kullanıcı verisinin yedeği değildir.
5. Veritabanı, gizli yapılandırma, erişim ve geri yükleme sorumluluğunu belirleyin.
   Yedekler herkese açık depoya veya kamusal çıktıya konmaz.
6. Veri kalıcılığı ve geri dönüş doğrulanmadan kullanıcı verisi taşıyan hizmette yayın/restart yapmayın.
   Yeni ücretli disk/plan veya harcama için ayrıca yetki gerekir.

Mevcut kaynakta korumalı yedek yolu `/api/admin/yedek`, özet yolu
`/api/admin/yedek/ozet` şeklindedir. Bu yolların kaynakta bulunması, canlıda
açık olduklarını veya bir yedeğin alınıp geri yüklendiğini kanıtlamaz.
Yetkisiz istek, anahtar tahmini veya anahtarı URL'ye yazma yoktur.

## Yayın ve son kullanıcı kabulü

- [ ] Güncel dal/commit, gerçek korunacak veri ve geri dönüş koşulları doğrulandı.
- [ ] Değişikliğe uygun derleme ve mevcut ağsız kontroller geçti; eski sonuç yeni test sayılmadı.
- [ ] Yayın yetkisi ve mevcut maliyet sınırı içinde kalındı.
- [ ] Yayın sonrası gerçek canlı commit aday sürümle eşleşiyor.
- [ ] `/api/health` HTTP 200 ve beklenen JSON döndürüyor.
- [ ] Ürün adresi, menü, mobil görünüm, hukuki bağlantılar ve hata/boş durumlar kontrol edildi.
- [ ] Giriş ve izinler, onaylı test hesabı veya ağsız fixture ile kontrol edildi; gerçek müşteriye test daveti gönderilmedi.
- [ ] Simülasyon etiketi ve skorun sınırı ekran/raporda korunuyor.
- [ ] Ücretli model, ödeme, kayıt/davet ve teslim testlerinin hangisinin gerçekten yapıldığı ayrı kaydedildi.

Yayın başarılı, kaynak düzeltildi ve ücretli müşteri teslimi kabul edildi
durumları birbirinin yerine kullanılmaz.

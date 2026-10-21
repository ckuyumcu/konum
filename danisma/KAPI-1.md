# KAPI 1 — Danışma Paketi (Veri modeli ve modül haritası, Aşama 1 sonu)

> Bu paketi Claude / ChatGPT / Grok / Gemini'ye ayrı ayrı ver, yanıtları ham hâliyle geri yapıştır.
> Yanıt formatı talebi: her itiraz için **itiraz / şiddet (kritik-orta-düşük) / önerilen değişiklik**.

## (a) Bağlam özeti (anonim, en fazla 10 satır)

Ajanslara beyaz etiketle satılan, yapay zekâ ajanlı bir ürün pazarlama platformu
inşa ediliyor (MVP v1). Temel ilke: hiçbir içerik insan onayı olmadan dışarı
çıkamaz. v1'de reklam platformlarına yayın YOK; yayına hazır paket üretilir.
Kullanıcı yolculuğu: workspace aç → site taraması → Strateji Belleği taslağı →
insan onayı (onaysız modüller kilitli) → mesaj hipotezi → küçük A/B testi →
kazanan "kanıt dosyası" → kanal varyasyonları → tekil onay kuyruğu → yayın paketi.
Teknoloji: React + Vite ön yüz; tRPC + Drizzle + Hono sunucu; ilişkisel veritabanı.
Test sonuçları v1'de kullanıcı tarafından form/CSV ile girilir; kazanan kararını
LLM değil kod (iki oranlı z-testi, p<0,05) verir. Her ajan çıktısı şemalı JSON +
Denetçi süzgeci + günlük kaydı içerir.

## (b) Verilen kararlar ve gerekçeleri

1. **Modül haritası (6 modül + teşhis aracı):** Strateji Belleği, Kanıt Motoru,
   İcra Stüdyosu, Onay Merkezi, Sinyal Radarı, Ajans Konsolu. Gerekçe: kullanıcı
   yolculuğundaki her adım tek ekrana karşılık gelsin; Onay Merkezi tek yayın
   kapısı olarak ayrı modül.
2. **Veri modeli (18 tablo):** users, invites, sessions, workspaces,
   workspace_members, strategy_beliefs, crawl_snapshots, hypotheses, tests,
   test_results, evidence_files, content_items, approval_events,
   publish_packages, agent_logs, signals, pilot_applications, diagnosis_requests.
   Gerekçe: her varlık tek sorumluluk; approval_events değiştirilemez denetim
   kaydı; crawl_snapshots eskime alarmına karşılaştırma tabanı.
3. **Bellek kilidi sunucuda zorlanır** (yalnız UI'da değil). Gerekçe: ürünün
   vaadi API seviyesinde de tutulmalı.
4. **Durum geçişleri tek durum makinesinde** (taslak→onayBekliyor→çalışıyor…;
   denetimde→onayKuyrugu→onaylı→paketlendi). Gerekçe: "onaysız paketlenme"
   gibi yasadışı geçişler kodla imkânsız olmalı.
5. **Giriş davetle** (invites tablosu); davetsiz kullanıcı uygulamaya giremez.
   Gerekçe: v1'de KOBİ self-servis kayıt yok; pilot kontrollü büyür.

## (c) Üç somut soru

1. Bu veri modelinde, ileride "ajans → çok müşteri → çok kullanıcı" yetki
   matrisini (sahip/editör/onaylayıcı/izleyici) genişletirken kırılganlık
   yaratacak bir yapısal eksik veya fazlalık var mı?
2. "Kanıt dosyası" (test sonucu → içerik üretiminin tek kaynağı) ile
   Strateji Belleği arasındaki sınır doğru yerde mi? Kanıtlanmış mesajların
   belleğe de yazılması çift kaynak riski mi, tutarlılık sigortası mı?
3. Onay Merkezi'nde tekil onay zorunluluğu (toplu onay yok) günde ~50 öğe
   üreten bir ajansta kullanılabilirlik duvarına çarpar mı; çarparsa vaadi
   bozmadan (her öğe tekil karar) hangi mekanizma (örn. klavye akışı, ön-eleme
   sıralaması) yeterli olur?

## (d) Perspektif atamaları

- **Claude → teknik mimari** (şema, durum makinesi, yetki modeli)
- **ChatGPT → ticari model** (beyaz etiket ajans iş modeli, modül sınırları)
- **Grok → red-team** (kilit/izolasyon kaçakları, suistimal senaryoları)
- **Gemini → veri ve ölçüm** (test/istatistik veri modeli, crawl_snapshots tasarımı)

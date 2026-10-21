# ADVISORS — Dış Yapay Zekâ Danışma Kayıtları

## Mod seçimi (çalışma başı doğrulaması — 21 Ekim 2026)

**Aktif mod: Mod B (insan-köprülü danışma).** Gerekçe:

- **Mod C (tarayıcı):** Bu ortam Cem'in kendi Mac'i; kullanıcının gerçek
  tarayıcısını kontrol etme aracı (Kimi WebBridge) teknik olarak mevcut. Ancak
  Claude/ChatGPT/Grok/Gemini oturumlarının açık olup olmadığı doğrulanmadı ve
  Cem, Kapı 1 için paketin sohbette verilmesini açıkça istedi ("Kapı 1 paketini
  sohbette ver"). Bu, Mod B akışının doğrudan kullanıcı tarafından seçilmesidir.
- **Mod A (API):** Ortamda dış sağlayıcı anahtarı yok. Tek anahtar
  `KIMI_API_KEY`; bu, Kimi Work çalışma zamanının kendi anahtarıdır, dış
  danışman değildir (ve Moonshot platform API'sinde geçersiz — 401 doğrulandı).
  Ayrıca v2 kuralı: harcama tavanı yazılı verilmeden API çağrısı yapılmaz.
- **Erişilebilir modeller:** Doğrulanmış dış model erişimi yok; paket Cem
  tarafından köprülenecek. Perspektif atamaları: Claude → teknik mimari,
  ChatGPT → ticari model, Grok → red-team, Gemini → veri ve ölçüm.

**Platform araçları doğrulaması (v2 Bölüm 4 [DV]):** `backend-building`,
`website-storage`, `agent-gw SDK`, `website_version_manager`, Kimi OAuth —
hiçbiri bu ortamda mevcut değil. Eşdeğerler README'de tablo halinde yazılı
(elle tRPC/Drizzle/Hono; yerel dosya klasörü; kendi LLM sağlayıcı arayüzü;
git tag; e-posta + davet kodu).

## Kapı kayıtları

### Kapı 1 — Veri modeli ve modül haritası (Aşama 1 sonu, 21 Ekim 2026)

- Paket: `danisma/KAPI-1.md` üretildi ve sohbette tam metniyle Cem'e verildi.
- Yanıtlar: **bekleniyor.** Yanıtlar gelince her itiraz buraya
  kabul / kısmen kabul / red + gerekçe ile işlenecek.
- (Cem "kapıyı geç" derse buraya "kullanıcı danışmayı atladı — tarih" yazılacak.)

<!-- Kapı 2–4 kayıtları ilgili aşamaların sonunda eklenecek. -->

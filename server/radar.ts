// Sinyal Radarı — saf kural mantığı (Aşama 4 + kabul kapısı düzeltmeleri).
// Ağ ve veritabanı burada yok; her kural birim/E2E testinde doğrudan sınanır.
// Karşılaştırma her zaman KABUL EDİLMİŞ ESAS anlık kayda yapılır (son kayda değil)
// — kademeli drift (her adımı %20'nin altında kalan birikimli değişim) bu sayede
// alarmı atlatamaz.

export const ESKIME_ESIK = 0.2; // metin farkı eşiği [DV]
export const KANIT_YAS_GUN = 30; // kanıt yenilenme eşiği [DV]
export const ALARM_TEKRAR_GUN = 30; // aynı referans için iki alarm arası asgari süre
export const ERTELEME_GUN = 7; // "ertelendi" alarmının susturma süresi

const GUN_MS = 24 * 60 * 60 * 1000;

/** Tarama alarmı: yeni tarama, esas anlık kayıttan hash olarak ayrışıyor VE metin farkı eşiği aşıyor mu? */
export function taramaAlarmiGerekirMi(
  esas: { hash: string; metin: string },
  yeni: { hash: string; metin: string },
  farkOlcu: (a: string, b: string) => number,
): { gerek: boolean; fark: number } {
  if (esas.hash === yeni.hash) return { gerek: false, fark: 0 };
  const fark = farkOlcu(esas.metin, yeni.metin);
  return { gerek: fark > ESKIME_ESIK, fark };
}

export type AlarmDurumu = "acik" | "okundu" | "ertelendi" | "cozuldu";

export interface AlarmKaydi {
  referansId: string;
  durum: string;
  ertelemeBitis: number | null;
  createdAt: number;
}

/**
 * Aynı referans için yeni alarm açılmalı mı?
 * - Açık alarm varken: hayır (konu zaten gündemde).
 * - Ertelenmiş ve süresi dolmamış alarm varken: hayır.
 * - Son alarm (herhangi bir durumda) 30 günden yeniyse: hayır — okundu diye
 *   aynı eskime her taramada yeniden alarm üretmez.
 */
export function alarmAcilabilirMi(referansId: string, gecmis: AlarmKaydi[], simdi: number): boolean {
  const ilgili = gecmis.filter((a) => a.referansId === referansId);
  for (const a of ilgili) {
    if (a.durum === "acik") return false;
    if (a.durum === "ertelendi" && a.ertelemeBitis !== null && a.ertelemeBitis > simdi) return false;
  }
  const son = ilgili.reduce((m, a) => Math.max(m, a.createdAt), 0);
  if (son > 0 && simdi - son < ALARM_TEKRAR_GUN * GUN_MS) return false;
  return true;
}

/** Kanıt eskimesi: kanıt 30+ gün önce üretilmiş VE o kanıt için alarm açılabilir durumda. */
export function kanitAlarmiGerekirMi(
  kanit: { id: string; createdAt: number },
  gecmis: AlarmKaydi[],
  simdi: number,
): boolean {
  if (simdi - kanit.createdAt < KANIT_YAS_GUN * GUN_MS) return false;
  return alarmAcilabilirMi(kanit.id, gecmis, simdi);
}

// Kişisel e-posta alan adları — ulaşım listesi yalnız kurumsal genel adres kabul eder
// (v2 Bölüm 15.2). Beyan değil, sunucuda zorlanır.
const KISISEL_ALANLAR = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.com.tr", "yandex.com", "yandex.com.tr",
  "hotmail.com", "hotmail.com.tr", "outlook.com", "outlook.com.tr", "live.com", "live.com.tr",
  "msn.com", "icloud.com",
  "me.com", "mac.com", "proton.me", "protonmail.com", "aol.com", "mail.com", "gmx.com",
  "gmx.net", "zoho.com", "yopmail.com", "mynet.com", "superonline.com", "ttmail.com",
]);

export function kisiselEpostaMi(eposta: string): boolean {
  const alan = eposta.split("@")[1]?.toLocaleLowerCase("en") ?? "";
  return KISISEL_ALANLAR.has(alan);
}

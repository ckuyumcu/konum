// Teşhis aracı güvenliği — danışma turu 2 (Kapı 2) bulguları:
// 1) Sabit tuzlu SHA-256 kaba kuvvetle çözülebilir (IPv4 uzayı küçük) → HMAC + sunucuda gizli anahtar.
// 2) Günlük dönen tuz: limit zaten günlük; günler arası takip imkânsızlaşır.
// 3) IPv6 kaçağı: tam adres hash'lenirse kullanıcı adres değiştirerek limiti aşar → /64 öneki.

import { createHmac } from "node:crypto";
import { hmacAnahtari } from "./config";

/** IPv6 adresini /64 önekine indirir; IPv4 ve diğerleri olduğu gibi kalır. */
export function ipNormallestir(ip: string): string {
  const s = (ip || "").trim();
  if (!s.includes(":")) return s; // IPv4 / bilinmeyen
  // "::" kısaltmasını kabaca açmak yerine ilk 4 grubu almak yeterli:
  // aynı /64 ağındaki tüm adresler tek kimlik sayılır.
  const gruplar = s.split(":").filter((g) => g.length > 0);
  return gruplar.slice(0, 4).join(":") + "::/64";
}

/**
 * Günlük IP kimliği: HMAC-SHA256(anahtar, "YYYY-AA-GG|ip").
 * Anahtar proje dışı gizli dosyada (~/.konum/secrets.json) durur, git'e girmez.
 * Gün değişince hash değişir → günler arası kullanıcı takibi yapılamaz.
 */
export function gunlukIpHash(ip: string, tarih?: Date): string {
  const d = tarih ?? new Date();
  const gun = d.toISOString().slice(0, 10);
  return createHmac("sha256", hmacAnahtari()).update(`${gun}|${ipNormallestir(ip)}`).digest("hex").slice(0, 24);
}

export function tarihYaz(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AJAN_ADLARI: Record<string, string> = {
  arastirmaci: "Araştırmacı",
  stratejist: "Stratejist Yardımcısı",
  testTasarimcisi: "Test Tasarımcısı",
  icerikUretici: "İçerik Üretici",
  yayinci: "Yayıncı",
  analist: "Analist",
  denetci: "Denetçi",
  disDanisman: "Dış Danışman",
};

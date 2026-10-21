// Denetçi ajan — Talimat Bölüm 3: "Tüm ajan çıktısı Strateji Belleği + marka kuralları +
// yasaklı ifadelerle karşılaştırılır." Reddederse öğe Onay Merkezi'ne hiç düşmez.

export interface DenetciSonuc {
  karar: "gecti" | "reddedildi";
  gerekce: string;
}

interface DenetciGirdi {
  metin: string;
  yasakliIfadeler: string[];
}

// Uydurma istatistik engeli: kaynağı belirtilmemiş yüzde/kat iddiaları
// (Talimat Bölüm 6.5: uydurma istatistik yazılmaz)
const UYDURMA_ISTATISTIK = /(%\s?\d+|\d+\s?(kat|x)\b|\d+(\.\d+)?\s?(milyon|milyar)\b)/i;

export function denetle(girdi: DenetciGirdi): DenetciSonuc {
  const kucuk = girdi.metin.toLocaleLowerCase("tr");
  for (const ifade of girdi.yasakliIfadeler) {
    const i = ifade.trim().toLocaleLowerCase("tr");
    if (i && kucuk.includes(i)) {
      return {
        karar: "reddedildi",
        gerekce: `Yasaklı ifade tespit edildi: "${ifade}". Strateji Belleği'ndeki kural ihlal edildi.`,
      };
    }
  }
  const m = girdi.metin.match(UYDURMA_ISTATISTIK);
  if (m && !/kaynak|ar[aş]t[iı]rma|\bveri\b|testte|ölçüm/i.test(girdi.metin)) {
    return {
      karar: "reddedildi",
      gerekce: `Kaynaksız sayısal iddia tespit edildi ("${m[0]}"). İddia ya kanıta bağlanmalı ya da kaldırılmalı.`,
    };
  }
  return { karar: "gecti", gerekce: "Kural ihlali bulunamadı." };
}

// Auditor agent — Brief Section 3: "All agent output is checked against Strategy Memory +
// brand rules + banned phrases." If rejected, the item never reaches the Approval Center.

export interface DenetciSonuc {
  karar: "gecti" | "reddedildi";
  gerekce: string;
}

interface DenetciGirdi {
  metin: string;
  yasakliIfadeler: string[];
}

// Fabricated-statistics guard: percentage/multiple claims without a stated source
// (Brief Section 6.5: no made-up statistics)
const UYDURMA_ISTATISTIK = /(%\s?\d+|\d+\s?(kat|x)\b|\d+(\.\d+)?\s?(milyon|milyar)\b)/i;

export function denetle(girdi: DenetciGirdi): DenetciSonuc {
  const kucuk = girdi.metin.toLocaleLowerCase("en");
  for (const ifade of girdi.yasakliIfadeler) {
    const i = ifade.trim().toLocaleLowerCase("en");
    if (i && kucuk.includes(i)) {
      return {
        karar: "reddedildi",
        gerekce: `Banned phrase detected: "${ifade}". A Strategy Memory rule was violated.`,
      };
    }
  }
  const m = girdi.metin.match(UYDURMA_ISTATISTIK);
  if (m && !/kaynak|ar[aş]t[iı]rma|\bveri\b|testte|ölçüm|source|study|research|\bdata\b|tested|measured/i.test(girdi.metin)) {
    return {
      karar: "reddedildi",
      gerekce: `Unsourced numeric claim detected ("${m[0]}"). The claim must be tied to evidence or removed.`,
    };
  }
  return { karar: "gecti", gerekce: "No rule violation found." };
}

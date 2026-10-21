// Minimal PDF üreteci — bağımlılık yok. PDF 1.4, Helvetica, Latin-1.
// /teshis raporu tek amaçlıdır: indirilebilir kanıt raporu.

// WinAnsi'ye güvenli çeviri (desteklenmeyen karakterler ASCII'ye düşer)
function latin1(s: string): string {
  return s
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/▌/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function pdfEscape(s: string): string {
  return latin1(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(metin: string, genislik = 92): string[] {
  const kelimeler = metin.split(/\s+/);
  const satirlar: string[] = [];
  let satir = "";
  for (const k of kelimeler) {
    if ((satir + " " + k).trim().length > genislik) {
      satirlar.push(satir.trim());
      satir = k;
    } else {
      satir += " " + k;
    }
  }
  if (satir.trim()) satirlar.push(satir.trim());
  return satirlar;
}

export interface PdfBolum {
  baslik: string;
  satirlar: string[];
}

/** Çok sayfalı basit metin raporu üretir; PDF baytlarını döndürür. */
export function raporPdf(baslik: string, altBaslik: string, bolumler: PdfBolum[]): Uint8Array {
  const SAYFA_SATIR = 46;
  const sayfalar: string[][] = [];
  let akim: string[] = [`${baslik}`, altBaslik, ""];

  const kapat = () => {
    sayfalar.push(akim);
    akim = [];
  };

  for (const b of bolumler) {
    const blok = [b.baslik.toUpperCase(), ...b.satirlar.flatMap((l) => wrap(l)), ""];
    if (akim.length + blok.length > SAYFA_SATIR) kapat();
    akim.push(...blok);
  }
  if (akim.length) kapat();

  const objeler: string[] = [];
  const sayfaIds: number[] = [];
  const fontObjNo = 3 + sayfalar.length * 2; // hesap: 1 catalog, 2 pages, sonra her sayfa (page+content), sonda font
  // 1: catalog, 2: pages
  objeler[1] = "<< /Type /Catalog /Pages 2 0 R >>";

  sayfalar.forEach((satirlar, i) => {
    const pageNo = 3 + i * 2;
    const contentNo = pageNo + 1;
    sayfaIds.push(pageNo);
    const y0 = 780;
    const satirYukseklik = 16;
    const govde = satirlar
      .map((l, j) => `BT /F1 ${j < 2 && i === 0 ? 15 : 10} Tf 50 ${y0 - j * satirYukseklik} Td (${pdfEscape(l)}) Tj ET`)
      .join("\n");
    objeler[pageNo] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjNo} 0 R >> >> /Contents ${contentNo} 0 R >>`;
    objeler[contentNo] = `<< /Length ${govde.length} >>\nstream\n${govde}\nendstream`;
  });

  objeler[2] = `<< /Type /Pages /Kids [${sayfaIds.map((n) => `${n} 0 R`).join(" ")}] /Count ${sayfalar.length} >>`;
  objeler[fontObjNo] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const toplam = fontObjNo;
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i <= toplam; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objeler[i]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${toplam + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= toplam; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${toplam + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

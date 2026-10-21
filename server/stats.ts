// İstatistik motoru — kazanan kararını LLM değil bu kod verir (v2 Bölüm 2.4).
// İki oranlı z-testi (p < 0.05) + güç analiziyle minimum örneklem
// (α = 0.05, güç = 0.80 — varsayılanlar README'de [DV]).

const Z_ALFA_2 = 1.959964; // α = 0.05, çift kuyruk
const Z_GUC = 0.8416212; // güç = 0.80

// Abramowitz & Stegun 7.1.26 — erf yaklaşımı (|hata| < 1.5e-7)
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Standart normal kümülatif dağılımı Φ(z) */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export interface OranSonucu {
  p1: number; // kontrol dönüşüm oranı
  p2: number; // varyant dönüşüm oranı
  z: number;
  pDegeri: number; // çift kuyruk
  anlamli: boolean; // p < 0.05
}

/** İki oranlı z-testi. x = dönüşüm sayısı, n = gösterim/örneklem. */
export function ikiOranZTesti(x1: number, n1: number, x2: number, n2: number): OranSonucu | null {
  if (n1 <= 0 || n2 <= 0) return null;
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pooled = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  if (se === 0 || !Number.isFinite(se)) return null; // iki kolda da sıfır/tam dönüşüm
  const z = (p2 - p1) / se;
  const pDegeri = Math.min(1, 2 * (1 - normalCdf(Math.abs(z))));
  return { p1, p2, z, pDegeri, anlamli: pDegeri < 0.05 };
}

/**
 * Varyant başına minimum örneklem — eşit grup güç analizi.
 * temelOran: baz dönüşüm oranı (0-1), mde: tespit edilmek istenen mutlak fark (0-1).
 */
export function minimumOrneklem(temelOran: number, mde: number): number {
  const p1 = Math.min(0.9999, Math.max(0.0001, temelOran));
  const p2 = Math.min(0.9999, p1 + Math.max(0.0001, mde));
  const pBar = (p1 + p2) / 2;
  const delta = p2 - p1;
  const pay =
    Z_ALFA_2 * Math.sqrt(2 * pBar * (1 - pBar)) +
    Z_GUC * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil((pay * pay) / (delta * delta));
}

export type KazananKarar =
  | { tur: "kazanan"; kazananVaryantId: string; pDegeri: number; oranlar: Record<string, number> }
  | { tur: "yetersizVeri"; gerekce: string; oranlar: Record<string, number> };

export interface KolVerisi {
  varyantId: string;
  gosterim: number;
  donusum: number;
}

/**
 * Kazanan kararı: her kol minimum örneklemi doldurmadıysa karar verilmez.
 * Doldurduysa z-testi uygulanır; anlamlıysa yüksek oranlı kol kazanır.
 * Kontrol = ilk kol (A), varyant = ikinci kol (B).
 */
export function kazananKarari(kontrol: KolVerisi, varyant: KolVerisi, minOrneklem: number): KazananKarar {
  const oranlar: Record<string, number> = {
    [kontrol.varyantId]: kontrol.gosterim > 0 ? kontrol.donusum / kontrol.gosterim : 0,
    [varyant.varyantId]: varyant.gosterim > 0 ? varyant.donusum / varyant.gosterim : 0,
  };
  if (kontrol.gosterim < minOrneklem || varyant.gosterim < minOrneklem) {
    return {
      tur: "yetersizVeri",
      gerekce: `Minimum sample not reached (${minOrneklem} per arm). Current: ${kontrol.gosterim} vs ${varyant.gosterim}.`,
      oranlar,
    };
  }
  const sonuc = ikiOranZTesti(kontrol.donusum, kontrol.gosterim, varyant.donusum, varyant.gosterim);
  if (!sonuc) {
    return {
      tur: "yetersizVeri",
      gerekce: "The statistic cannot be computed (zero or full conversion in both arms).",
      oranlar,
    };
  }
  if (!sonuc.anlamli) {
    return {
      tur: "yetersizVeri",
      gerekce: `The difference is not statistically significant (p = ${sonuc.pDegeri.toFixed(4)} ≥ 0.05). More data or a bolder variant is needed.`,
      oranlar,
    };
  }
  const kazanan = sonuc.p2 > sonuc.p1 ? varyant.varyantId : kontrol.varyantId;
  return { tur: "kazanan", kazananVaryantId: kazanan, pDegeri: sonuc.pDegeri, oranlar };
}

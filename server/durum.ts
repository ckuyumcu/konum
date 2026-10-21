import { TRPCError } from "@trpc/server";

// Tek durum makinesi — v2 Bölüm 3 kural 9: durum geçişleri sunucuda tek
// fonksiyonla yapılır; izin verilmeyen geçiş hata döner.
const GECISLER: Record<string, Record<string, string[]>> = {
  bellek: {
    taslak: ["onaylandi"],
    onaylandi: [],
  },
  test: {
    taslak: ["onayBekliyor"],
    onayBekliyor: ["calisiyor", "taslak"],
    calisiyor: ["tamamlandi", "yetersizVeri"],
    tamamlandi: [],
    yetersizVeri: [],
  },
  icerik: {
    denetimde: ["onayKuyrugu"],
    onayKuyrugu: ["onayli", "revize", "reddedildi"],
    revize: ["onayKuyrugu"],
    onayli: ["paketlendi"],
    reddedildi: [],
    paketlendi: [],
  },
};

export function gecisZorla(tur: keyof typeof GECISLER, mevcut: string, hedef: string): void {
  const izinliler = GECISLER[tur]?.[mevcut] ?? [];
  if (!izinliler.includes(hedef)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `İzin verilmeyen durum geçişi: ${tur} ${mevcut} → ${hedef}. Bu işlem ancak "${
        izinliler.join('", "') || "hiçbir"
      }" durumuna geçebilir.`,
    });
  }
}

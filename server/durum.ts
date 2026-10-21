import { TRPCError } from "@trpc/server";

// Single state machine — v2 Section 3 rule 9: state transitions happen through one
// function on the server; disallowed transitions return an error.
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
    // Danışma turu 1: onaylı içerik düzenlenirse onay geçersizleşir → kuyruğa döner.
    // Bu geçişi yalnızca icra.duzenle kullanır ve approval_events'e "duzenleme-onayi-bozdu" yazar.
    onayli: ["paketlendi", "onayKuyrugu"],
    reddedildi: [],
    paketlendi: [],
  },
};

export function gecisZorla(tur: keyof typeof GECISLER, mevcut: string, hedef: string): void {
  const izinliler = GECISLER[tur]?.[mevcut] ?? [];
  if (!izinliler.includes(hedef)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Disallowed state transition: ${tur} ${mevcut} → ${hedef}. This can only move to "${
        izinliler.join('", "') || "none"
      }" state.`,
    });
  }
}

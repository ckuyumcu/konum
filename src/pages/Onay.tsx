import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { tarihYaz } from "../lib/format";

interface KuyrukOge {
  id: string;
  kanal: string;
  baslik: string;
  govde: string;
  surum: number;
  mod: string;
  kuyrugaGiris: number | null;
  createdAt: number;
}

interface Paket {
  id: string;
  ogeler: string;
  olusturan: string;
  olusturmaZamani: number;
  disaAktarimAnahtari: string;
}

interface Olay {
  id: string;
  contentItemId: string;
  eylem: string;
  not: string;
  redNedeni: string;
  rol: string;
  zaman: number;
}

const KANAL_ETIKET: Record<string, string> = { eposta: "Email", sosyal: "Social", reklam: "Ad" };

const RED_NEDENLERI = [
  { deger: "ton", ad: "Tone" },
  { deger: "yanlis-bilgi", ad: "Wrong information" },
  { deger: "marka-disi", ad: "Off-brand" },
  { deger: "hukuki-risk", ad: "Legal risk" },
  { deger: "diger", ad: "Other" },
] as const;

const EYLEM_AD: Record<string, string> = {
  onay: "Approved",
  red: "Rejected",
  revize: "Revision requested",
  paketlendi: "Packaged",
  "duzenleme-onayi-bozdu": "Approval broken by edit",
  "yayin-planlandi": "Added to publish plan",
  "yayin-disaAktarildi": "Publish text exported",
  "yayin-yayinlandiManuel": "Marked as published (manual)",
  "yayin-iptal": "Publish plan cancelled",
};

function beklemeYaz(giris: number | null): string {
  if (!giris) return "—";
  const dk = Math.max(0, Math.round((Date.now() - giris) / 60000));
  if (dk < 60) return `${dk} min in queue`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} h ${dk % 60} min in queue`;
  return `${Math.floor(saat / 24)} d ${saat % 24} h in queue`;
}

export default function Onay() {
  const { workspaceId, bellekOnayli } = useShell();
  const [kuyruk, setKuyruk] = useState<KuyrukOge[]>([]);
  const [paketler, setPaketler] = useState<Paket[]>([]);
  const [gecmis, setGecmis] = useState<Olay[]>([]);
  const [mesgul, setMesgul] = useState("");
  const [secili, setSecili] = useState(0);
  const [retAcik, setRetAcik] = useState(false);
  const [revizeAcik, setRevizeAcik] = useState(false);
  const [revizeNot, setRevizeNot] = useState("");
  const kartRefs = useRef<(HTMLLIElement | null)[]>([]);

  const yenile = useCallback(() => {
    trpc.onay.kuyruk.query({ workspaceId }).then((r) => setKuyruk(r as KuyrukOge[]));
    trpc.onay.paketler.query({ workspaceId }).then((r) => setPaketler(r as Paket[]));
    trpc.onay.gecmis.query({ workspaceId }).then((r) => setGecmis(r as Olay[]));
  }, [workspaceId]);

  useEffect(yenile, [yenile]);

  useEffect(() => {
    if (secili >= kuyruk.length) setSecili(Math.max(0, kuyruk.length - 1));
  }, [kuyruk.length, secili]);

  const islem = useCallback(
    async (anahtar: string, fn: () => Promise<unknown>, basari: string) => {
      setMesgul(anahtar);
      try {
        await fn();
        toast.success(basari);
        yenile();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "The operation failed.");
      } finally {
        setMesgul("");
      }
    },
    [yenile],
  );

  const aktifId = kuyruk[secili]?.id;

  // Klavye kuyruğu: ↑/↓ veya j/k gezinme, A onay, R ret paneli, V revize paneli
  useEffect(() => {
    function tus(e: KeyboardEvent) {
      const hedef = e.target as HTMLElement;
      if (hedef.tagName === "INPUT" || hedef.tagName === "TEXTAREA" || retAcik || revizeAcik) return;
      if (kuyruk.length === 0) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setSecili((s) => Math.min(kuyruk.length - 1, s + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setSecili((s) => Math.max(0, s - 1));
      } else if ((e.key === "a" || e.key === "A") && aktifId) {
        e.preventDefault();
        void islem(`onay-${aktifId}`, () => trpc.onay.onayla.mutate({ workspaceId, icerikId: aktifId }), "Approved.");
      } else if ((e.key === "r" || e.key === "R") && aktifId) {
        e.preventDefault();
        setRetAcik(true);
      } else if ((e.key === "v" || e.key === "V") && aktifId) {
        e.preventDefault();
        setRevizeNot("");
        setRevizeAcik(true);
      }
    }
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [kuyruk.length, aktifId, workspaceId, islem, retAcik, revizeAcik]);

  useEffect(() => {
    kartRefs.current[secili]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [secili]);

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <h1 className="font-display text-2xl mb-3">This module is locked</h1>
        <p className="text-muted-foreground">Approve the Strategy Memory first — the Approval Center guards what leaves the building.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl grid gap-12">
      <section>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
          <div>
            <p className="eyebrow text-muted-foreground mb-1">APPROVAL CENTER</p>
            <h1 className="font-display text-2xl">Single-approval queue</h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono">↑/↓ or j/k navigate · A approve · R reject · V revise</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Every item is decided one by one — no bulk or blind approval. An approval is bound to the exact text you saw;
          any later edit breaks it automatically.
        </p>
        {kuyruk.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            The queue is empty. Items that pass the Auditor in the Execution Studio land here.
          </p>
        ) : (
          <ul className="grid gap-4">
            {kuyruk.map((c, i) => (
              <motion.li
                key={c.id}
                ref={(el) => {
                  kartRefs.current[i] = el;
                }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-xl border bg-card p-5 ${i === secili ? "border-[#ff3500] shadow-[0_0_0_1px_#ff3500]" : "border-border"}`}
                onClick={() => setSecili(i)}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {KANAL_ETIKET[c.kanal] ?? c.kanal} · v{c.surum}
                  </p>
                  <span className="flex items-center gap-2">
                    {c.mod === "simulasyon" && (
                      <span className="rounded-full border border-[#b45309]/50 bg-[#b45309]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#b45309]">
                        Simulation — not live copy
                      </span>
                    )}
                    {c.mod === "llm" && (
                      <span className="rounded-full border border-[#0d6e3f]/40 bg-[#0d6e3f]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0d6e3f]">
                        Live LLM
                      </span>
                    )}
                    <span className="text-xs text-[#b45309] font-semibold">{beklemeYaz(c.kuyrugaGiris)}</span>
                  </span>
                </div>
                <p className="font-semibold mb-1">{c.baslik}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">{c.govde}</p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    disabled={mesgul !== ""}
                    onClick={() => void islem(`onay-${c.id}`, () => trpc.onay.onayla.mutate({ workspaceId, icerikId: c.id }), "Approved.")}
                    className="h-10 px-5 rounded-lg bg-[#0d6e3f] text-white font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                  >
                    Approve (A)
                  </button>
                  <button
                    disabled={mesgul !== ""}
                    onClick={() => {
                      setSecili(i);
                      setRetAcik(true);
                    }}
                    className="h-10 px-4 rounded-lg border border-[#c52a00]/50 text-[#c52a00] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                  >
                    Reject (R)
                  </button>
                  <button
                    disabled={mesgul !== ""}
                    onClick={() => {
                      setSecili(i);
                      setRevizeNot("");
                      setRevizeAcik(true);
                    }}
                    className="h-10 px-4 rounded-lg border border-[#b45309]/50 text-[#b45309] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
                  >
                    Request revision (V)
                  </button>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <h2 className="font-display text-2xl">Publish packages</h2>
          <button
            disabled={mesgul !== ""}
            onClick={() =>
              void islem(
                "paket",
                () => trpc.onay.paketOlustur.mutate({ workspaceId }),
                "Publish package created.",
              )
            }
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            {mesgul === "paket" ? "Checking approvals…" : "Create publish package"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 -mt-3">
          Only items whose approval hash still matches the current text get packaged — anything edited after approval is
          rejected and needs re-approval.
        </p>
        {paketler.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">No packages yet.</p>
        ) : (
          <ul className="grid gap-4">
            {paketler.map((p) => {
              const ogeler = JSON.parse(p.ogeler) as { id: string; kanal: string; baslik: string }[];
              return (
                <li key={p.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <p className="font-mono text-xs font-bold">{p.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {tarihYaz(p.olusturmaZamani)} · by {p.olusturan} · export key {p.disaAktarimAnahtari}
                    </p>
                  </div>
                  <ul className="grid gap-1">
                    {ogeler.map((o) => (
                      <li key={o.id} className="text-sm">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">
                          {KANAL_ETIKET[o.kanal] ?? o.kanal}
                        </span>
                        {o.baslik}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-6">Decision history</h2>
        {gecmis.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">No decisions yet.</p>
        ) : (
          <ul className="grid gap-2">
            {gecmis.map((o) => (
              <li key={o.id} className="rounded-lg border border-border bg-card px-4 py-3 flex items-baseline gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground shrink-0">{tarihYaz(o.zaman)}</span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest shrink-0 ${
                    o.eylem === "onay" || o.eylem === "paketlendi"
                      ? "text-[#0d6e3f]"
                      : o.eylem === "red"
                        ? "text-[#c52a00]"
                        : "text-[#b45309]"
                  }`}
                >
                  {EYLEM_AD[o.eylem] ?? o.eylem}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{o.contentItemId}</span>
                {o.redNedeni && (
                  <span className="text-xs text-[#c52a00]">reason: {RED_NEDENLERI.find((r) => r.deger === o.redNedeni)?.ad ?? o.redNedeni}</span>
                )}
                {o.not && <span className="text-sm text-muted-foreground">— {o.not}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {retAcik && aktifId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRetAcik(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-1">Reject — pick a reason</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The reason is recorded in the decision history; the writer sees it as feedback.
            </p>
            <div className="grid gap-2">
              {RED_NEDENLERI.map((r) => (
                <button
                  key={r.deger}
                  disabled={mesgul !== ""}
                  onClick={() =>
                    void islem(
                      `red-${aktifId}`,
                      () => trpc.onay.reddet.mutate({ workspaceId, icerikId: aktifId, redNedeni: r.deger }),
                      "Rejected.",
                    ).then(() => setRetAcik(false))
                  }
                  className="h-11 px-4 rounded-lg border border-border text-left text-sm font-semibold hover:border-[#c52a00]/60 hover:text-[#c52a00] transition-colors disabled:opacity-50"
                >
                  {r.ad}
                </button>
              ))}
            </div>
            <button onClick={() => setRetAcik(false)} className="mt-4 h-10 px-4 rounded-lg border border-border text-sm font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {revizeAcik && aktifId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRevizeAcik(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-1">Request revision</h3>
            <p className="text-sm text-muted-foreground mb-4">A note is required — it tells the writer exactly what to change.</p>
            <textarea
              rows={4}
              value={revizeNot}
              onChange={(e) => setRevizeNot(e.target.value)}
              placeholder="What should change?"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRevizeAcik(false)} className="h-10 px-4 rounded-lg border border-border text-sm font-semibold">
                Cancel
              </button>
              <button
                disabled={mesgul !== "" || revizeNot.trim().length < 3}
                onClick={() =>
                  void islem(
                    `revize-${aktifId}`,
                    () => trpc.onay.revizeIste.mutate({ workspaceId, icerikId: aktifId, not: revizeNot.trim() }),
                    "Revision requested.",
                  ).then(() => setRevizeAcik(false))
                }
                className="h-10 px-5 rounded-lg bg-[#b45309] text-white font-bold text-sm transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

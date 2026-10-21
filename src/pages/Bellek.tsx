import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { tarihYaz } from "../lib/format";

interface BellekKayit {
  hikaye: string;
  konumlandirma: string;
  hedefKitle: string;
  yasakliIfadeler: string;
  onayDurumu: string;
  guncelleyen: string;
  guncellemeZamani: number;
  taramaOzeti: string;
}

export default function Bellek() {
  const { workspaceId, bellekOnayli, yenile } = useShell();
  const [kayit, setKayit] = useState<BellekKayit | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hikaye, setHikaye] = useState("");
  const [konumlandirma, setKonumlandirma] = useState("");
  const [hedefKitle, setHedefKitle] = useState("");
  const [yasakli, setYasakli] = useState("");
  const [mesgul, setMesgul] = useState(false);

  useEffect(() => {
    trpc.bellek.get
      .query({ workspaceId })
      .then((b) => {
        setKayit(b as BellekKayit | null);
        if (b) {
          setHikaye(b.hikaye);
          setKonumlandirma(b.konumlandirma);
          setHedefKitle(b.hedefKitle);
          try {
            setYasakli((JSON.parse(b.yasakliIfadeler) as string[]).join("\n"));
          } catch {
            setYasakli("");
          }
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load memory."))
      .finally(() => setYukleniyor(false));
  }, [workspaceId]);

  async function kaydet() {
    setMesgul(true);
    try {
      await trpc.bellek.guncelle.mutate({
        workspaceId,
        hikaye,
        konumlandirma,
        hedefKitle,
        yasakliIfadeler: yasakli.split("\n").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Memory saved.");
      yenile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setMesgul(false);
    }
  }

  async function onayla() {
    setMesgul(true);
    try {
      await kaydetSessiz();
      await trpc.bellek.onayla.mutate({ workspaceId });
      toast.success("Strategy Memory approved. Module locks are open.");
      yenile();
      setKayit((k) => (k ? { ...k, onayDurumu: "onaylandi" } : k));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed.");
    } finally {
      setMesgul(false);
    }
  }

  async function kaydetSessiz() {
    await trpc.bellek.guncelle.mutate({
      workspaceId,
      hikaye,
      konumlandirma,
      hedefKitle,
      yasakliIfadeler: yasakli.split("\n").map((s) => s.trim()).filter(Boolean),
    });
  }

  if (yukleniyor) return <p className="text-muted-foreground">Loading…</p>;

  if (!kayit) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <p className="eyebrow text-muted-foreground mb-3">STRATEGY MEMORY</p>
        <h1 className="font-display text-2xl mb-3">No memory draft yet</h1>
        <p className="text-muted-foreground mb-6">
          Memory is the single strategy source behind everything the agents produce. The setup
          wizard scans the site and produces a draft; you edit and approve it.
        </p>
        <Link
          to="/app/yeni"
          className="inline-flex h-11 px-5 items-center rounded-lg bg-[#ff3500] text-[#181818] font-bold transition-transform duration-200 active:scale-[0.97]"
        >
          Start the setup wizard
        </Link>
      </div>
    );
  }

  const alan =
    "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base leading-relaxed";

  return (
    <div className="max-w-3xl">
      <div className="flex items-end justify-between gap-4 mb-2 flex-wrap">
        <div>
          <p className="eyebrow text-muted-foreground mb-1">STRATEGY MEMORY</p>
          <h1 className="font-display text-2xl">The single strategy source</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Last update: {kayit.guncelleyen || "—"} · {tarihYaz(kayit.guncellemeZamani)}
        </p>
      </div>
      {kayit.taramaOzeti && (
        <p className="text-sm text-muted-foreground mb-6">{kayit.taramaOzeti}</p>
      )}

      <div className="grid gap-5">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Product story</span>
          <textarea rows={4} value={hikaye} onChange={(e) => setHikaye(e.target.value)} className={alan} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Positioning</span>
          <textarea rows={3} value={konumlandirma} onChange={(e) => setKonumlandirma(e.target.value)} className={alan} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Target audience</span>
          <textarea rows={2} value={hedefKitle} onChange={(e) => setHedefKitle(e.target.value)} className={alan} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Banned phrases <span className="font-normal text-muted-foreground">(one phrase per line — the Auditor blocks these)</span></span>
          <textarea rows={4} value={yasakli} onChange={(e) => setYasakli(e.target.value)} className={alan} />
        </label>
      </div>

      <div className="flex gap-3 mt-8 flex-wrap">
        <button
          onClick={() => void kaydet()}
          disabled={mesgul}
          className="h-11 px-5 rounded-lg border border-[#181818] font-semibold transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
        >
          Save
        </button>
        {!bellekOnayli && (
          <button
            onClick={() => void onayla()}
            disabled={mesgul}
            className="h-11 px-5 rounded-lg bg-[#ff3500] text-[#181818] font-bold transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            Approve memory and unlock modules
          </button>
        )}
      </div>

      {bellekOnayli && (
        <p className="mt-6 rounded-lg border border-[#0d6e3f]/30 bg-[#0d6e3f]/5 text-[#0d6e3f] px-4 py-3 text-sm">
          Memory approved. The Evidence Engine, Execution Studio, and Approval Center work against this memory;
          every change you make also updates the Auditor's filter rules.
        </p>
      )}
    </div>
  );
}

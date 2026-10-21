import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { trpc } from "../lib/trpc";
import { oturumZorla } from "../lib/auth";

interface WorkspaceSatir {
  id: string;
  musteriAdi: string;
  sektor: string;
  urunUrl: string;
  bellekDurumu: string;
}

export default function WorkspaceList() {
  const [liste, setListe] = useState<WorkspaceSatir[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void oturumZorla().then((k) => {
      if (!k) return;
      trpc.workspaces.list
      .query()
      .then((r) => setListe(r as WorkspaceSatir[]))
      .catch((e) => setHata(e instanceof Error ? e.message : "Liste yüklenemedi."));
    });
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="eyebrow text-foreground">KONUM</Link>
          <Link to="/app/konsol" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Ajans Konsolu
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="eyebrow text-muted-foreground mb-2">ÇALIŞMA ALANLARI</p>
            <h1 className="font-display text-3xl">Müşteri çalışma alanların</h1>
          </div>
          <button
            onClick={() => navigate("/app/yeni")}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold transition-transform duration-200 active:scale-[0.97] hover:bg-black"
          >
            Yeni müşteri ekle
          </button>
        </div>

        {hata && (
          <p role="alert" className="rounded-lg border border-[#c52a00]/40 bg-[#c52a00]/5 text-[#c52a00] px-4 py-3">
            {hata}
          </p>
        )}

        {!liste && !hata && <p className="text-muted-foreground">Yükleniyor…</p>}

        {liste && liste.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <h2 className="font-display text-xl mb-2">Henüz çalışma alanı yok</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Her müşteri için ayrı bir çalışma alanı açılır: strateji belleği, kanıtlar ve
              onay kuyruğu müşteri bazında tutulur.
            </p>
            <button
              onClick={() => navigate("/app/yeni")}
              className="h-11 px-5 rounded-lg bg-[#ff3500] text-[#181818] font-bold transition-transform duration-200 active:scale-[0.97]"
            >
              İlk çalışma alanını aç
            </button>
          </div>
        )}

        <ul className="grid gap-4">
          {liste?.map((ws, i) => (
            <motion.li
              key={ws.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/app/${ws.id}/bellek`}
                className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-lg">{ws.musteriAdi}</h2>
                    <p className="text-sm text-muted-foreground">
                      {ws.sektor} · {ws.urunUrl}
                    </p>
                  </div>
                  <span
                    className={
                      ws.bellekDurumu === "onaylandi"
                        ? "text-xs font-bold uppercase tracking-widest text-[#0d6e3f]"
                        : "text-xs font-bold uppercase tracking-widest text-[#c52a00]"
                    }
                  >
                    {ws.bellekDurumu === "onaylandi" ? "Bellek onaylı" : "Kurulum bekliyor"}
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { trpc } from "../lib/trpc";
import { oturumZorla } from "../lib/auth";

interface WorkspaceSatir {
  id: string;
  musteriAdi: string;
  sektor: string;
  bellekDurumu: string;
}

export default function Konsol() {
  const [liste, setListe] = useState<WorkspaceSatir[]>([]);

  useEffect(() => {
    void oturumZorla().then((k) => {
      if (!k) return;
      trpc.workspaces.list.query().then((r) => setListe(r as WorkspaceSatir[]));
    });
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="eyebrow text-foreground">KONUM</Link>
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Workspaces
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <p className="eyebrow text-muted-foreground mb-2">AGENCY CONSOLE</p>
        <h1 className="font-display text-3xl mb-4">All your clients on one screen</h1>

        <div className="rounded-xl border border-border bg-card overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-[#efefe4]/60">
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Sector</th>
                <th className="px-4 py-3 font-semibold">Memory</th>
                <th className="px-4 py-3 font-semibold">Pending approvals</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((ws) => (
                <tr key={ws.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <Link to={`/app/${ws.id}/bellek`} className="font-medium underline-offset-2 hover:underline">
                      {ws.musteriAdi}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ws.sektor}</td>
                  <td className="px-4 py-3">
                    {ws.bellekDurumu === "onaylandi" ? (
                      <span className="text-[#0d6e3f] font-semibold">Approved</span>
                    ) : (
                      <span className="text-[#c52a00] font-semibold">Setup pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">— (in Phase 3)</td>
                </tr>
              ))}
              {liste.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No clients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <section>
          <h2 className="font-display text-xl mb-3">White-label settings</h2>
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <strong>In scope for Phase 4.</strong> Logo, colors, and domain mapping will be managed here;
            you&apos;ll open the console to your clients under your own brand. We don&apos;t add fake settings forms —
            nothing unwired is shown as "ready".
          </p>
        </section>
      </main>
    </div>
  );
}

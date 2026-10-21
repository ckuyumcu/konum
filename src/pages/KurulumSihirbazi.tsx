import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { trpc } from "../lib/trpc";
import { oturumZorla } from "../lib/auth";

type Adim = "bilgi" | "tarama" | "taslak";

interface TaramaSonucu {
  title: string;
  metin: string;
  robotsIzni: boolean;
  not?: string;
}

interface Taslak {
  hikaye: string;
  konumlandirma: string;
  hedefKitle: string;
  yasakliIfadeler: string[];
}

export default function KurulumSihirbazi() {
  const navigate = useNavigate();
  const [adim, setAdim] = useState<Adim>("bilgi");
  const [musteriAdi, setMusteriAdi] = useState("");
  const [sektor, setSektor] = useState("");
  const [urunUrl, setUrunUrl] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [tarama, setTarama] = useState<TaramaSonucu | null>(null);
  const [taslak, setTaslak] = useState<Taslak | null>(null);
  const [mod, setMod] = useState<string>("");
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    void oturumZorla();
  }, []);

  async function calistir(fn: () => Promise<void>) {
    setMesgul(true);
    setHata(null);
    try {
      await fn();
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setMesgul(false);
    }
  }

  const adimGostergeci = (
    <ol className="flex gap-2 mb-10" aria-label="Kurulum adımları">
      {[
        ["bilgi", "1 · Müşteri bilgisi"],
        ["tarama", "2 · Site taraması"],
        ["taslak", "3 · Bellek taslağı"],
      ].map(([key, label]) => (
        <li
          key={key}
          className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
            adim === key
              ? "border-[#181818] bg-[#181818] text-[#fcfcf9]"
              : "border-border text-muted-foreground"
          }`}
        >
          {label}
        </li>
      ))}
    </ol>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Link to="/app" className="eyebrow text-foreground">KONUM</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {adimGostergeci}

        {hata && (
          <p role="alert" className="mb-6 rounded-lg border border-[#c52a00]/40 bg-[#c52a00]/5 text-[#c52a00] px-4 py-3">
            {hata}
          </p>
        )}

        {adim === "bilgi" && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="font-display text-3xl mb-2">Yeni müşteri çalışma alanı</h1>
            <p className="text-muted-foreground mb-8">
              Ürün URL'si verilir; Araştırmacı siteyi tarar, Stratejist Yardımcısı bir bellek
              taslağı çıkarır. Son söz her zaman sende: taslak onaylanmadan hiçbir modül açılmaz.
            </p>

            <form
              className="grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                void calistir(async () => {
                  const ws = await trpc.workspaces.create.mutate({ musteriAdi, sektor, urunUrl });
                  setWorkspaceId(ws.id);
                  setAdim("tarama");
                  const t = await trpc.bellek.tara.mutate({ workspaceId: ws.id });
                  setTarama(t);
                });
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Müşteri adı</span>
                <input
                  required
                  minLength={2}
                  value={musteriAdi}
                  onChange={(e) => setMusteriAdi(e.target.value)}
                  className="h-11 rounded-lg border border-input bg-card px-3 text-base"
                  placeholder="Örn. Nova Kozmetik"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Sektör</span>
                <input
                  required
                  minLength={2}
                  value={sektor}
                  onChange={(e) => setSektor(e.target.value)}
                  className="h-11 rounded-lg border border-input bg-card px-3 text-base"
                  placeholder="Örn. E-ticaret — kişisel bakım"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold">Ürün URL'si</span>
                <input
                  required
                  type="text"
                  inputMode="url"
                  value={urunUrl}
                  onChange={(e) => setUrunUrl(e.target.value)}
                  className="h-11 rounded-lg border border-input bg-card px-3 text-base"
                  placeholder="https://ornek-urun.com"
                />
              </label>
              <button
                type="submit"
                disabled={mesgul}
                className="h-12 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-lg transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
              >
                {mesgul ? "Site taranıyor…" : "Kaydet ve siteyi tara"}
              </button>
            </form>
          </motion.section>
        )}

        {adim === "tarama" && tarama && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 5e-1, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="font-display text-3xl mb-2">Tarama sonucu</h1>
            <p className="text-muted-foreground mb-6">
              Araştırmacı, <strong>{tarama.title || urunUrl}</strong> adresinden{" "}
              {tarama.metin.length.toLocaleString("tr-TR")} karakter metin çıkardı.
              {!tarama.robotsIzni && " robots.txt taramaya izin vermiyor; sayfa taranmadı."}
            </p>
            {tarama.not && (
              <p className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                Not: {tarama.not}
              </p>
            )}
            <div className="rounded-xl border border-border bg-card p-5 mb-8 max-h-64 overflow-auto">
              <p className="text-sm whitespace-pre-wrap text-foreground/80">{tarama.metin.slice(0, 1500)}{tarama.metin.length > 1500 && "…"}</p>
            </div>
            <button
              disabled={mesgul || tarama.metin.length < 100}
              onClick={() =>
                void calistir(async () => {
                  const r = await trpc.bellek.taslakUret.mutate({
                    workspaceId,
                    taramaMetni: tarama.metin,
                    taramaBaslik: tarama.title,
                  });
                  setTaslak(r.taslak);
                  setMod(r.mod);
                  setAdim("taslak");
                })
              }
              className="h-12 px-6 rounded-lg bg-[#ff3500] text-[#181818] font-bold text-lg transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
            >
              {mesgul ? "Taslak üretiliyor…" : "Bellek taslağını üret"}
            </button>
            {tarama.metin.length < 100 && (
              <p className="mt-3 text-sm text-[#c52a00]">
                Yetersiz metin çıkarıldı; taslak üretilemez. URL'yi kontrol edip yeniden dene.
              </p>
            )}
          </motion.section>
        )}

        {adim === "taslak" && taslak && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <h1 className="font-display text-3xl mb-2">Strateji Belleği taslağı hazır</h1>
            <p className="text-muted-foreground mb-2">
              Taslak, Stratejist Yardımcısı tarafından üretildi ve Denetçi süzgecinden geçti.
            </p>
            {mod === "simulasyon" && (
              <p className="mb-6 inline-block text-xs font-bold uppercase tracking-widest text-[#c52a00] border border-[#c52a00]/40 rounded-full px-3 py-1">
                Simülasyon çıktısı — LLM bağlantısı kurulunca gerçek üretim yapılır
              </p>
            )}
            <div className="rounded-xl border border-border bg-card p-6 grid gap-5 mb-8">
              <div>
                <p className="eyebrow text-muted-foreground mb-1">HİKÂYE</p>
                <p className="whitespace-pre-wrap">{taslak.hikaye}</p>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground mb-1">KONUMLANDIRMA</p>
                <p className="whitespace-pre-wrap">{taslak.konumlandirma}</p>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground mb-1">HEDEF KİTLE</p>
                <p className="whitespace-pre-wrap">{taslak.hedefKitle}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Bu bir taslak. Strateji Belleği ekranında düzenleyip onayladığında Kanıt Motoru
              ve diğer modüller açılır.
            </p>
            <button
              onClick={() => navigate(`/app/${workspaceId}/bellek`)}
              className="h-12 px-6 rounded-lg bg-[#181818] text-[#fcfcf9] font-bold transition-transform duration-200 active:scale-[0.97]"
            >
              Taslağı düzenlemeye git
            </button>
          </motion.section>
        )}
      </main>
    </div>
  );
}

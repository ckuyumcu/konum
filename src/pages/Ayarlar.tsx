import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useShell } from "../app/AppShell";
import { trpc } from "../lib/trpc";
import { AJAN_ADLARI, tarihYaz } from "../lib/format";

interface LlmDurum {
  saglayici: string;
  model: string;
  anahtarKaynagi: "env" | "dosya" | "yok";
  aktifMod: "llm" | "simulasyon";
}

// LLM anahtarı bölümü — yalnız platform sahibine görünür (sunucuda da zorlanır).
// Anahtar yazıldıktan sonra bir daha gösterilmez; istemciye asla dönmez.
function LlmAyar() {
  const [durum, setDurum] = useState<LlmDurum | null>(null);
  const [anahtar, setAnahtar] = useState("");
  const [mesgul, setMesgul] = useState(false);

  const yenile = () => {
    trpc.ayarlar.llmDurumu
      .query()
      .then((d) => setDurum(d as LlmDurum))
      .catch(() => setDurum(null));
  };
  useEffect(yenile, []);

  if (!durum) return null;

  return (
    <section>
      <h2 className="font-display text-2xl mb-4">LLM bağlantısı</h2>
      <div className="rounded-xl border border-border bg-card p-5 grid gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
          <p>
            Sağlayıcı: <strong>{durum.saglayici}</strong> · Model: <strong>{durum.model}</strong>
          </p>
          <span
            className={`text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
              durum.aktifMod === "llm"
                ? "text-[#0d6e3f] border-[#0d6e3f]/40"
                : "text-[#c52a00] border-[#c52a00]/40"
            }`}
          >
            {durum.aktifMod === "llm" ? "Gerçek çağrı aktif" : "Simülasyon modu"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Anahtar durumu:{" "}
          {durum.anahtarKaynagi === "env"
            ? ".env dosyasından tanımlı"
            : durum.anahtarKaynagi === "dosya"
              ? "Gizli dosyada tanımlı (buradan girildi)"
              : "Tanımsız — ajanlar simülasyon etiketli taslak üretiyor."}
        </p>
        <form
          className="flex gap-3 flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            setMesgul(true);
            trpc.ayarlar.llmAnahtariKaydet
              .mutate({ anahtar })
              .then(() => {
                setAnahtar("");
                toast.success("Anahtar kaydedildi; bundan sonra gösterilmez.");
                yenile();
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Kaydedilemedi."))
              .finally(() => setMesgul(false));
          }}
        >
          <input
            type="password"
            value={anahtar}
            onChange={(e) => setAnahtar(e.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            className="flex-1 min-w-56 h-11 rounded-lg border border-input bg-card px-3 text-base"
          />
          <button
            type="submit"
            disabled={mesgul || anahtar.trim().length < 10}
            className="h-11 px-5 rounded-lg bg-[#181818] text-[#fcfcf9] font-semibold transition-transform duration-200 active:scale-[0.97] disabled:opacity-50"
          >
            Anahtarı kaydet
          </button>
          {durum.anahtarKaynagi === "dosya" && (
            <button
              type="button"
              onClick={() => {
                setMesgul(true);
                trpc.ayarlar.llmAnahtariKaldir
                  .mutate()
                  .then(() => {
                    toast.success("Anahtar silindi.");
                    yenile();
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Silinemedi."))
                  .finally(() => setMesgul(false));
              }}
              className="h-11 px-5 rounded-lg border border-[#c52a00] text-[#c52a00] font-semibold transition-transform duration-200 active:scale-[0.97]"
            >
              Anahtarı kaldır
            </button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          Anahtar sunucuda proje dışı bir gizli dosyaya yazılır (~/.konum), git'e girmez, istemciye
          asla dönmez. Alternatif: proje kökündeki .env dosyasına ANTHROPIC_API_KEY eklenebilir.
        </p>
      </div>
    </section>
  );
}

interface Entegrasyon {
  ad: string;
  durum: string;
  aciklama: string;
}

interface LogSatiri {
  id: string;
  ajan: string;
  girdiOzeti: string;
  ciktiOzeti: string;
  denetciKarari: string;
  mod: string;
  zaman: number;
}

export default function Ayarlar() {
  const { workspaceId } = useShell();
  const [entegrasyonlar, setEntegrasyonlar] = useState<Entegrasyon[]>([]);
  const [loglar, setLoglar] = useState<LogSatiri[]>([]);
  const [platformSahibi, setPlatformSahibi] = useState(false);

  useEffect(() => {
    trpc.ayarlar.entegrasyonlar.query().then((e) => setEntegrasyonlar(e as Entegrasyon[]));
    trpc.ajanlar.logs.query({ workspaceId }).then((l) => setLoglar(l as LogSatiri[]));
    trpc.auth.me.query().then((me) => setPlatformSahibi(Boolean(me?.platformSahibi)));
  }, [workspaceId]);

  return (
    <div className="max-w-3xl grid gap-12">
      {platformSahibi && <LlmAyar />}
      <section>
        <p className="eyebrow text-muted-foreground mb-1">AYARLAR</p>
        <h1 className="font-display text-2xl mb-6">Entegrasyonlar</h1>
        <ul className="grid gap-3">
          {entegrasyonlar.map((e) => (
            <li key={e.ad} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{e.ad}</p>
                <p className="text-sm text-muted-foreground">{e.aciklama}</p>
              </div>
              <span
                className={`shrink-0 text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1 border ${
                  e.durum === "aktif"
                    ? "text-[#0d6e3f] border-[#0d6e3f]/40"
                    : "text-muted-foreground border-border"
                }`}
              >
                {e.durum === "aktif" ? "Aktif" : "Planlandı"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          API'si bağlanmamış hiçbir entegrasyon "bağlandı" gösterilmez.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Veri işleme</h2>
        <div className="rounded-xl border border-border bg-card p-5 text-sm grid gap-3">
          <p>
            Yüklediğin müşteri metinleri (yorum, SSS, destek kayıtları) LLM'e gönderilmeden önce
            kişisel veriler maskelenir: ad-soyad, e-posta ve telefon numaraları anonimleştirilir.
          </p>
          <p>
            Her ajan çağrısı aşağıdaki günlüğe yazılır; onay ve ret işlemleri de kayıt altındadır.
            Bu şeffaflık, müşterilerine gösterebileceğin bir sorumluluk sınırıdır.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">Ajan günlüğü</h2>
        {loglar.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-border bg-card p-5">
            Henüz ajan kaydı yok. Kurulum sihirbazını çalıştırdığında Araştırmacı, Stratejist ve
            Denetçi kayıtları burada görünecek.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold">Zaman</th>
                  <th className="px-4 py-3 font-semibold">Ajan</th>
                  <th className="px-4 py-3 font-semibold">Girdi</th>
                  <th className="px-4 py-3 font-semibold">Çıktı</th>
                  <th className="px-4 py-3 font-semibold">Denetçi</th>
                  <th className="px-4 py-3 font-semibold">Mod</th>
                </tr>
              </thead>
              <tbody>
                {loglar.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 align-top last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{tarihYaz(l.zaman)}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{AJAN_ADLARI[l.ajan] ?? l.ajan}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-56">{l.girdiOzeti}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-56">{l.ciktiOzeti}</td>
                    <td className="px-4 py-3">
                      {l.denetciKarari === "uygulanamaz" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : l.denetciKarari.startsWith("reddedildi") ? (
                        <span className="text-[#c52a00]">{l.denetciKarari}</span>
                      ) : (
                        <span className="text-[#0d6e3f]">Geçti</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.mod === "simulasyon" ? (
                        <span className="text-[#c52a00] font-semibold">Simülasyon</span>
                      ) : l.mod === "llm" ? (
                        <span className="text-[#0d6e3f] font-semibold">LLM</span>
                      ) : (
                        <span className="text-muted-foreground">{l.mod}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

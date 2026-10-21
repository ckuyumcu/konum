import { Link } from "react-router";
import { useShell } from "../app/AppShell";

const ACIKLAMALAR: Record<string, { ad: string; asama: number; ne: string }> = {
  kanit: {
    ad: "Kanıt Motoru",
    asama: 2,
    ne: "Stratejist Yardımcısı 2–3 mesaj hipotezi önerir; sen birini seçersin, Test Tasarımcısı küçük bütçeli bir A/B test planı kurar. Kazanan varyant kanıt dosyasına işlenir.",
  },
  icra: {
    ad: "İcra Stüdyosu",
    asama: 3,
    ne: "Kanıtlanmış mesajdan kanal varyasyonları üretilir: Instagram metni, Meta Ads birincil metin, Google Ads başlıkları, e-posta konusu ve gövdesi.",
  },
  onay: {
    ad: "Onay Merkezi",
    asama: 3,
    ne: "Tek yayın kapısı. Her öğe için Onayla / Revize iste / Reddet. Toplu onay yoktur — her öğe tekil karar ister.",
  },
  radar: {
    ad: "Sinyal Radarı",
    asama: 4,
    ne: "Analist ajan haftalık 'ne öğrendik' özeti çıkarır; kanıt dosyası eskirse veya rakip mesaj haritası değişirse alarm üretir.",
  },
};

export default function KilitliModul({ modul }: { modul: string }) {
  const { bellekOnayli } = useShell();
  const bilgi = ACIKLAMALAR[modul];

  if (!bilgi) return <p className="text-muted-foreground">Modül bulunamadı.</p>;

  if (!bellekOnayli) {
    return (
      <div className="max-w-xl rounded-xl border border-border bg-card p-10 text-center mx-auto mt-12">
        <svg className="mx-auto mb-4 text-muted-foreground" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <p className="eyebrow text-muted-foreground mb-2">{bilgi.ad.toLocaleUpperCase("tr")}</p>
        <h1 className="font-display text-2xl mb-3">Bu modül kilitli</h1>
        <p className="text-muted-foreground mb-6">
          {bilgi.ad}, Strateji Belleği onaylanmadan çalışmaz — ajanların dayanacağı tek strateji
          kaynağı bellektir. Önce belleği gözden geçirip onayla.
        </p>
        <Link
          to="../bellek"
          className="inline-flex h-11 px-5 items-center rounded-lg bg-[#ff3500] text-[#181818] font-bold transition-transform duration-200 active:scale-[0.97]"
        >
          Strateji Belleği'ne git
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-muted-foreground mb-2">{bilgi.ad.toLocaleUpperCase("tr")}</p>
      <h1 className="font-display text-2xl mb-4">{bilgi.ad}</h1>
      <p className="text-muted-foreground mb-6">{bilgi.ne}</p>
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <strong>Aşama {bilgi.asama} kapsamında.</strong> Bellek onayın tamam; bu modülün inşası
        sıradaki aşamada tamamlanacak. Bu ekranda sahte buton veya demo veri yok.
      </p>
    </div>
  );
}

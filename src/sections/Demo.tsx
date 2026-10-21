import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

type Variant = { label: string; text: string; ctr: number; note: string }
type Product = { id: string; name: string; a: Variant; b: Variant; why: string }

const products: Product[] = [
  {
    id: 'kahve',
    name: 'Butik kahve aboneliği',
    a: {
      label: 'A · Jenerik AI tonu',
      text: 'Kaliteli kahve kapına gelsin! Taze, lezzetli, uygun fiyatlı. Hemen dene!',
      ctr: 1.8,
      note: 'Herkesin yazabileceği cümleler. İddia yok, kanıt yok, hikâye yok.',
    },
    b: {
      label: 'B · Kanıt-odaklı',
      text: 'Paketinin üstünde kavrum tarihi var: 12 gün önce kavruldu, dün kargoya verildi.',
      ctr: 4.6,
      note: 'Somut, doğrulanabilir, hikâyesi olan iddia.',
    },
    why: 'Varyant B spesifik bir kanıt sunuyor: kavrum tarihi. "Kaliteli" bir iddiadır; "12 gün önce kavruldu" bir kanıttır. Kanıt Motoru tam olarak bu farkı arar.',
  },
  {
    id: 'saas',
    name: 'SaaS randevu aracı',
    a: {
      label: 'A · Jenerik AI tonu',
      text: 'Randevularını kolayca yönet! Modern arayüz, hızlı kurulum. Ücretsiz dene!',
      ctr: 2.1,
      note: 'Özellik listesi, fayda cümlesi yok.',
    },
    b: {
      label: 'B · Kanıt-odaklı',
      text: 'Gelmeyen müşteri, boşa giden saat. Hatırlatmalar, müşterinin cevap verdiği kanaldan gider.',
      ctr: 4.1,
      note: 'Acıyı adıyla söylüyor, çözümü davranışa bağlıyor.',
    },
    why: 'Varyant B problemi müşterinin diliyle anlatıyor ("boşa giden saat"). Bu dil, müşteri görüşmelerinden madencilikle çıkar — Kanıt Motoru bunu otomatik tarar.',
  },
  {
    id: 'seramik',
    name: 'El yapımı seramik',
    a: {
      label: 'A · Jenerik AI tonu',
      text: 'El yapımı seramiklerle evine zarafet kat! Özenle üretildi, şimdi satışta.',
      ctr: 1.4,
      note: '"Zarafet" ölçülemez; her seramikçi aynısını söylüyor.',
    },
    b: {
      label: 'B · Kanıt-odaklı',
      text: 'Bu desen tek fırından çıktı: 40 adet üretildi, 11 tanesi kaldı. Sıradaki fırın 3 hafta sonra.',
      ctr: 5.2,
      note: 'Kıtlık + takvim + somut sayı: koleksiyon hissi.',
    },
    why: 'Varyant B satın alma kararını bir anlatıya oturtuyor. Aynı ürün, aynı fiyat — fark, mesajın taşıdığı kanıt.',
  },
]

export default function Demo() {
  const [selected, setSelected] = useState<Product>(products[0])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const winner = useMemo(() => (selected.b.ctr > selected.a.ctr ? 'B' : 'A'), [selected])

  const start = () => {
    setDone(false)
    setRunning(true)
    window.setTimeout(() => {
      setRunning(false)
      setDone(true)
    }, 1900)
  }

  const pick = (p: Product) => {
    setSelected(p)
    setDone(false)
    setRunning(false)
  }

  const barWidth = (ctr: number) => `${Math.round((ctr / 6) * 100)}%`

  return (
    <section id="demo" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          Canlı demo · Kanıt Motoru
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[22ch]"
        >
          Hangi mesaj kazanır? Tahmin etme — <span className="hl">test et.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-5 max-w-[66ch] text-lg text-foreground/70"
        >
          Aşağıdaki simülasyon, Kanıt Motoru&apos;nun mantığını gösterir: iki mesaj varyantı küçük bütçeli bir teste
          girer, kazanan kanıt dosyasına işlenir.{' '}
          <span className="text-sm text-foreground/50">(Gördüğünüz sayılar örnek/simülasyon verisidir, gerçek kampanya sonucu değildir.)</span>
        </motion.p>

        <div className="mt-10 flex flex-wrap gap-3" role="tablist" aria-label="Ürün seçimi">
          {products.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={selected.id === p.id}
              onClick={() => pick(p)}
              className={`rounded-full px-5 py-2.5 text-sm font-bold border-2 transition-all duration-150 cursor-pointer active:scale-[0.97] ${
                selected.id === p.id
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-foreground/20 hover:border-foreground bg-transparent'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-5">
          {[selected.a, selected.b].map((v, idx) => (
            <motion.div
              key={selected.id + idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: idx * 0.06 }}
              className="rounded-xl border border-border bg-white/60 p-6"
            >
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">{v.label}</p>
              <p className="font-display font-bold text-xl leading-snug min-h-[4.5rem]">&ldquo;{v.text}&rdquo;</p>
              <p className="mt-3 text-sm text-foreground/60">{v.note}</p>
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="uppercase tracking-widest text-foreground/50">Tıklama oranı</span>
                  <span className="font-mono">{(done || running) && `%${v.ctr.toFixed(1).replace('.', ',')}`}</span>
                </div>
                <div className="h-3 rounded-full bg-[#efefe4] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${idx === 1 ? 'bg-[#ff3500]' : 'bg-foreground/35'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: done || running ? barWidth(v.ctr) : '0%' }}
                    transition={{ duration: 1.5, ease: easeOut }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={start}
            disabled={running}
            className="inline-flex items-center rounded-md bg-foreground text-background px-6 py-3 text-base font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {running ? 'Test çalışıyor…' : done ? 'Testi tekrar çalıştır' : 'Testi çalıştır'}
          </button>
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="flex-1 min-w-[260px] rounded-lg border-l-4 border-[#ff3500] bg-[#fcfcf9] border border-border p-4"
              >
                <p className="font-bold text-sm">
                  Varyant {winner} kazandı → kanıt dosyasına işlendi → İcra Stüdyosu 3 kanal varyasyonu hazırlıyor
                  <span className="cursor-blink text-[#c52a00]" aria-hidden="true"> ▌</span>
                </p>
                <p className="mt-1.5 text-sm text-foreground/70">{selected.why}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

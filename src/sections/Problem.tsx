import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const rows = [
  {
    n: '01',
    title: 'Ürün yapmak ucuzladı, dikkat pahalılaştı.',
    body: 'Aynı işi yapan onlarca benzer ürün var. Kullanıcı seçmekte zorlanıyor; mesele artık "yapabilir miyiz?" değil, "insanlar neden bizimkini seçsin?".',
  },
  {
    n: '02',
    title: 'AI herkese aynı ortalama kampanyayı öneriyor.',
    body: 'Araçlar metni yazıyor ama farkı yazmıyor. Farkı yaratan hâlâ hikâye kuran, kitlesini tanıyan, ürünü doğru konumlandıran insan.',
  },
  {
    n: '03',
    title: 'Satışın olmaması ürünün değil, sistemin suçu.',
    body: 'Mesaj, kitle ve kanıt — üçü de tek seferlik işler değil. Pazarlama bir lansman değil, sürekli işletilen bir hattır. Çoğu ekipte o hat yok.',
  },
]

export default function Problem() {
  return (
    <section id="sorun" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="eyebrow text-[#c52a00] mb-4"
            >
              Sorun
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
              className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02]"
            >
              Beş site yaptın.
              <br />
              Satış <span className="hl">yok.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.14 }}
              className="mt-6 text-lg text-foreground/70 max-w-[48ch]"
            >
              Tanıdık geldi mi? Ürün çalışıyor, tasarım iyi — ama kimseye ulaşamıyorsun. Bu bir yazılım sorunu değil,
              bir <strong className="text-foreground">pazarlama operasyonu</strong> sorunu.
            </motion.p>
            <motion.svg
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              width="120"
              height="28"
              viewBox="0 0 120 28"
              className="mt-8"
              aria-hidden="true"
            >
              <path
                d="M4 20 C 24 6, 44 26, 64 12 S 104 22, 116 10"
                fill="none"
                stroke="#ff3500"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </motion.svg>
          </div>
        </div>
        <div className="lg:col-span-7 space-y-0">
          {rows.map((r, i) => (
            <motion.article
              key={r.n}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: i * 0.08 }}
              className="border-t border-border py-9 grid sm:grid-cols-12 gap-4"
            >
              <span className="sm:col-span-2 font-mono text-sm font-bold text-[#c52a00] pt-1">{r.n}</span>
              <div className="sm:col-span-10">
                <h3 className="font-display font-bold text-2xl md:text-[1.7rem] leading-snug mb-3">{r.title}</h3>
                <p className="text-foreground/70 max-w-[58ch]">{r.body}</p>
              </div>
            </motion.article>
          ))}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="border-t border-border pt-9 text-lg font-semibold"
          >
            Kod üretmek kolaylaştıkça dikkat çekmek zorlaşıyor.{' '}
            <span className="text-[#c52a00]">Pazarlamacıların devri başlıyor</span> — onlara layık bir altyapıyla.
          </motion.p>
        </div>
      </div>
    </section>
  )
}

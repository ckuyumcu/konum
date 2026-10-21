import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

// v2 Bölüm 8 (Aşama 1, madde 3): rakip marka adları kaldırıldı; format
// "piyasadaki yaygın yaklaşım → Konum'un farkı". Hiçbir maddede rakip övülmez.
const lessons = [
  {
    from: 'Yaygın yaklaşım: beyaz etiket panolar',
    lesson: 'Çok müşterili konsol, ajansı kahraman yapar.',
    ours: 'Konum, ajansın kendi markasıyla çalışır; platform görünmez, ajans parlar.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Yaygın yaklaşım: tek müşteri veri tabanı',
    lesson: 'Tek doğruluk kaynağı, her çıktıyı besler.',
    ours: 'Bizde bu kaynak Strateji Belleği — işlem kaydı değil, karar belleği.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Yaygın yaklaşım: marka sesi ayarları',
    lesson: 'Marka sesi tanımsızsa AI çıktısı jenerikleşir.',
    ours: 'Yasaklı ifadeler + Denetçi ajan: kuralsız hiçbir metin onaya çıkamaz.',
    span: 'lg:col-span-4',
  },
  {
    from: 'Yaygın yaklaşım: içerik takvimleri',
    lesson: 'Takvim ve kuyruk disiplini, sürekliliğin ta kendisidir.',
    ours: 'İcra Stüdyosu kanıtlanmış mesajı kanallara yayar; ritim ajanın, karar senin.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Yaygın yaklaşım: otonom reklam icrası',
    lesson: 'Otonomi cazip görünür; onaysız bütçe ise risklidir.',
    ours: 'Konum v1\u2019de hiçbir hesapta işlem yapmaz: yayına hazır paket üretir, son dokunuş insandadır.',
    span: 'lg:col-span-6',
  },
  {
    from: 'Yaygın yaklaşım: varyasyon fabrikaları',
    lesson: 'Varyasyon üretmek kolay; hangisinin neden kazandığını bilmek değerli.',
    ours: 'Kanıt Motoru "neden"i testle belgeler — çıktı, dışa aktarılabilir kanıt dosyasıdır.',
    span: 'lg:col-span-12',
  },
]

export default function Teardown() {
  return (
    <section id="teardown" className="py-20 md:py-32 bg-[#efefe4]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          Piyasadan öğrendiklerimiz
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[24ch]"
        >
          Kapalı kodu kimse göremez — ama <span className="hl">oyun kitapları</span> ortada.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
          className="mt-6 max-w-[68ch] text-lg text-foreground/70"
        >
          Pazarlama yazılımı pazarındaki yaygın yaklaşımların kamuya açık ürün sayfalarını, dokümantasyonlarını ve
          fiyat mantıklarını analiz ettik. Kanıtlanmış kalıpları aldık, zayıflıklarını tersine çevirdik — hepsini{' '}
          <strong className="text-foreground">kendi orijinal kodumuzla</strong> yeniden inşa ediyoruz. Kopya yok,
          intihal yok: rekabet analizi ve mühendislik var.
        </motion.p>

        <div className="mt-14 grid lg:grid-cols-12 gap-5">
          {lessons.map((l, i) => (
            <motion.article
              key={l.from}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, ease: easeOut, delay: (i % 3) * 0.08 }}
              className={`${l.span} rounded-xl border border-border bg-[#fcfcf9] p-6 md:p-7 flex flex-col`}
            >
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/45 mb-3">
                {l.from} <span className="text-[#c52a00]">→</span> ders
              </p>
              <h3 className="font-display font-bold text-xl md:text-[1.35rem] leading-snug mb-3">{l.lesson}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed mt-auto pt-2 border-t border-border/70">
                <span className="font-bold text-foreground">Konum&apos;da: </span>
                {l.ours}
              </p>
            </motion.article>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 text-xs text-foreground/50 max-w-[80ch]"
        >
          Not: Yukarıdaki gözlemler kamuya açık ürün bilgilerine dayanır; piyasadaki özellikler değişebilir. Lansman
          öncesi her kart için güncel kaynak doğrulaması yapılacaktır.
        </motion.p>
      </div>
    </section>
  )
}

import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const aiList = [
  'Rakip mesajlarını ve kategori dilini 7/24 tarar',
  'Mesaj hipotezleri ve kanal varyasyonları üretir',
  'Küçük bütçeli A/B testlerini kurar ve işletir',
  'Takvime yayar, performansı ölçer, raporlar',
  'Konumlandırma eskidiğinde alarm verir',
]

const humanList = [
  'Hikâyeyi ve konumlandırmayı kurar',
  'Hipotezi seçer, test bütçesini onaylar',
  'Yayına çıkan her şeyin son onayını verir',
  'Müşteri ilişkisini ve itibarı taşır',
  'Nihai kararın sorumluluğunu üstlenir',
]

export default function Roles() {
  return (
    <section className="py-20 md:py-32 bg-[#ff3500] text-[#fcfcf9]">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut }}
          className="font-display font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-[20ch]"
        >
          Sınır net: ajan işletir, insan karar verir.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.08 }}
          className="mt-5 max-w-[56ch] text-xl font-bold leading-snug"
        >
          Platform senin yerine pazarlamacılık yapmaz; senin kararlarını bütün müşterilerine aynı kalitede uygular.
        </motion.p>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {[
            { title: 'Ajan yapar', items: aiList, dark: true },
            { title: 'İnsan karar verir', items: humanList, dark: false },
          ].map((col, ci) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: ci * 0.1 }}
              className={`rounded-xl p-7 md:p-9 ${
                col.dark ? 'bg-[#181818] text-[#fcfcf9]' : 'bg-[#fcfcf9] text-[#181818]'
              }`}
            >
              <p className={`eyebrow mb-6 ${col.dark ? 'text-[#ff8a66]' : 'text-[#c52a00]'}`}>{col.title}</p>
              <ul className="space-y-4">
                {col.items.map((it, i) => (
                  <li key={it} className="flex gap-3 items-baseline">
                    <span className={`font-mono text-xs font-bold ${col.dark ? 'text-[#ff8a66]' : 'text-[#c52a00]'}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold leading-snug">{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-12 font-display font-bold text-2xl md:text-3xl text-center"
        >
          Hiçbir yayın, onayın olmadan çıkmaz.
        </motion.p>
      </div>
    </section>
  )
}

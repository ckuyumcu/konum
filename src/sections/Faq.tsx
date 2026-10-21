import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const faqs = [
  {
    q: 'Yapay zekâ her şeyi kendi başına mı yapıyor?',
    a: 'Hayır — tasarım gereği yapamaz. Ajanlar rutin işi üstlenir (tarama, varyasyon, yayın, ölçüm, rapor); strateji, hipotez seçimi, bütçe ve yayın onayı insanda kalır. Onay Merkezi olmadan sistemin yayın kapısı yoktur.',
  },
  {
    q: 'Reklam hesaplarım ve verilerim ne oluyor?',
    a: 'Hesaplar sizde kalır. Bu sürümde (v1) platform hiçbir hesabınızda işlem yapmaz ve bütçenize dokunmaz; yayına hazır paket üretir, yayını siz yaparsınız. Reklam hesabı bağlantıları pilot aşamasında açılacak. Müşteri verilerinizde varsayılan anonimleştirme uygulanır; kapsam ve sözleşme seti pilot programda birlikte netleştirilecek.',
  },
  {
    q: 'Bu sayfadaki rakamlar gerçek mi?',
    a: 'Hayır. Demo bölümündeki test sonuçları, Kanıt Motoru mantığını göstermek için üretilmiş simülasyon verisidir ve sayfada açıkça etiketlenmiştir. Gerçek sonuçlar ancak gerçek testlerden gelir — "yetersiz veri" demek de platformun meşru bir çıktısıdır.',
  },
  {
    q: 'Rakip platformlardan farkınız ne?',
    a: 'İcra araçları metalaştı: varyasyon üretmek artık herkesin yapabildiği iş. Bizim çekirdeğimiz Kanıt Motoru — "insanlar neden sizi seçsin?" sorusunun cevabını testle belgeleyip tüm icraya kaynak yapmasıdır. Üstelik beyaz etiket: ajans bunu kendi metodolojisi gibi satar.',
  },
  {
    q: 'Kilitlenme var mı? Verilerimi alabilir miyim?',
    a: 'Kanıt dosyaları ve strateji belgeleri dışa aktarılabilir varlıklardır. Uzman kullanıcının kilitlenmeye alerjisi olduğunu biliyoruz — güven, satışın parçasıdır.',
  },
  {
    q: 'Fiyat ne kadar?',
    a: 'Henüz fiyat listesi yayınlamıyoruz: pilot programdaki ilk 10 ajansla birlikte, gerçek kullanım değerine bakarak belirlenecek. Bilinçli bir tercih — doğrulanmamış rakam yazmıyoruz.',
  },
]

export default function Faq() {
  return (
    <section id="sss" className="py-20 md:py-32 bg-[#efefe4] border-t border-border">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#c52a00] mb-4"
        >
          Sık sorulanlar
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] mb-12"
        >
          Aklında kalanlar
        </motion.h2>
        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, ease: easeOut, delay: i * 0.04 }}
              className="group py-5"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-display font-bold text-lg md:text-xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-200 group-open:rotate-45"
                >
                  <path d="M9 3v12M3 9h12" stroke="#c52a00" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="mt-4 text-foreground/70 max-w-[68ch]">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}

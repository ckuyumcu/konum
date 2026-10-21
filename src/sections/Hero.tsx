import { motion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const agentLines = [
  { agent: 'Araştırmacı', text: '14 rakip mesajı tarandı', color: '#c52a00' },
  { agent: 'Test Tasarımcısı', text: '2 hipotez hazır', color: '#181818' },
  { agent: 'Denetçi', text: '1 varyasyon marka kurallarına takıldı', color: '#181818' },
]

export default function Hero() {
  return (
    <section id="top" className="relative grid-bg pt-28 md:pt-36 pb-16 md:pb-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-6 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="eyebrow text-[#c52a00] mb-5"
            >
              Ajanlarla çalışan sürekli pazarlama işletim sistemi
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.08 }}
              className="font-display font-black text-[13vw] sm:text-6xl lg:text-7xl xl:text-[5.2rem] leading-[0.98]"
            >
              Kodu herkes yazıyor.
              <br />
              Kazanan, <span className="hl">&ldquo;neden ben?&rdquo;</span> sorusunu{' '}
              <em className="not-italic text-[#c52a00]">kanıtlayan</em> olacak.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.2 }}
              className="mt-6 max-w-[62ch] text-lg text-foreground/70"
            >
              Konum; stratejiyi ve hikâyeyi <strong className="text-foreground">sizden</strong>, rutin icrayı{' '}
              <strong className="text-foreground">yapay zekâ ajanlarından</strong> alır. Mesajınızı küçük testlerle
              kanıtlar, kanıtı tüm kanallara yayar — ve hiçbir şey sizin onayınız olmadan yayına çıkmaz.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.32 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="#pilot"
                className="inline-flex items-center rounded-md bg-foreground text-background px-6 py-3.5 text-base font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97]"
              >
                Erken erişime katıl
                <svg width="16" height="16" viewBox="0 0 16 16" className="ml-2" aria-hidden="true">
                  <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#nasil"
                className="inline-flex items-center rounded-md border-2 border-foreground/20 px-6 py-3 text-base font-bold transition-all duration-150 hover:border-foreground active:scale-[0.97]"
              >
                90 saniyede anla
              </a>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 text-sm text-foreground/50"
            >
              Ajanslar ve deneyimli pazarlamacılar için. Önizleme sürümü — pilot programı açıldı.
            </motion.p>
          </div>

          {/* Kanıt kartı — ürünün kalbi, canlı görünüm */}
          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.4 }}
            className="lg:col-span-5 lg:mt-10"
          >
            <div className="relative rounded-xl border border-border bg-white/70 backdrop-blur-sm p-5 shadow-[0_4px_10px_rgba(0,0,0,0.08),0_24px_48px_-24px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow text-foreground/50">Kanıt Kartı · Canlı</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c52a00]">
                  <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#ff3500]" aria-hidden="true" />
                  test sürüyor
                </span>
              </div>

              <div className="rounded-lg bg-[#efefe4] p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2">Varyant B · tıklama</p>
                <svg viewBox="0 0 260 72" className="w-full h-16" aria-hidden="true">
                  <polyline
                    points="0,60 30,56 60,58 90,44 120,40 150,30 180,26 210,14 260,8"
                    fill="none"
                    stroke="#ff3500"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="260" cy="8" r="4" fill="#ff3500" className="pulse-dot" />
                </svg>
              </div>

              <ul className="space-y-2.5">
                {agentLines.map((l, i) => (
                  <motion.li
                    key={l.agent}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: easeOut, delay: 0.75 + i * 0.14 }}
                    className="flex items-baseline gap-2 text-sm"
                  >
                    <span className="font-mono text-xs font-bold" style={{ color: l.color }}>
                      {l.agent}:
                    </span>
                    <span className="text-foreground/75">{l.text}</span>
                  </motion.li>
                ))}
                <motion.li
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.25, duration: 0.4 }}
                  className="flex items-center gap-2 text-sm font-semibold pt-1"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-[#c52a00]" aria-hidden="true" />
                  Onayınızı bekliyor: 3 varyasyon
                  <span className="cursor-blink text-[#c52a00]" aria-hidden="true">▌</span>
                </motion.li>
              </ul>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-foreground/50">Yayın, onayınız olmadan çıkmaz.</span>
                <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">simülasyon</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

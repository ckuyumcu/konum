import { useState } from 'react'
import { motion } from 'framer-motion'
import { trpc } from '../lib/trpc'

const easeOut = [0.16, 1, 0.3, 1] as const

const perks = [
  'Kurucu ekiple birebir kurulum: Strateji Belleğin birlikte kurulur',
  'İlk kanıt testi birlikte tasarlanır ve yorumlanır',
  'Pilot fiyatı, program sonunda birlikte belirlenir — kilitlenme yok',
  'Kanıt dosyaların her zaman dışa aktarılabilir',
]

export default function Pilot() {
  const [email, setEmail] = useState('')
  const [ajansAdi, setAjansAdi] = useState('')
  const [riza, setRiza] = useState(false)
  const [state, setState] = useState<'idle' | 'error' | 'ok'>('idle')
  const [hata, setHata] = useState('')
  const [mesgul, setMesgul] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    if (!ok) {
      setHata('Geçerli bir e-posta adresi yaz — örn. sen@ajansin.com')
      setState('error')
      return
    }
    if (!riza) {
      setHata('Devam etmek için aydınlatma metnini okuyup onaylaman gerekir.')
      setState('error')
      return
    }
    setMesgul(true)
    setState('idle')
    try {
      await trpc.pilot.basvur.mutate({ eposta: email.trim(), ajansAdi: ajansAdi.trim(), riza: true })
      setState('ok')
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Kayıt alınamadı. Biraz sonra yeniden dene.')
      setState('error')
    } finally {
      setMesgul(false)
    }
  }

  return (
    <section id="pilot" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-6">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="eyebrow text-[#c52a00] mb-4"
          >
            Pilot program
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
            className="font-display font-black text-4xl sm:text-5xl leading-[1.05]"
          >
            İlk 10 ajansla <span className="hl">birlikte</span> inşa ediyoruz.
          </motion.h2>
          <motion.ul
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.12 }}
            className="mt-8 space-y-4"
          >
            {perks.map((p, i) => (
              <li key={p} className="flex gap-3 items-baseline">
                <span className="font-mono text-xs font-bold text-[#c52a00]">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-foreground/80 font-medium">{p}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.1 }}
          className="lg:col-span-6 rounded-xl border border-border bg-white/60 p-7 md:p-9 shadow-[0_4px_10px_rgba(0,0,0,0.06),0_24px_48px_-28px_rgba(0,0,0,0.22)]"
        >
          {state === 'ok' ? (
            <div role="status">
              <p className="font-display font-bold text-2xl mb-3">Başvurun alındı.</p>
              <p className="text-foreground/70">
                Adresin sunucuya kaydedildi. Pilot kontenjanı açıldığında bu adresten sana ulaşacağız; başka hiçbir
                amaçla kullanılmaz veya paylaşılmaz.
              </p>
              <button
                onClick={() => {
                  setState('idle')
                  setEmail('')
                  setAjansAdi('')
                  setRiza(false)
                }}
                className="mt-6 inline-flex items-center rounded-md border-2 border-foreground/20 px-5 py-2.5 text-sm font-bold transition-all duration-150 hover:border-foreground active:scale-[0.97] cursor-pointer"
              >
                Başka bir adres ekle
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="pilot-email" className="font-display font-bold text-2xl block mb-2">
                Erken erişim listesi
              </label>
              <p className="text-sm text-foreground/60 mb-6">
                İş e-postanı bırak; pilot kontenjanı açıldığında önce listedekilerle konuşacağız.
              </p>
              <div className="grid gap-3">
                <input
                  id="pilot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (state === 'error') setState('idle')
                  }}
                  placeholder="sen@ajansin.com"
                  aria-invalid={state === 'error'}
                  aria-describedby="pilot-note"
                  className="rounded-md border-2 border-foreground/25 bg-[#fcfcf9] px-4 py-3 text-base font-medium placeholder:text-foreground/35 focus:border-foreground focus:outline-none"
                />
                <input
                  id="pilot-ajans"
                  type="text"
                  value={ajansAdi}
                  onChange={(e) => setAjansAdi(e.target.value)}
                  placeholder="Ajans adı (isteğe bağlı)"
                  className="rounded-md border-2 border-foreground/25 bg-[#fcfcf9] px-4 py-3 text-base font-medium placeholder:text-foreground/35 focus:border-foreground focus:outline-none"
                />
                <label className="flex items-start gap-3 text-sm text-foreground/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={riza}
                    onChange={(e) => setRiza(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#181818]"
                  />
                  <span id="pilot-note">
                    E-posta adresimin pilot başvurusu amacıyla saklanmasını ve kontenjan açıldığında bana ulaşılmasını
                    kabul ediyorum. <span className="text-foreground/50">(Aydınlatma metni: taslak — hukuk onayı bekliyor.)</span>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={mesgul}
                  className="rounded-md bg-foreground text-background px-6 py-3 text-base font-bold transition-all duration-150 hover:bg-[#c52a00] active:scale-[0.97] cursor-pointer disabled:opacity-50"
                >
                  {mesgul ? 'Kaydediliyor…' : 'Katıl'}
                </button>
              </div>
              {state === 'error' && (
                <p className="mt-3 text-sm font-semibold text-[#c52a00]" role="alert">
                  {hata}
                </p>
              )}
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

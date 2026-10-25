import { useState } from 'react'
import { motion } from 'framer-motion'
import { trpc } from '../lib/trpc'

const easeOut = [0.16, 1, 0.3, 1] as const

const perks = [
  'One-on-one setup with the founding team: your Strategy Memory is built together',
  'Your first evidence test is designed and interpreted together',
  'Pilot target: $149/workspace/month, finalized together at the end of the program — no lock-in',
  'Your evidence files are always exportable',
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
      setHata('Enter a valid email address — e.g. you@youragency.com')
      setState('error')
      return
    }
    if (!riza) {
      setHata('To continue, you need to read and accept the privacy notice.')
      setState('error')
      return
    }
    setMesgul(true)
    setState('idle')
    try {
      await trpc.pilot.basvur.mutate({ eposta: email.trim(), ajansAdi: ajansAdi.trim(), riza: true })
      setState('ok')
    } catch (err) {
      setHata(err instanceof Error ? err.message : 'Could not save your signup. Please try again shortly.')
      setState('error')
    } finally {
      setMesgul(false)
    }
  }

  return (
    <section id="pilot" className="py-20 md:py-32 relative overflow-hidden">
      <div className="aurora opacity-60" aria-hidden="true" />
      <div className="blob bg-[#0d9488]/20 w-[320px] h-[320px] -bottom-16 right-10" style={{ animationDelay: '-4s' }} aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 md:px-8 grid lg:grid-cols-12 gap-10 items-start relative">
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
            Building <span className="gradient-text">together</span> with the first 10 agencies.
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
                <span
                  className="font-mono text-xs font-bold"
                  style={{ color: ['#ff3500', '#f43f5e', '#8b5cf6', '#0d9488'][i] }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
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
          className="lg:col-span-6 rounded-xl border border-border bg-white/60 backdrop-blur-sm p-7 md:p-9 shadow-[0_4px_10px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(255,53,0,0.30)]"
        >
          {state === 'ok' ? (
            <div role="status">
              <p className="font-display font-bold text-2xl mb-3">Application received.</p>
              <p className="text-foreground/70">
                Your address has been saved on the server. When a pilot seat opens we will reach out to this address;
                it will never be used or shared for any other purpose.
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
                Add another address
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="pilot-email" className="font-display font-bold text-2xl block mb-2">
                Early access list
              </label>
              <p className="text-sm text-foreground/60 mb-6">
                Leave your work email; when a pilot seat opens we&apos;ll talk to the list first.
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
                  placeholder="you@youragency.com"
                  aria-invalid={state === 'error'}
                  aria-describedby="pilot-note"
                  className="rounded-md border-2 border-foreground/25 bg-[#fcfcf9] px-4 py-3 text-base font-medium placeholder:text-foreground/35 focus:border-foreground focus:outline-none"
                />
                <input
                  id="pilot-ajans"
                  type="text"
                  value={ajansAdi}
                  onChange={(e) => setAjansAdi(e.target.value)}
                  placeholder="Agency name (optional)"
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
                    I agree to my email address being stored for the pilot application and being contacted when a seat
                    opens. See our{' '}
                    <a href="/privacy" className="underline decoration-foreground/40 hover:text-foreground">
                      privacy notice
                    </a>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={mesgul}
                  className="btn-glow rounded-md px-6 py-3 text-base font-bold active:scale-[0.97] cursor-pointer disabled:opacity-50"
                >
                  {mesgul ? 'Saving…' : 'Join'}
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

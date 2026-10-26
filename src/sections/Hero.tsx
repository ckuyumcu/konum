import { motion, useMotionValue, useTransform, useReducedMotion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

const agentLines = [
  { agent: 'Researcher', text: '14 competitor messages scanned', color: '#c52a00' },
  { agent: 'Test Designer', text: '2 hypotheses ready', color: '#181818' },
  { agent: 'Auditor', text: '1 variation blocked by brand rules', color: '#181818' },
]

export default function Hero() {
  const reduceMotion = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  // Background layer drifts WITH the mouse; the card floats gently AGAINST it
  const bgX = useTransform(mx, [-0.5, 0.5], [-26, 26])
  const bgY = useTransform(my, [-0.5, 0.5], [-18, 18])
  const cardX = useTransform(mx, [-0.5, 0.5], [9, -9])
  const cardY = useTransform(my, [-0.5, 0.5], [7, -7])

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return
    mx.set(e.clientX / window.innerWidth - 0.5)
    my.set(e.clientY / window.innerHeight - 0.5)
  }

  return (
    <section
      id="top"
      className="relative grid-bg pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden"
      onMouseMove={onMouseMove}
    >
      <motion.div className="absolute inset-0" style={{ x: bgX, y: bgY }} aria-hidden="true">
        <div className="aurora" />
        <div className="blob bg-[#ff3500]/35 w-[440px] h-[440px] -top-32 -right-24" />
        <div className="blob bg-[#8b5cf6]/30 w-[380px] h-[380px] top-1/2 -left-32" style={{ animationDelay: '-5s' }} />
        <div className="blob bg-[#f5a409]/30 w-[300px] h-[300px] bottom-0 right-1/3" style={{ animationDelay: '-9s' }} />
      </motion.div>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-6 items-start">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="eyebrow text-[#c52a00] mb-5"
            >
              The agent-powered continuous marketing operating system
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.08 }}
              className="font-display font-black text-[13vw] sm:text-6xl lg:text-7xl xl:text-[5.2rem] leading-[0.98]"
            >
              Everyone ships copy now.
              <br />
              <span className="gradient-text">The winner proves</span>{' '}
              <em className="not-italic text-[#c52a00]">&ldquo;why&nbsp;me?&rdquo;</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut, delay: 0.2 }}
              className="mt-6 max-w-[62ch] text-lg text-foreground/70"
            >
              Here&apos;s the deal: you keep the strategy and the story — the parts only a person can own.{' '}
              <strong className="text-foreground">Our agents take the grind</strong>: scanning, drafting, testing, scheduling.
              Every claim gets proven in a small live test before a cent of real budget touches it. And nothing — nothing —
              ships without your signature on it.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.32 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <a
                href="#pilot"
                className="btn-glow inline-flex items-center rounded-md px-6 py-3.5 text-base font-bold active:scale-[0.97]"
              >
                Join early access
                <svg width="16" height="16" viewBox="0 0 16 16" className="ml-2" aria-hidden="true">
                  <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a
                href="#nasil"
                className="inline-flex items-center rounded-md border-2 border-foreground/20 px-6 py-3 text-base font-bold transition-all duration-150 hover:border-foreground active:scale-[0.97]"
              >
                Get it in 90 seconds
              </a>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-5 text-sm text-foreground/50"
            >
              Built by people who&apos;ve run agency desks. Preview release — the pilot is open.
            </motion.p>
          </div>

          {/* Evidence card — the heart of the product, live view */}
          <motion.div
            initial={{ opacity: 0, y: 34, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: easeOut, delay: 0.4 }}
            className="lg:col-span-5 lg:mt-10"
          >
            <motion.div
              style={{ x: cardX, y: cardY }}
              className="relative rounded-xl border border-border bg-white/70 backdrop-blur-sm p-5 shadow-[0_4px_10px_rgba(0,0,0,0.08),0_24px_48px_-24px_rgba(0,0,0,0.25)]"
            >
              <p className="hand absolute -top-10 -left-1 -rotate-3 text-2xl text-[#c52a00] select-none" aria-hidden="true">
                live right now ↴
              </p>
              <div className="flex items-center justify-between mb-4">
                <p className="eyebrow text-foreground/50">Evidence Card · Live</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c52a00]">
                  <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-[#ff3500]" aria-hidden="true" />
                  test running
                </span>
              </div>

              <div className="rounded-lg bg-[#efefe4] p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-2">Variant B · clicks</p>
                <svg viewBox="0 0 260 72" className="w-full h-16" aria-hidden="true">
                  <polyline
                    points="0,60 30,56 60,58 90,44 120,40 150,30 180,26 210,14 260,8"
                    fill="none"
                    stroke="#ff3500"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="draw-line"
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
                  Waiting for your approval: 3 variations
                  <span className="cursor-blink text-[#c52a00]" aria-hidden="true">▌</span>
                </motion.li>
              </ul>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-foreground/50">Nothing ships without your approval.</span>
                <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">simulation</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

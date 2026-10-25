import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

const easeOut = [0.16, 1, 0.3, 1] as const

// Animated counter — counts up when scrolled into view
function Counter({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduceMotion = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setVal(to)
      return
    }
    const dur = 1400
    const t0 = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(to * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, reduceMotion])

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {val.toFixed(decimals)}
      {suffix}
    </span>
  )
}

const counters = [
  { to: 1240, suffix: '', label: 'competitor messages scanned', note: 'while you slept' },
  { to: 36, suffix: '', label: 'variations drafted', note: '3 survived the Auditor' },
  { to: 9.5, suffix: ' hrs', decimals: 1, label: 'of routine work handed back', note: 'every single week' },
]

// One pilot week, Monday→Sunday (simulation data — clearly labeled below)
const week = [
  { d: 'Mon', scans: 38, drafts: 4 },
  { d: 'Tue', scans: 52, drafts: 6 },
  { d: 'Wed', scans: 41, drafts: 3 },
  { d: 'Thu', scans: 67, drafts: 8 },
  { d: 'Fri', scans: 59, drafts: 5 },
  { d: 'Sat', scans: 30, drafts: 2 },
  { d: 'Sun', scans: 44, drafts: 8 },
]

export default function Metrics() {
  const chartRef = useRef<HTMLDivElement>(null)
  const inView = useInView(chartRef, { once: true, margin: '-80px' })
  const max = Math.max(...week.map((w) => w.scans))

  return (
    <section className="py-20 md:py-28 bg-[#181818] text-[#fcfcf9] relative overflow-hidden">
      {/* ambient color */}
      <div className="blob bg-[#ff3500]/35 w-[420px] h-[420px] -top-24 -left-24" aria-hidden="true" />
      <div className="blob bg-[#8b5cf6]/30 w-[380px] h-[380px] bottom-0 right-0" style={{ animationDelay: '-6s' }} aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-5 md:px-8 relative">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="eyebrow text-[#ff8a66] mb-4"
        >
          A week inside Konum
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.06 }}
          className="font-display font-black text-4xl sm:text-5xl leading-[1.05] max-w-[22ch]"
        >
          The line never sleeps. <span className="gradient-text">You do.</span>
        </motion.h2>

        <div className="mt-14 grid sm:grid-cols-3 gap-5">
          {counters.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: easeOut, delay: i * 0.09 }}
              className="rounded-xl border border-[#fcfcf9]/15 bg-[#fcfcf9]/[0.05] p-6"
            >
              <p className="font-display font-black text-5xl gradient-text">
                <Counter to={c.to} suffix={c.suffix} decimals={c.decimals ?? 0} />
              </p>
              <p className="mt-2 font-semibold">{c.label}</p>
              <p className="text-sm text-[#fcfcf9]/50">{c.note}</p>
            </motion.div>
          ))}
        </div>

        {/* Animated weekly chart */}
        <div ref={chartRef} className="mt-12 rounded-xl border border-[#fcfcf9]/15 bg-[#fcfcf9]/[0.04] p-6 md:p-8">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-8">
            <p className="font-display font-bold text-xl">Scans per day, first pilot week</p>
            <p className="font-mono text-xs text-[#fcfcf9]/45 uppercase tracking-widest">Simulation data</p>
          </div>
          <div className="flex items-end gap-3 sm:gap-5 h-44">
            {week.map((w, i) => (
              <div key={w.d} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <span className="font-mono text-xs text-[#fcfcf9]/60">{inView ? w.scans : 0}</span>
                <div className="w-full max-w-14 h-32 flex items-end rounded-t-md bg-[#fcfcf9]/[0.06] overflow-hidden">
                  {inView && (
                    <div
                      className="fill-bar w-full rounded-t-md"
                      style={{
                        height: `${(w.scans / max) * 100}%`,
                        animationDelay: `${i * 0.09}s`,
                        background: `linear-gradient(to top, #ff3500, ${i % 2 ? '#f43f5e' : '#f5a409'})`,
                      }}
                    />
                  )}
                </div>
                <span className="text-xs font-semibold text-[#fcfcf9]/60">{w.d}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#fcfcf9]/45">
            Numbers above are simulated and shown to illustrate the rhythm of the system, not to claim results.
          </p>
        </div>
      </div>
    </section>
  )
}

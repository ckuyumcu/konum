const items = ['Strategy Memory', 'Evidence Engine', 'Execution Studio', 'Approval Center', 'Signal Radar']

export default function Marquee() {
  const row = [...items, ...items]
  return (
    <div className="border-y border-border bg-[#efefe4] py-3.5 marquee-mask overflow-hidden" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0">
            {row.map((it, i) => (
              <span key={`${half}-${i}`} className="flex items-center whitespace-nowrap">
                <span className="font-display font-bold text-lg px-6">{it}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="4" fill="#ff3500" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

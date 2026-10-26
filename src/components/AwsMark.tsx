// AIWork School mark — rounded-square "A" badge + wordmark.
// Each family site picks its own accent color; the mark itself stays identical.
export default function AwsMark({
  accent = '#ff6a3d', // badge background (site-specific accent)
  ink = '#181818', // letter color
  text = 'An AIWork School company',
  dark = false, // true on dark backgrounds
  size = 'md', // 'sm' | 'md'
}: {
  accent?: string
  ink?: string
  text?: string
  dark?: boolean
  size?: 'sm' | 'md'
}) {
  const box = size === 'sm' ? 'w-6 h-6 rounded-md text-sm' : 'w-8 h-8 rounded-lg text-lg'
  return (
    <a
      href="https://aiworkschool.com"
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2.5"
      aria-label="AI Work School"
    >
      <span
        className={`inline-grid place-items-center font-black ${box} transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110`}
        style={{ background: accent, color: ink }}
        aria-hidden="true"
      >
        A
      </span>
      <span
        className={`font-bold uppercase tracking-widest ${
          size === 'sm' ? 'text-[10px]' : 'text-xs'
        } ${dark ? 'text-[#fcfcf9]/70 group-hover:text-[#fcfcf9]' : 'text-foreground/60 group-hover:text-foreground'} transition-colors duration-150`}
      >
        {text}
      </span>
    </a>
  )
}

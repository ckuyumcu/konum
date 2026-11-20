export default function BrandMark({
  name = 'KonumOS',
  dark = false,
}: {
  name?: 'KonumOS' | 'AI Work School'
  dark?: boolean
}) {
  const slug = name === 'KonumOS' ? 'konumos' : 'ai-work-school'
  const variant = dark ? 'beyaz' : 'lacivert'

  return (
    <span className={dark ? 'konum-brand konum-brand-dark' : 'konum-brand'}>
      <img src={`/brand/${slug}-${variant}.svg`} width="128" height="56" alt={name} />
    </span>
  )
}

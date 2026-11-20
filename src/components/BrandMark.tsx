export default function BrandMark({
  name = 'KonumOS',
  dark = false,
}: {
  name?: 'KonumOS' | 'AI Work School'
  dark?: boolean
}) {
  return (
    <span className={dark ? 'konum-brand konum-brand-dark' : 'konum-brand'}>
      <img src="/brand/eagle.png" width="590" height="180" alt="" />
      <span>{name}</span>
    </span>
  )
}

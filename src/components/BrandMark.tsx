export default function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={dark ? 'konum-brand konum-brand-dark' : 'konum-brand'}>
      <img src="/brand/eagle.png" width="590" height="180" alt="" />
      <span>KonumOS</span>
    </span>
  )
}

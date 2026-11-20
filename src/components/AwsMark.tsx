import BrandMark from './BrandMark'

export default function AwsMark({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <a
      href="https://aiworkschool.com"
      target="_blank"
      rel="noopener noreferrer"
      className="konum-parent-brand"
      aria-label={text}
      title={text}
    >
      <BrandMark name="AI Work School" dark={dark} />
    </a>
  )
}

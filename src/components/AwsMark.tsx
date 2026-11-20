export default function AwsMark({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <a
      href="https://aiworkschool.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-xs font-semibold hover:underline ${dark ? 'text-[#fcfcf9]/80' : 'text-foreground/80'}`}
    >
      <img src="/brand/eagle.png" width="590" height="180" alt="" className={`w-9 h-auto ${dark ? 'brightness-0 invert' : ''}`} />
      {text}
    </a>
  )
}

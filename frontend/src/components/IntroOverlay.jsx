import { useState, useEffect } from 'react'

const BOOT_LINES = [
  'INITIALIZING DUAL CORE...',
  'LOADING MIKU + EVA PERSONAS...',
  'VOICE SYNTHESIS READY',
]

export default function IntroOverlay() {
  const [visible, setVisible] = useState(true)
  const [fading,  setFading]  = useState(false)
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    const timers = BOOT_LINES.map((_, i) =>
      setTimeout(() => setLineIdx(i), i * 520)
    )
    const t1 = setTimeout(() => setFading(true),  2600)
    const t2 = setTimeout(() => setVisible(false), 3400)
    return () => { [...timers, t1, t2].forEach(clearTimeout) }
  }, [])

  if (!visible) return null

  return (
    <div className="intro-overlay" style={{ opacity: fading ? 0 : 1 }}>
      <div className="intro-logo">MIKU × EVA</div>
      <div className="intro-jp">初音ミク — VOCALOID NEURAL STUDIO</div>
      <div className="intro-boot-line">{BOOT_LINES[lineIdx]}</div>
      <div className="intro-bar"><div className="intro-bar-fill" /></div>
    </div>
  )
}

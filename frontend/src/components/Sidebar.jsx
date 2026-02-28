import { useEffect, useRef } from 'react'
import JarvisOrb from './JarvisOrb'

const STATS = [
  { label: 'VOCAL CLARITY',    value: '98%', pct: 98,  delay: '0s'   },
  { label: 'PITCH PRECISION',  value: '95%', pct: 95,  delay: '0.2s' },
  { label: 'EMOTION ENGINE',   value: '87%', pct: 87,  delay: '0.4s' },
  { label: 'CREATIVITY INDEX', value: '∞',   pct: 100, delay: '0.6s' },
]

export default function Sidebar({ onMikuModeToggle, mikuMode, isSpeaking }) {
  const waveRef = useRef(null)

  useEffect(() => {
    const wrap = waveRef.current
    if (!wrap) return
    for (let i = 0; i < 12; i++) {
      const bar = document.createElement('div')
      bar.classList.add('wave-bar')
      bar.style.animationDelay    = (i * 0.07) + 's'
      bar.style.animationDuration = (0.6 + Math.random() * 0.6) + 's'
      wrap.appendChild(bar)
    }
  }, [])

  return (
    <div className={`sidebar ${isSpeaking ? 'sidebar-speaking' : ''}`}>
      <JarvisOrb isSpeaking={isSpeaking} mikuMode={mikuMode} />

      <div className="miku-title">{mikuMode ? 'MIKU AI' : 'EVA AI'}</div>
      <div className="miku-sub">
        {mikuMode ? '初音ミク / VOCALOID STUDIO' : 'EVA / NEURAL STUDIO'}
      </div>

      <div className="status-row">
        <div className="status-pill online">● ONLINE</div>
        <div className={`status-pill v4 ${isSpeaking ? 'pill-speaking' : ''}`}>
          {isSpeaking ? 'VOICE ACTIVE' : 'V4X ENGINE'}
        </div>
      </div>

      <div className="wave-bar-container" ref={waveRef} />

      <button
        className={`miku-mode-btn ${mikuMode ? 'miku-mode-on' : 'miku-mode-off'}`}
        onClick={onMikuModeToggle}
      >
        <span className="miku-mode-indicator" />
        {mikuMode ? 'MIKU MODE' : 'EVA MODE'}
      </button>
      <div className="miku-mode-hint">
        {mikuMode ? '初音ミク — Japanese voice' : 'Eva — English Voice'}
      </div>
      <div className="miku-shortcut-hint">
        {mikuMode ? 'Ctrl+M to switch · say "eva mode"' : 'Ctrl+M to switch · say "miku mode"'}
      </div>

      <div className="stats-panel">
        {STATS.map(s => (
          <div key={s.label}>
            <div className="stat-row">
              <span>{s.label}</span>
              <span style={{ color: 'var(--miku)' }}>{s.value}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-fill" style={{ width: `${s.pct}%`, animationDelay: s.delay }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

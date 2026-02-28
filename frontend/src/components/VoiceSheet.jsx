import { useState, useEffect, useRef, useCallback } from 'react'

const MIKU_TRIGGERS = ['miku mode', 'switch to miku', 'activate miku', 'japanese mode', 'ミクモード', 'miku']
const STD_TRIGGERS  = ['eva mode', 'switch to eva', 'activate eva', 'english mode', 'standard mode', 'normal mode', 'eva']

function detectModeSwitch(text) {
  const lower = text.toLowerCase().trim()
  if (MIKU_TRIGGERS.some(t => lower.includes(t))) return 'miku'
  if (STD_TRIGGERS.some(t  => lower.includes(t))) return 'standard'
  return null
}

const BAR_COUNT = 36

export default function VoiceSheet({ onTranscript, onClose, mikuMode, onModeSwitch }) {
  const [phase,      setPhase]      = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [error,      setError]      = useState('')

  const recogRef      = useRef(null)
  const transcriptRef = useRef('')
  const canvasRef     = useRef(null)
  const orbRef        = useRef(null)
  const phaseRef      = useRef('idle')
  const rafRef        = useRef(null)
  const orbRafRef     = useRef(null)

  useEffect(() => { transcriptRef.current = transcript }, [transcript])
  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Waveform canvas ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    let t = 0, intensity = 0

    const draw = () => {
      const listening  = phaseRef.current === 'listening'
      const processing = phaseRef.current === 'processing'
      const isMiku     = mikuMode   // captured from closure — stable for lifetime of this effect
      intensity += ((listening ? 1 : 0) - intensity) * 0.09

      ctx.clearRect(0, 0, W, H)
      const barW = 2.5
      const gap  = (W - BAR_COUNT * barW) / (BAR_COUNT + 1)
      const cy   = H / 2

      for (let i = 0; i < BAR_COUNT; i++) {
        const x     = gap + i * (barW + gap)
        const norm  = i / BAR_COUNT
        const shape = Math.sin(norm * Math.PI) * 0.72 + 0.28

        const h = processing
          ? 3 + Math.abs(Math.sin(t * 3.5 + i * 0.35)) * 5
          : (2 + Math.sin(t * 1.4 + i * 0.45) * 1.2) +
            (Math.abs(Math.sin(t * 6.2 + i * 0.55)) * 24 +
             Math.abs(Math.sin(t * 3.8 - i * 0.40)) * 15 +
             Math.abs(Math.sin(t * 8.5 + i * 0.70)) * 9) * shape * intensity

        // Miku: cyan → pink. Eva: cyan → teal
        let r, g, b
        if (isMiku) {
          r = Math.round(intensity * 255)
          g = Math.round(229 - intensity * 152)
          b = Math.round(255 - intensity * 45)
        } else {
          r = 0
          g = Math.round(229 + intensity * 26)
          b = Math.round(255 - intensity * 75)
        }
        const a = 0.28 + intensity * 0.65

        const gr = ctx.createLinearGradient(x, cy - h, x, cy + h)
        gr.addColorStop(0,    `rgba(${r},${g},${b},0)`)
        gr.addColorStop(0.15, `rgba(${r},${g},${b},${a})`)
        gr.addColorStop(0.5,  `rgba(${r},${g},${b},${Math.min(a + 0.25, 1)})`)
        gr.addColorStop(0.85, `rgba(${r},${g},${b},${a})`)
        gr.addColorStop(1,    `rgba(${r},${g},${b},0)`)

        ctx.shadowBlur  = intensity > 0.4 ? 6 : 0
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`
        ctx.fillStyle   = gr
        ctx.beginPath()
        ctx.roundRect(x, cy - h, barW, h * 2, 1.5)
        ctx.fill()
      }

      t += 0.022
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [mikuMode])

  // ── Orb canvas — uses canvas.width/height, no hardcoded dimensions ───
  useEffect(() => {
    const canvas = orbRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W  = canvas.width
    const H  = canvas.height
    const CX = W / 2
    const CY = H / 2
    const R  = Math.min(W, H) * 0.44   // proportional — was hardcoded 80 on 200-space, now correct

    let t = 0, si = 0

    const rings = [
      { theta: 0,           phi: 0,           spd:  0.010, lw: 1.2 },
      { theta: Math.PI/2,   phi: 0,           spd: -0.014, lw: 0.9 },
      { theta: Math.PI/2,   phi: Math.PI/3,   spd:  0.017, lw: 0.8 },
      { theta: Math.PI/2,   phi: Math.PI*2/3, spd: -0.012, lw: 0.8 },
      { theta: Math.PI/4,   phi: 0,           spd:  0.015, lw: 1.1 },
      { theta: Math.PI/4,   phi: Math.PI/2,   spd: -0.011, lw: 0.9 },
      { theta: Math.PI*3/4, phi: Math.PI/4,   spd:  0.019, lw: 1.0 },
      { theta: Math.PI/6,   phi: Math.PI*3/4, spd: -0.016, lw: 0.7 },
    ]

    const NODES = (() => {
      const pts = [], n = 14, gr = (1 + Math.sqrt(5)) / 2
      for (let i = 0; i < n; i++) {
        const theta = Math.acos(1 - 2 * (i + 0.5) / n)
        const phi   = 2 * Math.PI * i / gr
        pts.push([
          R * Math.sin(theta) * Math.cos(phi),
          R * Math.cos(theta),
          R * Math.sin(theta) * Math.sin(phi),
        ])
      }
      return pts
    })()

    const sparks = []

    function ringPt(a, theta, phi) {
      let x = R * Math.cos(a), y = 0, z = R * Math.sin(a)
      const y1 = y * Math.cos(theta) - z * Math.sin(theta)
      const z1 = y * Math.sin(theta) + z * Math.cos(theta)
      y = y1; z = z1
      return {
        x: x * Math.cos(phi) + z * Math.sin(phi),
        y,
        z: -x * Math.sin(phi) + z * Math.cos(phi),
      }
    }

    function rotY(pt, a) {
      const [px, py, pz] = pt
      return [px * Math.cos(a) + pz * Math.sin(a), py, -px * Math.sin(a) + pz * Math.cos(a)]
    }

    const drawOrb = () => {
      const listening = phaseRef.current === 'listening'
      const isMiku    = mikuMode
      si += ((listening ? 1 : 0) - si) * (listening ? 0.07 : 0.04)
      const s = Math.max(0, Math.min(1, si))

      ctx.clearRect(0, 0, W, H)

      // Miku: cyan → pink. Eva: cyan → teal
      let Rc, Gc, Bc
      if (isMiku) {
        Rc = Math.round(0   + 255 * s)
        Gc = Math.round(229 - 152 * s)
        Bc = Math.round(255 -  45 * s)
      } else {
        Rc = 0
        Gc = Math.round(229 +  26 * s)
        Bc = Math.round(255 -  75 * s)
      }
      const col = (a) => `rgba(${Rc},${Gc},${Bc},${Math.max(0, Math.min(1, a))})`

      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 1.15)
      bg.addColorStop(0,   `rgba(0,${6 + s * 18},${14 + s * 10},0.97)`)
      bg.addColorStop(0.7, 'rgba(0,4,10,0.5)')
      bg.addColorStop(1,   'rgba(0,0,6,0)')
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.15, 0, Math.PI * 2)
      ctx.fillStyle = bg; ctx.fill()

      rings.forEach(ring => {
        ring.phi += ring.spd * (1 + s * 1.2)
        for (let i = 0; i < 48; i++) {
          const a1 = (i / 48) * Math.PI * 2
          const a2 = ((i + 1) / 48) * Math.PI * 2
          const p1 = ringPt(a1, ring.theta, ring.phi)
          const p2 = ringPt(a2, ring.theta, ring.phi)
          const depth = (p1.z + p2.z) / 2
          const df    = 0.12 + 0.88 * (depth / R * 0.5 + 0.5)
          if (df < 0.10) continue
          ctx.beginPath()
          ctx.moveTo(CX + p1.x, CY + p1.y)
          ctx.lineTo(CX + p2.x, CY + p2.y)
          ctx.strokeStyle = col((0.20 + s * 0.55) * df)
          ctx.lineWidth   = (ring.lw + s * 0.7) * (0.3 + df * 0.7)
          ctx.shadowBlur  = depth > 0 ? (4 + s * 14) * df : 0
          ctx.shadowColor = col(0.8)
          ctx.stroke()
        }
      })

      const nY = t * 0.005
      NODES.forEach(node => {
        const [nx, ny, nz] = rotY(node, nY)
        if (nz < -R * 0.1) return
        const df = 0.2 + 0.8 * (nz / R * 0.5 + 0.5)
        ctx.beginPath()
        ctx.arc(CX + nx, CY + ny, 2 + s * 2.5, 0, Math.PI * 2)
        ctx.fillStyle  = col((0.55 + s * 0.45) * df)
        ctx.shadowBlur  = 12 + s * 20
        ctx.shadowColor = col(0.9)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      if (s > 0.3 && Math.random() > 0.8) {
        const a  = Math.random() * Math.PI * 2
        const r2 = R * (0.6 + Math.random() * 0.5)
        sparks.push({
          x: CX + Math.cos(a) * r2, y: CY + Math.sin(a) * r2,
          vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
          life: 1,
        })
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]
        sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.05
        if (sp.life <= 0) { sparks.splice(i, 1); continue }
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle  = col(sp.life * 0.8)
        ctx.shadowBlur  = 8; ctx.shadowColor = col(sp.life); ctx.fill(); ctx.shadowBlur = 0
      }

      const pulse = Math.sin(t * 3.8) * 0.5 + 0.5
      const coreR = R * 0.07 + pulse * R * 0.06 + s * R * 0.05
      const cg    = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR * 3.5)
      cg.addColorStop(0,    'rgba(255,255,255,1)')
      cg.addColorStop(0.15, col(1))
      cg.addColorStop(0.5,  col(0.6 + s * 0.4))
      cg.addColorStop(1,    col(0))
      ctx.beginPath(); ctx.arc(CX, CY, coreR * 3.5, 0, Math.PI * 2)
      ctx.fillStyle  = cg
      ctx.shadowBlur  = 22 + pulse * 25 + s * 35
      ctx.shadowColor = col(1)
      ctx.fill()
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2)
      ctx.fillStyle  = 'rgba(235,252,255,1)'; ctx.shadowBlur = 0; ctx.fill()

      t += 0.018
      orbRafRef.current = requestAnimationFrame(drawOrb)
    }
    drawOrb()
    return () => cancelAnimationFrame(orbRafRef.current)
  }, [])

  useEffect(() => () => { recogRef.current?.abort() }, [])

  const handleClose = useCallback(() => {
    recogRef.current?.abort()
    onClose()
  }, [onClose])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [handleClose])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Speech recognition unavailable. Use Chrome or Edge.'); return }
    setError(''); setTranscript(''); transcriptRef.current = ''
    setPhase('listening')
    const recog = new SR()
    recog.lang = mikuMode ? 'ja-JP' : 'en-US'
    recog.continuous = false; recog.interimResults = true
    recogRef.current = recog
    recog.onresult = (e) => {
      const r = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(r); transcriptRef.current = r
    }
    recog.onend  = () => { if (transcriptRef.current.trim()) setPhase('processing'); else setPhase('idle') }
    recog.onerror = (e) => { if (e.error !== 'aborted') setError(`Error: ${e.error}. Tap to retry.`); setPhase('idle') }
    recog.start()
  }, [mikuMode])

  const stopListening = useCallback(() => { recogRef.current?.stop() }, [])

  const handleSend = useCallback(() => {
    if (!transcript.trim()) return
    const modeCmd = detectModeSwitch(transcript)
    if (modeCmd && onModeSwitch) { onModeSwitch(modeCmd === 'miku'); onClose(); return }
    onTranscript(transcript.trim()); onClose()
  }, [transcript, onTranscript, onClose, onModeSwitch])

  useEffect(() => {
    if (phase !== 'processing' || !transcript.trim()) return
    const modeCmd = detectModeSwitch(transcript)
    if (modeCmd && onModeSwitch) {
      const t = setTimeout(() => { onModeSwitch(modeCmd === 'miku'); onClose() }, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => { onTranscript(transcript.trim()); onClose() }, 500)
    return () => clearTimeout(t)
  }, [phase, transcript, onTranscript, onClose, onModeSwitch])

  const canClick = phase === 'idle' || phase === 'listening'

  return (
    <div className="vs-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="vs-panel">

        <div className="vs-topbar">
          <span className="vs-mode-chip">
            {mikuMode ? '初音ミク — JAPANESE' : 'STANDARD — ENGLISH'}
          </span>
          <button className="vs-x" onClick={handleClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="11" y2="11"/>
              <line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </button>
        </div>

        <div
          className={`vs-orb-wrap ${phase === 'listening' ? 'vs-orb-active' : ''}`}
          onClick={canClick ? (phase === 'idle' ? startListening : stopListening) : undefined}
          style={{ cursor: canClick ? 'pointer' : 'default' }}
        >
          <canvas ref={orbRef} width={160} height={160} className="vs-orb-canvas" />
        </div>

        <div
          className={`vs-canvas-wrap ${phase === 'listening' ? 'vs-canvas-listening' : ''}`}
          onClick={canClick ? (phase === 'idle' ? startListening : stopListening) : undefined}
          style={{ cursor: canClick ? 'pointer' : 'default' }}
        >
          <canvas ref={canvasRef} width={360} height={80} className="vs-canvas" />
          <div className={`vs-pulse-ring ${phase === 'listening' ? 'vs-pulse-ring-active' : ''}`} />
        </div>

        <div className="vs-status">
          {phase === 'idle'       && 'Tap orb or waveform to speak'}
          {phase === 'listening'  && 'Listening — tap to stop'}
          {phase === 'processing' && 'Processing...'}
        </div>

        {transcript && <div className="vs-text">{transcript}</div>}
        {error      && <div className="vs-err">{error}</div>}

        {transcript && phase !== 'listening' && (
          <button className="vs-send" onClick={handleSend}>Send</button>
        )}

        <div className="vs-hint">
          Say "miku mode" or "eva mode" to switch
        </div>
      </div>
    </div>
  )
}

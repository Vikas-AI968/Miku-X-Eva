import { useEffect, useRef } from 'react'

export default function JarvisOrb({ isSpeaking, mikuMode }) {
  const canvasRef    = useRef(null)
  const speakingRef  = useRef(false)
  const mikuModeRef  = useRef(mikuMode)

  useEffect(() => { speakingRef.current  = isSpeaking }, [isSpeaking])
  useEffect(() => { mikuModeRef.current  = mikuMode   }, [mikuMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 220, H = 220, CX = W / 2, CY = H / 2
    const R = 90

    let t    = 0
    let si   = 0
    let rafId

    const rings = [
      { theta: 0,             phi: 0,             spd:  0.007, lw: 1.1 },
      { theta: Math.PI / 2,   phi: 0,             spd: -0.010, lw: 0.8 },
      { theta: Math.PI / 2,   phi: Math.PI / 3,   spd:  0.013, lw: 0.7 },
      { theta: Math.PI / 2,   phi: Math.PI * 2/3, spd: -0.009, lw: 0.7 },
      { theta: Math.PI / 4,   phi: 0,             spd:  0.011, lw: 1.0 },
      { theta: Math.PI / 4,   phi: Math.PI / 2,   spd: -0.008, lw: 0.8 },
      { theta: Math.PI * 3/4, phi: Math.PI / 4,   spd:  0.015, lw: 0.9 },
      { theta: Math.PI / 6,   phi: Math.PI * 3/4, spd: -0.012, lw: 0.6 },
    ]

    const NODES = (() => {
      const pts = [], n = 16, gr = (1 + Math.sqrt(5)) / 2
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

    function spawnSpark(s) {
      if (sparks.length > 20 || Math.random() > 0.08 + s * 0.14) return
      const angle = Math.random() * Math.PI * 2
      const r2    = R * (0.7 + Math.random() * 0.4)
      sparks.push({
        x: CX + Math.cos(angle) * r2,
        y: CY + Math.sin(angle) * r2,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
      })
    }

    function ringPt(a, theta, phi) {
      let x = R * Math.cos(a), y = 0, z = R * Math.sin(a)
      const y1 = y * Math.cos(theta) - z * Math.sin(theta)
      const z1 = y * Math.sin(theta) + z * Math.cos(theta)
      y = y1; z = z1
      return {
        x:  x * Math.cos(phi) + z * Math.sin(phi),
        y,
        z: -x * Math.sin(phi) + z * Math.cos(phi),
      }
    }

    function rotY(pt, a) {
      const [px, py, pz] = pt
      return [px * Math.cos(a) + pz * Math.sin(a), py, -px * Math.sin(a) + pz * Math.cos(a)]
    }

    const N_SEG = 56

    const draw = () => {
      const speaking = speakingRef.current
      const isMiku   = mikuModeRef.current
      si += ((speaking ? 1 : 0) - si) * (speaking ? 0.06 : 0.03)
      const s = Math.max(0, Math.min(1, si))

      ctx.clearRect(0, 0, W, H)

      // ── Color: mode-aware speaking shift ─────────────────────────────
      // Miku: cyan (0,229,255) → pink (255,77,210)
      // Eva:  cyan (0,229,255) → bright teal (0,255,180)
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

      const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 106)
      bg.addColorStop(0,   `rgba(0,${8 + s * 14},${18 + s * 8},0.97)`)
      bg.addColorStop(0.6, 'rgba(0,5,12,0.75)')
      bg.addColorStop(1,   'rgba(0,0,6,0)')
      ctx.beginPath(); ctx.arc(CX, CY, 106, 0, Math.PI * 2)
      ctx.fillStyle = bg; ctx.fill()

      const halo = ctx.createRadialGradient(CX, CY, R * 0.3, CX, CY, R * 1.1)
      halo.addColorStop(0,   col(0))
      halo.addColorStop(0.5, col(0.03 + s * 0.09))
      halo.addColorStop(1,   col(0))
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.1, 0, Math.PI * 2)
      ctx.fillStyle = halo; ctx.fill()

      rings.forEach(ring => {
        ring.phi += ring.spd * (1 + s * 0.7)
        for (let i = 0; i < N_SEG; i++) {
          const a1 = (i       / N_SEG) * Math.PI * 2
          const a2 = ((i + 1) / N_SEG) * Math.PI * 2
          const p1 = ringPt(a1, ring.theta, ring.phi)
          const p2 = ringPt(a2, ring.theta, ring.phi)
          const depth = (p1.z + p2.z) / 2
          const df    = 0.15 + 0.85 * (depth / R * 0.5 + 0.5)
          if (df < 0.12) continue
          ctx.beginPath()
          ctx.moveTo(CX + p1.x, CY + p1.y)
          ctx.lineTo(CX + p2.x, CY + p2.y)
          ctx.strokeStyle = col((0.18 + s * 0.45) * df)
          ctx.lineWidth   = (ring.lw + s * 0.5) * (0.4 + df * 0.6)
          ctx.shadowBlur  = depth > 0 ? (3 + s * 10) * df : 0
          ctx.shadowColor = col(0.7)
          ctx.stroke()
        }
      })

      const nodeY = t * 0.004
      NODES.forEach(node => {
        const [nx, ny, nz] = rotY(node, nodeY)
        if (nz < -R * 0.05) return
        const df = 0.2 + 0.8 * (nz / R * 0.5 + 0.5)
        ctx.beginPath()
        ctx.arc(CX + nx, CY + ny, 2.2 + s * 1.8, 0, Math.PI * 2)
        ctx.fillStyle   = col((0.55 + s * 0.4) * df)
        ctx.shadowBlur  = 10 + s * 16
        ctx.shadowColor = col(0.9)
        ctx.fill()
        ctx.shadowBlur  = 0
      })

      const visNodes = NODES.map(n => rotY(n, nodeY)).filter(n => n[2] > 0)
      for (let i = 0; i < visNodes.length; i++) {
        for (let j = i + 1; j < visNodes.length; j++) {
          const d = Math.hypot(
            visNodes[i][0] - visNodes[j][0],
            visNodes[i][1] - visNodes[j][1],
            visNodes[i][2] - visNodes[j][2]
          )
          if (d > R * 0.88) continue
          ctx.beginPath()
          ctx.moveTo(CX + visNodes[i][0], CY + visNodes[i][1])
          ctx.lineTo(CX + visNodes[j][0], CY + visNodes[j][1])
          ctx.strokeStyle = col((0.05 + s * 0.10) * (1 - d / (R * 0.88)))
          ctx.lineWidth   = 0.6
          ctx.shadowBlur  = 0
          ctx.stroke()
        }
      }

      spawnSpark(s)
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i]
        sp.x += sp.vx; sp.y += sp.vy
        sp.life -= 0.04
        if (sp.life <= 0) { sparks.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(sp.x, sp.y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle   = col((sp.life / sp.maxLife) * (0.5 + s * 0.5))
        ctx.shadowBlur  = 8
        ctx.shadowColor = col(sp.life / sp.maxLife)
        ctx.fill()
        ctx.shadowBlur  = 0
      }

      const pulse  = Math.sin(t * 3.2) * 0.5 + 0.5
      const coreR  = 8 + pulse * 4.5 + s * 3.5
      const cGrad  = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR * 3.5)
      cGrad.addColorStop(0,    'rgba(255,255,255,1)')
      cGrad.addColorStop(0.15, col(1))
      cGrad.addColorStop(0.5,  col(0.6 + s * 0.35))
      cGrad.addColorStop(1,    col(0))
      ctx.beginPath(); ctx.arc(CX, CY, coreR * 3.5, 0, Math.PI * 2)
      ctx.fillStyle   = cGrad
      ctx.shadowBlur  = 18 + pulse * 22 + s * 28
      ctx.shadowColor = col(1)
      ctx.fill()
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2)
      ctx.fillStyle  = 'rgba(235,252,255,1)'
      ctx.shadowBlur = 0
      ctx.fill()

      t += 0.016
      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="jarvis-wrap">
      <canvas ref={canvasRef} id="jarvisCanvas" width={220} height={220} />
      <div className={`jarvis-label ${isSpeaking ? 'jarvis-label-speaking' : ''}`}>
        {isSpeaking
          ? (mikuMode ? 'MIKU SYNTHESIS ACTIVE' : 'EVA SYNTHESIS ACTIVE')
          : (mikuMode ? 'NEURAL CORE ACTIVE'    : 'EVA CORE ACTIVE')}
      </div>
    </div>
  )
}

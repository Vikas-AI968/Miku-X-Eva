import { useEffect } from 'react'
import * as THREE from 'three'

export default function useThreeBackground(canvasId) {
  useEffect(() => {
    const canvas = document.getElementById(canvasId)
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const mikuColor = new THREE.Color(0x00e5ff)
    const pinkColor = new THREE.Color(0xff4dd2)
    const tealColor = new THREE.Color(0x1de9b6)

    // ── Starfield ──
    const starGeo = new THREE.BufferGeometry()
    const starCount = 1500
    const starPos = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3]     = (Math.random() - 0.5) * 80
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 80
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80
      const c = Math.random() < 0.7 ? mikuColor : Math.random() < 0.5 ? pinkColor : tealColor
      starColors[i * 3]     = c.r
      starColors[i * 3 + 1] = c.g
      starColors[i * 3 + 2] = c.b
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.8 })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // ── Torus rings ──
    const rings = []
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.TorusGeometry(1.5 + i * 0.8, 0.008, 8, 80)
      const mat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? mikuColor : pinkColor, transparent: true, opacity: 0.2 + i * 0.05 })
      const ring = new THREE.Mesh(geo, mat)
      ring.rotation.x = Math.random() * Math.PI
      ring.rotation.y = Math.random() * Math.PI
      ring.userData = { rotX: (Math.random() - 0.5) * 0.003, rotY: (Math.random() - 0.5) * 0.003, rotZ: (Math.random() - 0.5) * 0.003 }
      scene.add(ring)
      rings.push(ring)
    }

    // ── Holographic grid ──
    const gridGeo = new THREE.PlaneGeometry(30, 30, 30, 30)
    const gridMat = new THREE.MeshBasicMaterial({ color: mikuColor, wireframe: true, transparent: true, opacity: 0.05 })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -Math.PI / 2
    grid.position.y = -4
    scene.add(grid)

    // ── DNA helix ──
    const waveCount = 200
    const makeHelix = (phaseOffset, color, opacity) => {
      const pts = []
      for (let i = 0; i < waveCount; i++) {
        const t = (i / waveCount) * Math.PI * 4 - Math.PI * 2
        pts.push(new THREE.Vector3(Math.sin(t + phaseOffset) * 2, (i / waveCount - 0.5) * 8, Math.cos(t + phaseOffset) * 2))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      const line = new THREE.Line(geo, mat)
      line.position.x = -6
      scene.add(line)
      return line
    }
    const waveLine  = makeHelix(0, mikuColor, 0.4)
    const wave2Line = makeHelix(Math.PI, pinkColor, 0.35)

    // ── Icosahedron ──
    const icoGeo = new THREE.IcosahedronGeometry(1.5, 1)
    const icoMat = new THREE.MeshBasicMaterial({ color: mikuColor, wireframe: true, transparent: true, opacity: 0.15 })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    ico.position.set(5, 1, -3)
    scene.add(ico)

    // ── Floating particles ──
    const partCount = 300
    const partPos = new Float32Array(partCount * 3)
    const partVel = []
    for (let i = 0; i < partCount; i++) {
      partPos[i * 3]     = (Math.random() - 0.5) * 20
      partPos[i * 3 + 1] = (Math.random() - 0.5) * 15
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 10
      partVel.push({ x: (Math.random() - 0.5) * 0.01, y: (Math.random() - 0.5) * 0.01, z: (Math.random() - 0.5) * 0.005 })
    }
    const partGeo = new THREE.BufferGeometry()
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3))
    const partMat = new THREE.PointsMaterial({ size: 0.05, color: mikuColor, transparent: true, opacity: 0.7 })
    const particles = new THREE.Points(partGeo, partMat)
    scene.add(particles)

    // ── Frequency bars ──
    const bars = []
    const barGroup = new THREE.Group()
    barGroup.position.set(0, -4, -2)
    const barCount = 32
    for (let i = 0; i < barCount; i++) {
      const barGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15)
      const barMat = new THREE.MeshBasicMaterial({ color: i < barCount / 2 ? mikuColor : pinkColor, transparent: true, opacity: 0.6 })
      const bar = new THREE.Mesh(barGeo, barMat)
      bar.position.x = (i - barCount / 2) * 0.2
      bar.userData.phase = i * 0.3
      barGroup.add(bar)
      bars.push(bar)
    }
    scene.add(barGroup)

    // ── Mouse ──
    const mouse = { x: 0, y: 0 }
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Animation loop ──
    let t = 0
    let rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      t += 0.01

      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.05
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      stars.rotation.y += 0.0003
      stars.rotation.x += 0.0001
      rings.forEach(r => { r.rotation.x += r.userData.rotX; r.rotation.y += r.userData.rotY; r.rotation.z += r.userData.rotZ })
      waveLine.rotation.y  = t * 0.3
      wave2Line.rotation.y = t * 0.3
      ico.rotation.x += 0.004
      ico.rotation.y += 0.006

      const gPos = gridGeo.attributes.position
      for (let i = 0; i < gPos.count; i++) {
        const x = gPos.getX(i), z = gPos.getY(i)
        gPos.setZ(i, Math.sin(x * 0.5 + t) * 0.2 + Math.cos(z * 0.5 + t * 1.2) * 0.15)
      }
      gPos.needsUpdate = true

      bars.forEach(bar => {
        const h = 0.2 + Math.abs(Math.sin(t * 2 + bar.userData.phase)) * 2.5
        bar.scale.y = h
        bar.position.y = h * 0.075
      })

      const pp = partGeo.attributes.position
      for (let i = 0; i < partCount; i++) {
        let x = pp.getX(i) + partVel[i].x
        let y = pp.getY(i) + partVel[i].y
        let z = pp.getZ(i) + partVel[i].z
        if (Math.abs(x) > 10) partVel[i].x *= -1
        if (Math.abs(y) > 7.5) partVel[i].y *= -1
        if (Math.abs(z) > 5) partVel[i].z *= -1
        pp.setXYZ(i, x, y, z)
      }
      pp.needsUpdate = true

      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [canvasId])
}

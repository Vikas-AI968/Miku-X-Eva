import { useEffect, useRef } from 'react'

const NOTES = ['♩', '♪', '♫', '♬', '𝄞', '𝄢']

export default function FloatingNotes() {
  const timersRef = useRef([])

  useEffect(() => {
    const spawn = () => {
      const el = document.createElement('div')
      el.classList.add('note')
      el.textContent = NOTES[Math.floor(Math.random() * NOTES.length)]
      el.style.left           = (Math.random() * 100) + 'vw'
      el.style.bottom         = (Math.random() * 30 + 10) + 'vh'
      el.style.fontSize       = (0.8 + Math.random() * 1.4) + 'rem'
      el.style.animationDuration = (3 + Math.random() * 4) + 's'
      el.style.color          = Math.random() < 0.5 ? 'var(--miku)' : 'var(--pink)'
      document.body.appendChild(el)

      // Track removal timer so we can clear on unmount — prevents DOM leaks
      const t = setTimeout(() => {
        el.remove()
        timersRef.current = timersRef.current.filter(x => x !== t)
      }, 7000)
      timersRef.current.push(t)
    }

    const intervalId = setInterval(spawn, 900)

    return () => {
      clearInterval(intervalId)
      // Clear all pending removal timers and remove orphaned note elements
      timersRef.current.forEach(t => clearTimeout(t))
      document.querySelectorAll('.note').forEach(el => el.remove())
      timersRef.current = []
    }
  }, [])

  return null
}

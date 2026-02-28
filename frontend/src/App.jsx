import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import IntroOverlay       from './components/IntroOverlay'
import Sidebar            from './components/Sidebar'
import ChatBox            from './components/ChatBox'
import FloatingNotes      from './components/FloatingNotes'
import ModeToast          from './components/ModeToast'
import useThreeBackground from './hooks/useThreeBackground'

export default function App() {
  const [mikuMode,   setMikuMode]   = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [toastMode,  setToastMode]  = useState(null)
  const toastTimerRef               = useRef(null)   // track toast timeout — prevent race condition

  useThreeBackground('bg-canvas')

  useEffect(() => {
    document.body.classList.toggle('speaking-active', isSpeaking)
    return () => document.body.classList.remove('speaking-active')
  }, [isSpeaking])

  useLayoutEffect(() => {
    document.body.classList.toggle('mode-miku', mikuMode)
    document.body.classList.toggle('mode-eva',  !mikuMode)
  }, [mikuMode])

  const handleModeSwitch = useCallback((toMiku) => {
    setMikuMode(toMiku)
    setToastMode(toMiku ? 'miku' : 'eva')
    // Clear any pending toast dismiss — prevents rapid-switch race condition
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToastMode(null), 2200)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  const toggleMikuMode       = useCallback(() => handleModeSwitch(!mikuMode), [mikuMode, handleModeSwitch])
  const handleSpeakingChange = useCallback((val) => setIsSpeaking(val), [])

  // Ctrl+M / Cmd+M — switch mode from anywhere
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        handleModeSwitch(!mikuMode)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mikuMode, handleModeSwitch])

  return (
    <>
      <IntroOverlay />

      <canvas id="bg-canvas" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      <div className="scanlines" />
      <div className="vignette" />

      <div className={`ambient-overlay ${isSpeaking ? 'ambient-active' : ''}`} />
      <div className={`mode-flash-overlay ${toastMode ? 'mode-flash-active' : ''}`} />

      <div className="hud-corner tl" />
      <div className="hud-corner tr" />
      <div className="hud-corner bl" />
      <div className="hud-corner br" />

      {toastMode && <ModeToast mode={toastMode} />}

      <div className="app">
        <Sidebar
          onMikuModeToggle={toggleMikuMode}
          mikuMode={mikuMode}
          isSpeaking={isSpeaking}
        />
        <ChatBox
          onSpeakingChange={handleSpeakingChange}
          mikuMode={mikuMode}
          onModeSwitch={handleModeSwitch}
        />
      </div>

      <FloatingNotes />
    </>
  )
}

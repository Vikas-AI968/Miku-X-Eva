import { useState, useRef, useEffect, useCallback } from 'react'
import { useTTS } from '../hooks/useTTS'
import VoiceSheet from './VoiceSheet'

const QUICK_PROMPTS_MIKU = [
  { label: 'Compose Melody',   text: 'Compose a melody for me' },
  { label: 'Write Lyrics',     text: 'Write me lyrics in Miku style' },
  { label: 'Vocal Synthesis',  text: 'Tell me about vocaloid synthesis' },
  { label: 'About Miku',       text: 'Tell me about yourself, Miku' },
]

const QUICK_PROMPTS_EVA = [
  { label: 'About Eva',     text: 'Tell me about yourself, Eva' },
  { label: 'Your capabilities',text: 'What are you capable of?' },
  { label: 'Surprise me',      text: 'Give me your most unexpected thought' },
  { label: 'Think deeply',     text: 'What do you think about consciousness?' },
]

const API_BASE = 'https://miku-x-eva-backend.onrender.com'
const USER_ID  = 'user-' + Math.random().toString(36).slice(2, 8)

function SpeechWaveform({ active }) {
  return (
    <div className={`speech-waveform ${active ? 'waveform-active' : ''}`}>
      {Array.from({ length: 28 }, (_, i) => (
        <div key={i} className="waveform-bar" />
      ))}
    </div>
  )
}

function TTSBar({ enabled, speaking, onToggle, onStop, mikuMode }) {
  return (
    <div className="tts-controls">
      <div className={`tts-status ${speaking ? 'tts-speaking' : ''}`}>
        <span className="tts-dot" />
        <span className="tts-label">
          {speaking
            ? (mikuMode ? 'MIKU SYNTHESIZING' : 'EVA SYNTHESIZING')
            : enabled ? 'VOICE READY' : 'VOICE MUTED'}
        </span>
      </div>
      {speaking && (
        <button className="tts-stop-btn" onClick={onStop}>STOP</button>
      )}
      <button
        className={`tts-toggle-btn ${enabled ? 'tts-on' : 'tts-off'}`}
        onClick={onToggle}
      >
        {enabled ? 'VOICE ON' : 'VOICE OFF'}
      </button>
    </div>
  )
}

function WelcomeScreen({ mikuMode, onSend }) {
  const prompts = mikuMode ? QUICK_PROMPTS_MIKU : QUICK_PROMPTS_EVA
  return (
    <div className="welcome-screen">
      <div>
        <div className="welcome-miku-text">
          {mikuMode ? 'HATSUNE MIKU' : 'EVA'}
        </div>
        <div className="welcome-jp"><br></br>
          {mikuMode ? '人工知能ボーカルスタジオ' : 'NEURAL AI STUDIO'}
        </div>
      </div>
      <div className="welcome-desc">
        {mikuMode
          ? 'Yahho~! ♪ Miku is here! Ask about music, lyrics, vocal synthesis — or just chat with me!'
          : 'Eva at your service. Precise, composed, and ready. Ask anything u wanna know about.'}
      </div>
      <div className="welcome-shortcuts">
        <span className="shortcut-badge">Ctrl+M</span> switch persona
        &nbsp;·&nbsp;
        <span className="shortcut-badge">mic</span> voice input
        &nbsp;·&nbsp;
        say <span className="shortcut-badge">{mikuMode ? 'eva mode' : 'miku mode'}</span> to switch
      </div>
      <div className="quick-btns">
        {prompts.map(p => (
          <div key={p.label} className="quick-btn" onClick={() => onSend(p.text)}>
            {p.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatBox({ onSpeakingChange, mikuMode, onModeSwitch }) {
  // ── TWO ISOLATED MESSAGE STORES — never mix ───────────────────────────────
  const [mikuMessages, setMikuMessages] = useState([])
  const [evaMessages,  setEvaMessages]  = useState([])

  const [input,        setInput]        = useState('')
  const [voiceOpen,    setVoiceOpen]    = useState(false)

  // Per-persona loading state — loading in one mode never shows in the other
  const [loadingMiku,  setLoadingMiku]  = useState(false)
  const [loadingEva,   setLoadingEva]   = useState(false)

  const bottomRef    = useRef(null)
  const mikuModeRef  = useRef(mikuMode)

  const { speak, stop, isSpeaking, ttsEnabled, toggleTTS } = useTTS(onSpeakingChange, mikuMode)

  // Keep ref in sync
  useEffect(() => { mikuModeRef.current = mikuMode }, [mikuMode])

  // Scroll to bottom when active conversation updates
  const activeMessages = mikuMode ? mikuMessages : evaMessages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // When switching modes, stop any ongoing speech
  useEffect(() => { stop() }, [mikuMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (text) => {
    const msg = (typeof text === 'string' ? text : input).trim()

    // Capture the active persona at the moment of sending — the response
    // must land in THIS persona's history even if the user switches mid-flight
    const isMiku      = mikuModeRef.current
    const isLoading   = isMiku ? loadingMiku : loadingEva
    if (!msg || isLoading) return

    stop()

    const addMsg = isMiku
      ? (m) => setMikuMessages(prev => [...prev, m])
      : (m) => setEvaMessages (prev => [...prev, m])

    const setLoading = isMiku ? setLoadingMiku : setLoadingEva

    addMsg({ role: 'user', content: msg })
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          user_id:  USER_ID,
          question: msg,
          mode:     isMiku ? 'miku' : 'eva',
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      addMsg({ role: 'bot', content: data.response })
      // Only speak if we're still in the same persona
      if (mikuModeRef.current === isMiku) speak(data.response)
    } catch (err) {
      addMsg({
        role: 'bot',
        content: `[ CONNECTION LOST ]\n\nBackend unreachable.\n\n  cd backend\n  uvicorn main:app --reload\n\n${err.message}`,
      })
    } finally {
      setLoading(false)
    }
  }, [input, stop, speak, loadingMiku, loadingEva])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  const messages   = activeMessages
  const loading    = mikuMode ? loadingMiku : loadingEva
  const showWelcome = messages.length === 0 && !loading

  return (
    <>
      {voiceOpen && (
        <VoiceSheet
          onTranscript={sendMessage}
          onClose={() => setVoiceOpen(false)}
          mikuMode={mikuMode}
          onModeSwitch={onModeSwitch}
        />
      )}

      <div className="chat-container">

        {/* Header */}
        <div className="header">
          <div className="header-title">
            {mikuMode
              ? 'VOCALOID NEURAL STUDIO // MIKU MODE'
              : 'EVA NEURAL STUDIO // EVA MODE'}
          </div>
          <div className="header-dots">
            <div className="hdot" /><div className="hdot" /><div className="hdot" />
          </div>
        </div>

        <TTSBar
          enabled={ttsEnabled}
          speaking={isSpeaking}
          onToggle={toggleTTS}
          onStop={stop}
          mikuMode={mikuMode}
        />

        {/* Chat — isolated per persona, animated on mode switch */}
        <div className={`chat-box chat-box-${mikuMode ? 'miku' : 'eva'}`}>

          {showWelcome && (
            <WelcomeScreen mikuMode={mikuMode} onSend={sendMessage} />
          )}

          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <span className="msg-text">{m.content}</span>
              {m.role === 'bot' && (
                <button className="replay-btn" onClick={() => speak(m.content)}>
                  ▶ REPLAY
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="message bot">
              <span className="msg-text processing-indicator">
                <span className="proc-dot" />
                <span className="proc-dot" />
                <span className="proc-dot" />
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <SpeechWaveform active={isSpeaking} />

        {/* Input */}
        <div className="input-area">
          <div className="input-wrap">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={mikuMode
                ? 'Talk to Miku... / ミクに何でも聞いてください'
                : 'Talk to Eva...'}
              disabled={loading}
            />
          </div>
          <button
            className="mic-btn"
            onClick={() => { stop(); setVoiceOpen(true) }}
            disabled={loading}
            title="Voice input · Ctrl+M to switch persona"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="9" y="2" width="6" height="13" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8"  y1="22" x2="16" y2="22"/>
            </svg>
          </button>
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading ? 'WAIT ▸' : 'SEND ▸'}
          </button>
        </div>

      </div>
    </>
  )
}

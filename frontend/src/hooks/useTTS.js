
import { useState, useRef, useCallback, useEffect } from 'react'

function pickJapaneseVoice() {
  const voices = window.speechSynthesis.getVoices()
  const tests = [
    v => v.name.toLowerCase().includes('kyoko'),
    v => v.name.toLowerCase().includes('haruka'),
    v => v.lang === 'ja-JP' && v.name.toLowerCase().includes('female'),
    v => v.lang === 'ja-JP',
    v => v.lang.startsWith('ja'),
  ]
  for (const t of tests) { const f = voices.find(t); if (f) return f }
  return null
}

function pickEnglishVoice() {
  const voices = window.speechSynthesis.getVoices()
  const tests = [
    // prefer warm, expressive voices over robotic ones
    v => v.name === 'Samantha',                                         
    v => v.name === 'Karen',                                             
    v => v.name === 'Moira',                                             
    v => v.name === 'Google UK English Female',                          
    v => v.name === 'Google US English',                               
    v => v.name.toLowerCase().includes('zira'),        
    v => v.name.toLowerCase().includes('aria'),                        
    v => v.lang === 'en-US' && v.name.toLowerCase().includes('female'),
    v => v.lang === 'en-GB' && !v.name.toLowerCase().includes('male'),
    v => v.lang === 'en-US' && !v.name.toLowerCase().includes('male'),
    v => v.lang.startsWith('en'),
  ]
  for (const t of tests) { const f = voices.find(t); if (f) return f }
  return null
}

function splitSentences(text) {
  const raw = text
    .replace(/([.!?…])\s+/g, '$1\n')
    .replace(/([.!?…])$/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 1)

  // If no sentences detected (no punctuation), chunk by word count to avoid huge single utterances
  if (raw.length <= 1 && text.split(' ').length > 12) {
    const words = text.split(' ')
    const chunks = []
    for (let i = 0; i < words.length; i += 10) {
      chunks.push(words.slice(i, i + 10).join(' '))
    }
    return chunks
  }
  return raw.length ? raw : [text]
}

// ── Emotional param calculation ──────────────────────────────────────────────

function emotionParams(sentence, basePitch, baseRate) {
  const s     = sentence.trim()
  const words = s.split(/\s+/).length

  // Detect sentence character
  const isQuestion    = s.endsWith('?')
  const isExclaim     = s.endsWith('!')
  const isEllipsis    = s.endsWith('…') || s.endsWith('...')
  const isShort       = words <= 4
  const isLong        = words >= 18

  // Detect emotional words for extra variation
  const lower = s.toLowerCase()
  const hasJoy   = /\b(wonderful|amazing|love|beautiful|exciting|great|fantastic|perfect)\b/.test(lower)
  const hasSad   = /\b(sorry|unfortunate|sad|miss|lost|difficult|hard|struggle)\b/.test(lower)
  const hasCurio = /\b(interesting|curious|wonder|perhaps|maybe|imagine|actually)\b/.test(lower)

  let pitch = basePitch
  let rate  = baseRate

  if (isQuestion)    { pitch += 0.08; rate -= 0.03 }
  if (isExclaim)     { pitch += 0.08; rate += 0.04 }
  if (isEllipsis)    { pitch -= 0.05; rate -= 0.06 }
  if (isShort)       { rate  += 0.03 }
  if (isLong)        { rate  -= 0.04 }
  if (hasJoy)        { pitch += 0.04; rate += 0.02 }
  if (hasSad)        { pitch -= 0.04; rate -= 0.04 }
  if (hasCurio)      { pitch += 0.02; rate -= 0.01 }

  // Tiny natural jitter so consecutive identical sentences never sound the same
  pitch += (Math.random() - 0.5) * 0.02
  rate  += (Math.random() - 0.5) * 0.015

  return {
    pitch: Math.max(0.5, Math.min(2.0, pitch)),
    rate:  Math.max(0.5, Math.min(2.0, rate)),
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTTS(onSpeakingChange, mikuMode = true) {
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const keepaliveRef   = useRef(null)
  const onSpeakingRef  = useRef(onSpeakingChange)
  const mikuModeRef    = useRef(mikuMode)
  const cancelledRef   = useRef(false)  // flag to stop sentence queue on stop()

  useEffect(() => { onSpeakingRef.current = onSpeakingChange }, [onSpeakingChange])
  useEffect(() => { mikuModeRef.current = mikuMode }, [mikuMode])

  // Preload voices — Chrome loads them async
  useEffect(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.getVoices()
    const h = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', h)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', h)
  }, [])

  useEffect(() => () => clearInterval(keepaliveRef.current), [])

  const clearKeepalive = useCallback(() => {
    clearInterval(keepaliveRef.current)
    keepaliveRef.current = null
  }, [])

  const startKeepalive = useCallback(() => {
    clearKeepalive()
    // Chrome silently kills speechSynthesis after ~15s — pause/resume every 10s prevents it
    keepaliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      } else {
        clearKeepalive()
      }
    }, 10000)
  }, [clearKeepalive])

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return
    cancelledRef.current = true   // abort any in-progress sentence queue
    clearKeepalive()
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    onSpeakingRef.current?.(false)
  }, [clearKeepalive])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !ttsEnabled) return
    stop()

    const cleaned = text
      .replace(/\[.*?\]/g, '')
      .replace(/\*+/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}/g, '')
      .trim()
    if (!cleaned) return

    const isMiku  = mikuModeRef.current
    const sentences = splitSentences(cleaned)

    // Base voice params per personality
    // Miku: lighter, more playful — higher base pitch with wider expression range
    // Eva:  warm, measured — lower base with subtle expressive variation
    const basePitch = isMiku ? 1.10 : 1.08
    const baseRate  = isMiku ? 0.94 : 0.88

    cancelledRef.current = false
    let isFirstSentence = true

    const speakNext = (idx) => {
      if (cancelledRef.current || idx >= sentences.length) {
        if (!cancelledRef.current) {
          clearKeepalive()
          setIsSpeaking(false)
          onSpeakingRef.current?.(false)
        }
        return
      }

      const sentence = sentences[idx].trim()
      if (!sentence) { speakNext(idx + 1); return }

      const { pitch, rate } = emotionParams(sentence, basePitch, baseRate)
      const utt = new SpeechSynthesisUtterance(sentence)

      const voice = isMiku ? pickJapaneseVoice() : pickEnglishVoice()
      if (voice) utt.voice = voice

      utt.lang   = isMiku ? 'ja-JP' : 'en-US'
      utt.pitch  = pitch
      utt.rate   = rate
      utt.volume = 1.0

      if (isFirstSentence) {
        isFirstSentence = false
        utt.onstart = () => {
          setIsSpeaking(true)
          onSpeakingRef.current?.(true)
          startKeepalive()
        }
      }

      utt.onend = () => {
        if (!cancelledRef.current) speakNext(idx + 1)
      }
      utt.onerror = (e) => {
        // 'interrupted' fires when cancel() is called — not a real error
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          speakNext(idx + 1)  // skip broken sentence, continue
        }
      }

      window.speechSynthesis.speak(utt)
    }

    speakNext(0)
  }, [ttsEnabled, stop, startKeepalive, clearKeepalive])

  const toggleTTS = useCallback(() => {
    setTtsEnabled(prev => { if (prev) stop(); return !prev })
  }, [stop])

  return { speak, stop, isSpeaking, ttsEnabled, toggleTTS }
}

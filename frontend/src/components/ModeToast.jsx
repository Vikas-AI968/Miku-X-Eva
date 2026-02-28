export default function ModeToast({ mode }) {
  const isMiku = mode === 'miku'
  return (
    <div className={`mode-toast ${isMiku ? 'mode-toast-miku' : 'mode-toast-eva'}`}>
      <span className="mode-toast-icon">{isMiku ? '✦' : '◈'}</span>
      <div>
        <div className="mode-toast-title">{isMiku ? 'MIKU MODE' : 'EVA MODE'}</div>
        <div className="mode-toast-sub">
          {isMiku ? '初音ミク — Japanese voice activated' : 'Eva — English Voice Activated'}
        </div>
      </div>
    </div>
  )
}

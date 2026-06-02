import { useEffect, useRef, useState } from 'react'
import { structureReport, submitReport } from '../api'
import './VoiceReport.css'

const LANG_CODES = { en: 'en-US', sv: 'sv-SE' }

const FIELDS = [
  { key: 'hazard', label: 'Hazard' },
  { key: 'machine', label: 'Machine' },
  { key: 'location', label: 'Location' },
  { key: 'risk_type', label: 'Risk type' },
  { key: 'description', label: 'Description' },
  { key: 'recommended_action', label: 'Recommended action' },
]

function severityClass(sev) {
  const s = String(sev ?? '').toLowerCase()
  if (s.includes('high') || s.includes('critical') || s.includes('severe')) return 'high'
  if (s.includes('med')) return 'medium'
  if (s.includes('low') || s.includes('minor')) return 'low'
  return 'medium'
}

function VoiceReport({ open, onClose }) {
  const [lang, setLang] = useState('en')
  const [recording, setRecording] = useState(false)
  const [rawText, setRawText] = useState('')
  const [structured, setStructured] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const SR =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const stopRecognition = () => {
    const r = recognitionRef.current
    if (r) {
      try {
        r.onend = null
        r.stop()
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null
    }
  }

  // reset everything whenever the modal closes
  useEffect(() => {
    if (open) return
    stopRecognition()
    setRecording(false)
    setRawText('')
    setStructured(null)
    setResult(null)
    setError('')
    setLoading(false)
  }, [open])

  // Esc to close + lock background scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const startRecording = () => {
    if (!SR) return
    setError('')
    setStructured(null)
    setResult(null)
    const rec = new SR()
    rec.lang = LANG_CODES[lang]
    rec.interimResults = true
    rec.continuous = true
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += chunk + ' '
        else interim += chunk
      }
      setRawText((finalText + interim).trim())
    }
    rec.onerror = (e) => {
      setError(
        e.error === 'not-allowed'
          ? 'Microphone permission denied.'
          : 'Speech recognition error — try again.',
      )
      setRecording(false)
    }
    rec.onend = () => {
      setRecording(false)
      recognitionRef.current = null
    }
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
  }

  const handleStructure = async () => {
    if (!rawText.trim()) {
      setError('Nothing was captured yet — record or type the report.')
      return
    }
    stopRecognition()
    setRecording(false)
    setLoading(true)
    setError('')
    try {
      const report = await structureReport(rawText.trim(), lang)
      setStructured(report)
    } catch {
      setError('Could not reach the report service. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await submitReport(structured)
      setResult(res)
    } catch {
      setError('Could not submit the report — please retry.')
    } finally {
      setLoading(false)
    }
  }

  const reRecord = () => {
    setStructured(null)
    setError('')
  }

  if (!open) return null

  return (
    <div className="vr" role="dialog" aria-modal="true" aria-label="Voice damage report">
      <button type="button" className="vr__backdrop" aria-label="Close" onClick={onClose} />
      <div className="vr__panel">
        <header className="vr__head">
          <span className="vr__grip" aria-hidden="true" />
          <h2 className="vr__title">
            {result ? 'Report submitted' : structured ? 'Review report' : 'Voice report'}
          </h2>
          <button type="button" className="vr__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="vr__body">
          {error && <p className="vr__error">{error}</p>}

          {/* STEP 1 — record */}
          {!structured && !result && (
            <div className="vr__record">
              <div className="vr__langs" role="group" aria-label="Language">
                {Object.keys(LANG_CODES).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`vr__lang${lang === code ? ' is-active' : ''}`}
                    onClick={() => setLang(code)}
                  >
                    {code === 'en' ? 'English' : 'Svenska'}
                  </button>
                ))}
              </div>

              {SR ? (
                <>
                  <button
                    type="button"
                    className={`mic${recording ? ' is-recording' : ''}`}
                    onClick={recording ? stopRecognition : startRecording}
                    aria-label={recording ? 'Stop recording' : 'Start recording'}
                  >
                    <MicGlyph />
                  </button>
                  <p className="vr__hint">
                    {recording ? 'Listening… tap to stop' : 'Tap the mic and describe the damage'}
                  </p>
                </>
              ) : (
                <p className="vr__hint">
                  Voice input isn’t supported in this browser — type the report below.
                </p>
              )}

              <textarea
                className="vr__textarea"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="e.g. The left rear tyre on the tipper truck is badly worn and losing pressure near the depot gate."
                rows={4}
              />

              <button
                type="button"
                className="vr__primary"
                onClick={handleStructure}
                disabled={loading || !rawText.trim()}
              >
                {loading ? 'Structuring…' : 'Structure report'}
              </button>
            </div>
          )}

          {/* STEP 2 — review structured report */}
          {structured && !result && (
            <div className="vr__review">
              <div className="vr__sevrow">
                <span className={`sev sev--${severityClass(structured.severity)}`}>
                  {structured.severity || 'Unrated'}
                </span>
                <span className="vr__sevlabel">severity</span>
              </div>

              <dl className="vr__fields">
                {FIELDS.map(({ key, label }) =>
                  structured[key] ? (
                    <div className="vr__field" key={key}>
                      <dt>{label}</dt>
                      <dd>{structured[key]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>

              {Array.isArray(structured.missing_info) && structured.missing_info.length > 0 && (
                <div className="vr__missing">
                  <span className="vr__missing-title">⚠ Missing info</span>
                  <div className="vr__chips">
                    {structured.missing_info.map((m) => (
                      <span className="chip" key={m}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="vr__actions">
                <button type="button" className="vr__ghost" onClick={reRecord} disabled={loading}>
                  Re-record
                </button>
                <button
                  type="button"
                  className="vr__primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Submitting…' : 'Confirm & submit'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — result */}
          {result && (
            <div className="vr__done">
              {result.escalated ? (
                <div className="vr__escalated">ESCALATED</div>
              ) : (
                <div className="vr__success" aria-hidden="true">
                  ✓
                </div>
              )}

              <p className="vr__donetext">
                {result.escalated
                  ? 'This hazard has been reported repeatedly and was escalated.'
                  : 'Report saved successfully.'}
              </p>

              <div className="vr__summary">
                {result.hazard && (
                  <div className="vr__field">
                    <dt>Hazard</dt>
                    <dd>{result.hazard}</dd>
                  </div>
                )}
                {typeof result.repeat_count === 'number' && (
                  <div className="vr__field">
                    <dt>Times reported</dt>
                    <dd>{result.repeat_count}</dd>
                  </div>
                )}
              </div>

              <button type="button" className="vr__primary" onClick={onClose}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default VoiceReport

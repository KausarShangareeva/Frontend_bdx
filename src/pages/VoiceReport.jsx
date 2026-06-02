import { useEffect, useRef, useState } from 'react'
import { Power, Volume2 } from 'lucide-react'
import { structureReport, submitReport } from '../api'
import './VoiceReport.css'

const LANG_CODES = { en: 'en-US', sv: 'sv-SE' }

const FIELDS = [
  { key: 'hazard', label: 'Hazard' },
  { key: 'machine', label: 'Machine' },
  { key: 'location', label: 'Location' },
  { key: 'risk_type', label: 'Risk type' },
  { key: 'description', label: 'Description' },
]

// Local sample used only when the backend is unreachable (offline preview).
function buildMockReport(rawText) {
  return {
    hazard: 'Reported hazard',
    machine: 'unspecified',
    location: 'unspecified',
    risk_type: 'General',
    severity: 'medium',
    description: rawText,
    recommended_action: 'Review on site and address before continuing.',
    missing_info: ['machine id', 'exact location'],
    timestamp: '',
  }
}

function severityClass(sev) {
  const s = String(sev ?? '').toLowerCase()
  if (s.includes('high') || s.includes('critical') || s.includes('severe')) return 'high'
  if (s.includes('med')) return 'medium'
  if (s.includes('low') || s.includes('minor')) return 'low'
  return 'medium'
}

function VoiceReport({ open, media = null, onClose }) {
  const [lang, setLang] = useState('en')
  const [recording, setRecording] = useState(false)
  const [rawText, setRawText] = useState('')
  const [structured, setStructured] = useState(null)
  const [result, setResult] = useState(null)
  const [attachment, setAttachment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [speaking, setSpeaking] = useState(false)
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
    setRecording(false)
  }

  // reset everything whenever the modal closes
  useEffect(() => {
    if (open) return
    stopRecognition()
    setRecording(false)
    setRawText('')
    setStructured(null)
    setResult(null)
    setAttachment(null)
    setError('')
    setNotice('')
    setLoading(false)
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [open])

  // when opened, pick up any media passed in from the action sheet
  useEffect(() => {
    if (open) setAttachment(media ?? null)
  }, [open, media])

  // warm up TTS voices (they load asynchronously)
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    synth.getVoices()
    const onVoices = () => synth.getVoices()
    synth.addEventListener?.('voiceschanged', onVoices)
    return () => synth.removeEventListener?.('voiceschanged', onVoices)
  }, [])

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
      const messages = {
        'not-allowed': 'Microphone permission denied — allow it in the browser site settings.',
        'service-not-allowed': 'Microphone permission denied — allow it in the browser site settings.',
        network: 'Speech recognition needs an internet connection (audio is processed online).',
        'no-speech': 'No speech detected — check your microphone is unmuted and try again.',
        'audio-capture': 'No microphone found — check your input device.',
        aborted: 'Recording stopped.',
      }
      setError(messages[e.error] || `Speech recognition error (${e.error}) — try again.`)
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
    setNotice('')
    try {
      const report = await structureReport(rawText.trim(), lang)
      setStructured(report)
    } catch {
      // Backend unreachable → offline preview so the flow is still demoable
      setStructured(buildMockReport(rawText.trim()))
      setNotice('Offline preview — backend not reachable, showing a sample structure.')
    } finally {
      setLoading(false)
    }
  }

  const onAttach = (e, type) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAttachment({ url: reader.result, type })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setNotice('')
    const payload = {
      ...structured,
      media_url: attachment?.url ?? '',
      media_type: attachment?.type ?? 'photo',
    }
    try {
      const res = await submitReport(payload)
      setResult(res)
    } catch {
      // Backend unreachable → offline preview of the result screen
      setResult({ ...payload, repeat_count: 1, escalated: false })
      setNotice('Offline preview — report was not sent (backend not reachable).')
    } finally {
      setLoading(false)
    }
  }

  const toggleSpeak = () => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }

    const fullText = [
      'Safety check.',
      structured.hazard ? `Hazard: ${structured.hazard}.` : '',
      structured.severity ? `Severity: ${structured.severity}.` : '',
      structured.risk_type ? `Risk type: ${structured.risk_type}.` : '',
      structured.machine && structured.machine !== 'unspecified' ? `Machine: ${structured.machine}.` : '',
      structured.location && structured.location !== 'unspecified' ? `Location: ${structured.location}.` : '',
      structured.description ? `${structured.description}.` : '',
      structured.recommended_action ? `Recommended action: ${structured.recommended_action}.` : '',
    ]
      .filter(Boolean)
      .join(' ')

    // Split into sentences/short chunks — Chrome silently stops on long
    // single utterances (~15s), so we queue many short ones instead.
    const chunks = fullText.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) || [fullText]

    const voices = synth.getVoices()
    const want = LANG_CODES[lang].toLowerCase()
    const voice =
      voices.find((v) => v.lang?.toLowerCase() === want) ||
      voices.find((v) => v.lang?.toLowerCase().startsWith(lang))

    synth.cancel()
    setSpeaking(true)

    let i = 0
    const speakNext = () => {
      if (i >= chunks.length) {
        setSpeaking(false)
        return
      }
      const utter = new SpeechSynthesisUtterance(chunks[i])
      utter.lang = LANG_CODES[lang]
      if (voice) utter.voice = voice
      utter.rate = 0.95
      utter.pitch = 1
      utter.onend = () => {
        i += 1
        speakNext()
      }
      utter.onerror = () => setSpeaking(false)
      synth.speak(utter)
    }
    speakNext()
  }

  const reRecord = () => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setStructured(null)
    setError('')
    setNotice('')
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
          {notice && <p className="vr__notice">{notice}</p>}

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
                    {recording ? <Power size={34} strokeWidth={2.4} /> : <MicGlyph />}
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

              <MediaBlock attachment={attachment} onAttach={onAttach} onRemove={() => setAttachment(null)} />

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

              {structured.recommended_action && (
                <div className="vr__action-box">
                  <span className="vr__action-label">Recommended action</span>
                  <p className="vr__action-text">{structured.recommended_action}</p>
                  <button type="button" className="vr__listen" onClick={toggleSpeak}>
                    <Volume2 size={18} strokeWidth={2.2} />
                    {speaking ? 'Stop' : 'Listen to report'}
                  </button>
                </div>
              )}

              {attachment && (
                <div className="vr__mediaprev">
                  {attachment.type === 'video' ? (
                    <video className="vr__thumb" src={attachment.url} controls />
                  ) : (
                    <img className="vr__thumb" src={attachment.url} alt="Damage attachment" />
                  )}
                  <span className="vr__medialabel">
                    {attachment.type === 'video' ? '🎥 Video attached' : '📷 Photo attached'}
                  </span>
                </div>
              )}

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

function MediaBlock({ attachment, onAttach, onRemove }) {
  return (
    <div className="vr__mediablock">
      {attachment && (
        <div className="vr__media">
          {attachment.type === 'video' ? (
            <video className="vr__thumb" src={attachment.url} controls />
          ) : (
            <img className="vr__thumb" src={attachment.url} alt="Damage attachment" />
          )}
          <span className="vr__medialabel">
            {attachment.type === 'video' ? '🎥 Video attached' : '📷 Photo attached'}
          </span>
          <button type="button" className="vr__mediaremove" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}

      <div className="vr__attach">
        <label className="vr__attachbtn">
          <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => onAttach(e, 'photo')} />
          📷 {attachment?.type === 'photo' ? 'Replace photo' : 'Add photo'}
        </label>
        <label className="vr__attachbtn">
          <input type="file" accept="video/*" capture="environment" hidden onChange={(e) => onAttach(e, 'video')} />
          🎥 {attachment?.type === 'video' ? 'Replace video' : 'Add video'}
        </label>
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

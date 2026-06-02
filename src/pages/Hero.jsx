import { useNavigate } from 'react-router-dom'
import './Hero.css'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path
        d="M3 8a2 2 0 0 1 2-2h2l1.2-1.6A2 2 0 0 1 11.8 3.6h.4a2 2 0 0 1 1.6.8L15 6h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function Hero() {
  const navigate = useNavigate()
  const goTraining = () => navigate('/training')

  return (
    <div className="hero">
      <span className="corner corner--tl" aria-hidden="true" />
      <span className="corner corner--tr" aria-hidden="true" />
      <span className="corner corner--bl" aria-hidden="true" />
      <span className="corner corner--br" aria-hidden="true" />

      <header className="hero__bar">
        <div className="brand">
          <span className="brand__badge">
            <EyeIcon />
          </span>
          <span className="brand__name">Thain</span>
        </div>
        <button type="button" className="btn btn--sm" onClick={goTraining}>
          Start training
        </button>
      </header>

      <main className="hero__content">
        <h1 className="hero__title">training</h1>

        <p className="hero__lead">
          for the part of the driving test a theory app can't teach, trained with
          your webcam. <span className="accent">No car required.</span>
        </p>

        <button type="button" className="btn btn--lg" onClick={goTraining}>
          <CameraIcon />
          Start training
        </button>

        <p className="hero__tags">
          Blind spot <span className="dot">•</span> Mirror routine{' '}
          <span className="dot">•</span> Moving gaze
        </p>
      </main>
    </div>
  )
}

export default Hero

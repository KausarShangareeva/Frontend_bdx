import { useNavigate } from 'react-router-dom'
import './Training.css'

function Training() {
  const navigate = useNavigate()

  return (
    <div className="training">
      <button type="button" className="back" onClick={() => navigate('/')}>
        <span aria-hidden="true">←</span> Back
      </button>

      <div className="caption">
        <h1>get ready</h1>
        <p>Calibrating your webcam…</p>
      </div>
    </div>
  )
}

export default Training

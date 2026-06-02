import './Safety.css'

function Safety() {
  return (
    <div className="safety">
      <h1 className="safety__title">BDX Safety Assistant</h1>
      <p>Welcome Operator 👋</p>

      <div className="machine-card">
        🚜
        <br />
        3D Machine
      </div>

      <button className="safety__btn">▶ Watch Instruction</button>

      <div className="card">👁 Inspection Points</div>

      <div className="card">🌦 Weather Report</div>

      <div className="card">📸 Damage Report</div>
    </div>
  )
}

export default Safety

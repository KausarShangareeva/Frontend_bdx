import "./Safety.css";

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

      <div className="card">
        <h3>👁 Inspection Points</h3>
        <p>Check machine safety points</p>
      </div>

      <div className="card">
        <h3>🌦 Weather Report</h3>
        <p>Current weather conditions</p>
      </div>

      <div className="card">
        <h3>📸 Damage Report</h3>
        <p>Upload a photo for AI analysis</p>
      </div>
    </div>
  );
}

export default Safety;

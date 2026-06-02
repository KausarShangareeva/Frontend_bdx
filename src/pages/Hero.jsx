import { useNavigate } from "react-router-dom";
import "./Hero.css";

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8a2 2 0 0 1 2-2h2l1.2-1.6A2 2 0 0 1 11.8 3.6h.4a2 2 0 0 1 1.6.8L15 6h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Hero() {
  const navigate = useNavigate();
  const goTraining = () => navigate("/training");

  return (
    <div className="hero">
      <span className="corner corner--tl" aria-hidden="true" />
      <span className="corner corner--tr" aria-hidden="true" />
      <span className="corner corner--bl" aria-hidden="true" />
      <span className="corner corner--br" aria-hidden="true" />

      <header className="hero__bar">
        <div className="brand">
          <img className="brand__logo" src="/bdx_svg.svg" alt="BDX" />
        </div>
      </header>

      <main className="hero__content">
        <h1 className="hero__title">
          BD<span className="red">X</span> safety{" "}
          <span className="red">desk</span>
        </h1>

        <p className="hero__lead">
          Transforming field safety: How voice and AI turn complex risk
          assessments into 10-second reports
        </p>

        <button type="button" className="btn btn--lg" onClick={goTraining}>
          <CameraIcon />
          Start training
        </button>

        <p className="hero__tags">
          Blind spot <span className="dot">•</span> Mirror routine{" "}
          <span className="dot">•</span> Moving gaze
        </p>
      </main>
    </div>
  );
}

export default Hero;

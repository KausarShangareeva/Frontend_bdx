import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VoiceReport from "./VoiceReport.jsx";
import WeatherCard from "../components/WeatherCard.jsx";
import "./Safety.css";

// Truck parts → each carries its own safety check
const PARTS = {
  bed: {
    label: "Tipper bed",
    risk: "high",
    riskLabel: "High risk",
    score: 15,
    question: "Is the tipper bed fully lowered?",
    points: [
      "Confirm the bed is all the way down before driving",
      "If unsure, get out and check it",
      "Do not drive if it is still raised",
    ],
    why: "A raised bed can hit overhead lines or bridges and flip the truck.",
  },
  load: {
    label: "Load / straps",
    risk: "high",
    riskLabel: "High risk",
    score: 12,
    question: "Is the load secured with straps?",
    points: [
      "Check all straps are tight and undamaged",
      "Make sure nothing can shift or fall",
      "Re-check after the first few minutes of driving",
    ],
    why: "An unsecured load can fall onto the road and cause serious accidents.",
  },
  cabin: {
    label: "Cabin",
    risk: "medium",
    riskLabel: "Medium risk",
    score: 7,
    question: "Is the cabin clear and mirrors set?",
    points: [
      "Adjust mirrors before moving off",
      "Remove loose items from the dashboard",
      "Fasten your seatbelt",
    ],
    why: "Poor visibility and clutter slow your reaction in an emergency.",
  },
  wheels: {
    label: "Wheels / steps",
    risk: "low",
    riskLabel: "Low risk",
    score: 3,
    question: "Are the tyres and steps in good shape?",
    points: [
      "Check tyre pressure and tread depth",
      "Look for cuts or bulges in the rubber",
      "Keep steps clean to avoid slips",
    ],
    why: "Worn tyres reduce grip and increase stopping distance.",
  },
};

const REPORT_OPTIONS = [
  {
    id: "voice",
    title: "Voice report",
    sub: "AI converts speech into a structured report",
    icon: MicIcon,
  },
  {
    id: "photo",
    title: "Photo",
    sub: "Capture a still image of the damage",
    icon: CameraIcon,
    accept: "image/*",
  },
  {
    id: "video",
    title: "Video",
    sub: "Film a short clip of the damage",
    icon: VideoIcon,
    accept: "video/*",
  },
];

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
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

function VideoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m16 10 4.3-2.6a.8.8 0 0 1 1.2.7v7.8a.8.8 0 0 1-1.2.7L16 14v-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Safety() {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [media, setMedia] = useState(null);
  const [selected, setSelected] = useState(null);

  const openVoice = (withMedia = null) => {
    setMedia(withMedia);
    setSheetOpen(false);
    setVoiceOpen(true);
  };

  const onPickMedia = (e, type) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openVoice({ url: reader.result, type });
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const part = selected ? PARTS[selected] : null;

  const partProps = (id) => ({
    className: `part part--${PARTS[id].risk}${selected === id ? " is-selected" : ""}`,
    role: "button",
    tabIndex: 0,
    "aria-label": `${PARTS[id].label} — ${PARTS[id].riskLabel}`,
    onClick: () => setSelected(id),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSelected(id);
      }
    },
  });

  return (
    <div className="safety">
      <header className="safety__bar">
        <button
          type="button"
          className="back"
          onClick={() => navigate("/")}
          aria-label="Back"
        >
          <BackIcon />
        </button>
        <div className="brand">
          <img className="brand__logo" src="/bdx_svg.svg" alt="BDX" />
          <h1 className="brand__sub">
            <span>Safety</span>
            <span>Assistant</span>
          </h1>
        </div>
      </header>

      <main className="safety__content">
        <p className="safety__eyebrow">Welcome Operator 👋</p>

        {/* Interactive truck safety map */}
        <div className="machine-card">
          <button type="button" className="watch">
            <PlayIcon />
            Watch
          </button>
          <span className="machine-card__hint">
            Tap a glowing part of the truck
          </span>

          <svg
            className="truck"
            viewBox="0 0 440 210"
            role="group"
            aria-label="Truck safety map"
          >
            <defs>
              <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#cf5a52" />
                <stop offset="1" stopColor="#9c322d" />
              </linearGradient>
              <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b5403a" />
                <stop offset="1" stopColor="#7e2a26" />
              </linearGradient>
              <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d8ab4a" />
                <stop offset="1" stopColor="#a87d22" />
              </linearGradient>
              <linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#3c434e" />
                <stop offset="1" stopColor="#1f242c" />
              </linearGradient>
              <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d4e4ee" />
                <stop offset="1" stopColor="#92acbb" />
              </linearGradient>
              <radialGradient id="gHub" cx="0.4" cy="0.4" r="0.7">
                <stop offset="0" stopColor="#dde1e5" />
                <stop offset="1" stopColor="#878e96" />
              </radialGradient>
            </defs>

            {/* ground shadow */}
            <ellipse
              cx="220"
              cy="191"
              rx="166"
              ry="9"
              fill="rgba(0,0,0,0.07)"
            />

            {/* exhaust stack */}
            <rect x="256" y="84" width="7" height="66" rx="3" fill="#2b313a" />
            <rect x="252" y="80" width="15" height="8" rx="2" fill="#3c434e" />

            {/* tipper bed */}
            <g {...partProps("bed")}>
              <polygon
                points="76,146 256,146 248,92 100,92"
                fill="url(#gHigh)"
                stroke="#8a2c28"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <rect
                x="98"
                y="86"
                width="152"
                height="9"
                rx="3"
                fill="#8a2c28"
              />
              <line
                x1="138"
                y1="99"
                x2="138"
                y2="142"
                stroke="#7e2a26"
                strokeWidth="2"
                opacity="0.4"
              />
              <line
                x1="176"
                y1="99"
                x2="176"
                y2="142"
                stroke="#7e2a26"
                strokeWidth="2"
                opacity="0.4"
              />
              <line
                x1="214"
                y1="99"
                x2="214"
                y2="142"
                stroke="#7e2a26"
                strokeWidth="2"
                opacity="0.4"
              />
            </g>

            {/* load / straps */}
            <g {...partProps("load")}>
              <rect
                x="112"
                y="62"
                width="140"
                height="30"
                rx="7"
                fill="url(#gLoad)"
              />
              <rect
                x="146"
                y="59"
                width="7"
                height="36"
                rx="2"
                fill="#3a1714"
                opacity="0.7"
              />
              <rect
                x="212"
                y="59"
                width="7"
                height="36"
                rx="2"
                fill="#3a1714"
                opacity="0.7"
              />
            </g>

            {/* chassis */}
            <rect
              x="60"
              y="146"
              width="292"
              height="15"
              rx="4"
              fill="url(#gSteel)"
            />
            <rect x="60" y="158" width="292" height="4" rx="2" fill="#15181d" />

            {/* cabin */}
            <g {...partProps("cabin")}>
              <path
                d="M268 161 V118 a12 12 0 0 1 12-12 h40 a10 10 0 0 1 10 10 v45 Z"
                fill="url(#gMed)"
                stroke="#8f6a1c"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M304 112 h16 a8 8 0 0 1 8 8 v16 h-24 Z"
                fill="url(#gGlass)"
              />
              <line
                x1="290"
                y1="120"
                x2="290"
                y2="158"
                stroke="#8f6a1c"
                strokeWidth="2"
                opacity="0.5"
              />
              <rect
                x="295"
                y="138"
                width="9"
                height="3"
                rx="1.5"
                fill="#6e5215"
              />
              <rect
                x="330"
                y="150"
                width="6"
                height="9"
                rx="2"
                fill="#ffe08a"
              />
            </g>

            {/* wheels / steps */}
            <g {...partProps("wheels")}>
              <circle cx="120" cy="164" r="29" fill="#15181d" />
              <circle
                cx="120"
                cy="164"
                r="29"
                fill="none"
                stroke="#2f9e6a"
                strokeWidth="2.5"
                opacity="0.55"
              />
              <circle cx="120" cy="164" r="20" fill="#23282f" />
              <circle cx="120" cy="164" r="12" fill="url(#gHub)" />
              <circle cx="120" cy="164" r="3.5" fill="#5f656d" />
              <circle cx="300" cy="164" r="29" fill="#15181d" />
              <circle
                cx="300"
                cy="164"
                r="29"
                fill="none"
                stroke="#2f9e6a"
                strokeWidth="2.5"
                opacity="0.55"
              />
              <circle cx="300" cy="164" r="20" fill="#23282f" />
              <circle cx="300" cy="164" r="12" fill="url(#gHub)" />
              <circle cx="300" cy="164" r="3.5" fill="#5f656d" />
            </g>
          </svg>

          <div className="risk-legend">
            <span className="risk">
              <i className="dot dot--low" /> Low
            </span>
            <span className="risk">
              <i className="dot dot--medium" /> Medium
            </span>
            <span className="risk">
              <i className="dot dot--high" /> High risk
            </span>
          </div>
        </div>

        {/* Safety check — slides in right under the truck */}
        {part && (
          <section className="check" key={selected} aria-live="polite">
            <div className="check__head">
              <ShieldIcon />
              Safety check
              <button
                type="button"
                className="check__close"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <span className={`check__risk check__risk--${part.risk}`}>
              {part.riskLabel} · score {part.score}
            </span>
            <h3 className="check__q">{part.question}</h3>
            <ul className="check__points">
              {part.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="check__why">
              <strong>Why:</strong> {part.why}
            </p>
            <button
              type="button"
              className="check__confirm"
              onClick={() => setSelected(null)}
            >
              ✓ Confirm checked
            </button>
          </section>
        )}

        {/* Weather mini-dashboard along the driver's route */}
        <WeatherCard />

        {/* Damage report — opens action sheet */}
        <button
          type="button"
          className="action"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <span className="action__icon" aria-hidden="true">
            <CameraIcon />
          </span>
          <span className="action__text">
            <span className="action__title">Report Damage</span>
            <span className="action__sub">Voice, photo or video</span>
          </span>
          <span className="action__chev" aria-hidden="true">
            →
          </span>
        </button>
      </main>

      {sheetOpen && (
        <div
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Damage report"
        >
          <button
            type="button"
            className="sheet__backdrop"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
          />
          <div className="sheet__panel">
            <span className="sheet__grip" aria-hidden="true" />
            <h2 className="sheet__title">Report damage</h2>
            <p className="sheet__sub">Choose how to capture the damage</p>

            <ul className="sheet__list">
              {REPORT_OPTIONS.map(({ id, title, sub, icon: Icon, accept }) => {
                const inner = (
                  <>
                    <span className="opt__icon">
                      <Icon />
                    </span>
                    <span className="opt__text">
                      <span className="opt__title">{title}</span>
                      <span className="opt__sub">{sub}</span>
                    </span>
                    <span className="opt__chev" aria-hidden="true">
                      →
                    </span>
                  </>
                );
                return (
                  <li key={id}>
                    {accept ? (
                      <label className="opt">
                        <input
                          type="file"
                          className="opt__file"
                          accept={accept}
                          capture="environment"
                          onChange={(e) =>
                            onPickMedia(e, id === "video" ? "video" : "photo")
                          }
                        />
                        {inner}
                      </label>
                    ) : (
                      <button
                        type="button"
                        className="opt"
                        onClick={() => openVoice(null)}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              className="sheet__cancel"
              onClick={() => setSheetOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <VoiceReport
        open={voiceOpen}
        media={media}
        onClose={() => setVoiceOpen(false)}
      />
    </div>
  );
}

export default Safety;

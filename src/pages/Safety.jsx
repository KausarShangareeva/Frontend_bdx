import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Safety.css";

const ROUTE = {
  from: "Stockholm",
  to: "Gävle",
  now: { city: "Stockholm", temp: 7, cond: "Light rain", icon: "🌦" },
  stops: [
    { city: "Stockholm", temp: 7, icon: "🌦" },
    { city: "Uppsala", temp: 6, icon: "🌧" },
    { city: "Gävle", temp: 4, icon: "🌨" },
  ],
  stats: [
    { label: "Wind", value: "8 m/s" },
    { label: "Visibility", value: "6 km" },
    { label: "Road", value: "Wet" },
  ],
};

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
    sub: "sub: AI converts speech into a structured report",
    icon: MicIcon,
  },
  {
    id: "photo",
    title: "Photo",
    sub: "Capture a still image of the damage",
    icon: CameraIcon,
  },
  {
    id: "video",
    title: "Video",
    sub: "Film a short clip of the damage",
    icon: VideoIcon,
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
  const [selected, setSelected] = useState(null);

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
            viewBox="0 0 420 200"
            role="group"
            aria-label="Truck safety map"
          >
            {/* ground */}
            <line
              x1="36"
              y1="178"
              x2="372"
              y2="178"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="2"
            />

            {/* tipper bed */}
            <g {...partProps("bed")}>
              <polygon points="70,150 92,82 236,82 252,150" fill="#c9913a" />
            </g>

            {/* load / straps */}
            <g {...partProps("load")}>
              <rect
                x="100"
                y="62"
                width="124"
                height="24"
                rx="5"
                fill="#d24b63"
              />
              <line
                x1="124"
                y1="62"
                x2="124"
                y2="86"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="3"
              />
              <line
                x1="200"
                y1="62"
                x2="200"
                y2="86"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="3"
              />
            </g>

            {/* chassis */}
            <rect
              x="50"
              y="150"
              width="276"
              height="15"
              rx="3"
              fill="#2c313a"
            />

            {/* cabin */}
            <g {...partProps("cabin")}>
              <path
                d="M258 104h54a8 8 0 0 1 8 8v38h-62v-38a8 8 0 0 1 0-8Z"
                fill="#e3b545"
              />
              <rect
                x="300"
                y="112"
                width="15"
                height="20"
                rx="3"
                fill="#cdd6dd"
              />
            </g>

            {/* wheels / steps */}
            <g {...partProps("wheels")}>
              <circle cx="110" cy="166" r="25" fill="#2c313a" />
              <circle
                cx="110"
                cy="166"
                r="25"
                fill="none"
                stroke="#2fb67d"
                strokeWidth="4"
              />
              <circle cx="110" cy="166" r="9" fill="#aeb6bd" />
              <circle cx="282" cy="166" r="25" fill="#2c313a" />
              <circle
                cx="282"
                cy="166"
                r="25"
                fill="none"
                stroke="#2fb67d"
                strokeWidth="4"
              />
              <circle cx="282" cy="166" r="9" fill="#aeb6bd" />
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
        <section className="wcard" aria-label="Weather along route">
          <div className="wcard__head">
            <div>
              <span className="wcard__eyebrow">Weather along route</span>
              <div className="wcard__route">
                {ROUTE.from} <span className="wcard__arrow">→</span> {ROUTE.to}
              </div>
            </div>
            <button
              type="button"
              className="wcard__refresh"
              aria-label="Refresh"
            >
              ⟳
            </button>
          </div>

          <div className="wcard__now">
            <span className="wcard__nowicon">{ROUTE.now.icon}</span>
            <span className="wcard__temp">{ROUTE.now.temp}°</span>
            <div className="wcard__meta">
              <span className="wcard__cond">{ROUTE.now.cond}</span>
              <span className="wcard__city">{ROUTE.now.city} · now</span>
            </div>
          </div>

          <div className="wcard__stops">
            {ROUTE.stops.map((s) => (
              <div className="stop" key={s.city}>
                <span className="stop__icon">{s.icon}</span>
                <span className="stop__temp">{s.temp}°</span>
                <span className="stop__city">{s.city}</span>
              </div>
            ))}
          </div>

          <div className="wcard__stats">
            {ROUTE.stats.map((st) => (
              <div className="stat" key={st.label}>
                <span className="stat__value">{st.value}</span>
                <span className="stat__label">{st.label}</span>
              </div>
            ))}
          </div>
        </section>

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
            <span className="action__title">Damage Report</span>
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
              {REPORT_OPTIONS.map(({ id, title, sub, icon: Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="opt"
                    onClick={() => setSheetOpen(false)}
                  >
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
                  </button>
                </li>
              ))}
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
    </div>
  );
}

export default Safety;

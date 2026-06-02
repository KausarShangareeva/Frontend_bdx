import { useEffect, useState } from "react";
import { fetchRoute } from "../weather";

const DEFAULT_FROM = "Stockholm";
const DEFAULT_TO = "Gävle";

function WeatherCard() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (f, t) => {
    if (!f.trim() || !t.trim()) {
      setError("Enter both a start and destination city.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setRoute(await fetchRoute(f.trim(), t.trim()));
    } catch (e) {
      setError(e.message || "Could not load weather.");
    } finally {
      setLoading(false);
    }
  };

  // load the default route once on mount (state updates only after await,
  // so nothing is set synchronously inside the effect body)
  useEffect(() => {
    let active = true;
    fetchRoute(DEFAULT_FROM, DEFAULT_TO)
      .then((r) => active && setRoute(r))
      .catch((e) => active && setError(e.message || "Could not load weather."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    load(from, to);
  };

  const now = route?.from;
  const stops = route ? [route.from, route.to] : [];

  return (
    <section className="wcard" aria-label="Weather along route">
      <div className="wcard__head">
        <div>
          <span className="wcard__eyebrow">Weather along route</span>
          <div className="wcard__route">
            {(route ? route.from.city : from) || "From"}{" "}
            <span className="wcard__arrow">→</span>{" "}
            {(route ? route.to.city : to) || "To"}
          </div>
        </div>
      </div>

      <form className="wcard__form" onSubmit={onSubmit}>
        <input
          className="wcard__input"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="From"
          aria-label="Start city"
        />
        <span className="wcard__arrow" aria-hidden="true">
          →
        </span>
        <input
          className="wcard__input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          aria-label="Destination city"
        />
        <button type="submit" className="wcard__go" disabled={loading}>
          {loading ? "…" : "Update"}
        </button>
      </form>

      {error && <p className="wcard__error">{error}</p>}

      {now && (
        <>
          <div className="wcard__now">
            <span className="wcard__nowicon">{now.icon}</span>
            <span className="wcard__temp">{now.temp}°</span>
            <div className="wcard__meta">
              <span className="wcard__cond">{now.cond}</span>
              <span className="wcard__city">{now.city} · now</span>
            </div>
          </div>

          <div className="wcard__stops">
            {stops.map((s) => (
              <div className="stop" key={s.city}>
                <span className="stop__icon">{s.icon}</span>
                <span className="stop__temp">{s.temp}°</span>
                <span className="stop__city">{s.city}</span>
              </div>
            ))}
          </div>

          <div className="wcard__stats">
            <div className="stat">
              <span className="stat__value">{now.windValue}</span>
              <span className="stat__label">Wind</span>
            </div>
            <div className="stat">
              <span className="stat__value">{now.visibility}</span>
              <span className="stat__label">Visibility</span>
            </div>
            <div className="stat">
              <span className="stat__value">{now.road}</span>
              <span className="stat__label">Road</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default WeatherCard;

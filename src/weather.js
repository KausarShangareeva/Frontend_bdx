// Live weather for the route weather card, via the free Open-Meteo API
// (no API key required). Geocode a city name → coordinates, then read the
// current conditions for those coordinates.
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// WMO weather codes → emoji + human label
const WMO = {
  0: { icon: "☀️", label: "Clear sky" },
  1: { icon: "🌤", label: "Mainly clear" },
  2: { icon: "⛅", label: "Partly cloudy" },
  3: { icon: "☁️", label: "Overcast" },
  45: { icon: "🌫", label: "Fog" },
  48: { icon: "🌫", label: "Rime fog" },
  51: { icon: "🌦", label: "Light drizzle" },
  53: { icon: "🌦", label: "Drizzle" },
  55: { icon: "🌧", label: "Dense drizzle" },
  61: { icon: "🌦", label: "Light rain" },
  63: { icon: "🌧", label: "Rain" },
  65: { icon: "🌧", label: "Heavy rain" },
  66: { icon: "🌧", label: "Freezing rain" },
  67: { icon: "🌧", label: "Freezing rain" },
  71: { icon: "🌨", label: "Light snow" },
  73: { icon: "🌨", label: "Snow" },
  75: { icon: "❄️", label: "Heavy snow" },
  77: { icon: "🌨", label: "Snow grains" },
  80: { icon: "🌦", label: "Rain showers" },
  81: { icon: "🌧", label: "Rain showers" },
  82: { icon: "⛈", label: "Violent showers" },
  85: { icon: "🌨", label: "Snow showers" },
  86: { icon: "🌨", label: "Snow showers" },
  95: { icon: "⛈", label: "Thunderstorm" },
  96: { icon: "⛈", label: "Thunderstorm + hail" },
  99: { icon: "⛈", label: "Thunderstorm + hail" },
};

export function describeCode(code) {
  return WMO[code] ?? { icon: "🌡", label: "Unknown" };
}

function roadFromCode(code) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code))
    return "Wet";
  return "Dry";
}

function visibilityFromCode(code) {
  if ([45, 48].includes(code)) return "Low";
  if ([65, 67, 75, 82, 86, 95, 96, 99].includes(code)) return "Reduced";
  return "Good";
}

async function geocode(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding service unavailable.");
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) throw new Error(`City not found: "${name}"`);
  return { name: hit.name, lat: hit.latitude, lon: hit.longitude };
}

export async function fetchCityWeather(name) {
  const geo = await geocode(name);
  const params = new URLSearchParams({
    latitude: geo.lat,
    longitude: geo.lon,
    current: "temperature_2m,weather_code,wind_speed_10m",
    wind_speed_unit: "ms",
    timezone: "auto",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error("Weather service unavailable.");
  const { current } = await res.json();
  const d = describeCode(current.weather_code);
  return {
    city: geo.name,
    temp: Math.round(current.temperature_2m),
    code: current.weather_code,
    icon: d.icon,
    cond: d.label,
    windValue: `${Math.round(current.wind_speed_10m)} m/s`,
    road: roadFromCode(current.weather_code),
    visibility: visibilityFromCode(current.weather_code),
  };
}

// Weather for both ends of a route, fetched in parallel.
export async function fetchRoute(from, to) {
  const [start, end] = await Promise.all([
    fetchCityWeather(from),
    fetchCityWeather(to),
  ]);
  return { from: start, to: end };
}

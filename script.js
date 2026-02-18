/* ===========================
   DOM ELEMENTS
=========================== */
const weatherDiv  = document.getElementById("weather");
const loadingDiv  = document.getElementById("loading");
const errorDiv    = document.getElementById("error");

const iconEl      = document.getElementById("icon");
const tempEl      = document.getElementById("temp");
const feelsEl     = document.getElementById("feels");
const conditionEl = document.getElementById("condition");
const humidityEl  = document.getElementById("humidity");
const windEl      = document.getElementById("wind");
const pressureEl  = document.getElementById("pressure");
const locationEl  = document.getElementById("location");

const cityInput   = document.getElementById("city-input");
const searchBtn   = document.getElementById("search-btn");

/* ===========================
   CONFIG
=========================== */
const CACHE_KEY = "skypulse-last-weather";

/* ===========================
   WEATHER CODE MAP
=========================== */
const weatherMap = {
  0:  { emoji: "☀️", text: "Clear sky" },
  1:  { emoji: "🌤️", text: "Mainly clear" },
  2:  { emoji: "⛅", text: "Partly cloudy" },
  3:  { emoji: "☁️", text: "Overcast" },
  45: { emoji: "🌫️", text: "Fog" },
  48: { emoji: "🌫️", text: "Rime fog" },
  51: { emoji: "🌧️", text: "Light drizzle" },
  53: { emoji: "🌧️", text: "Moderate drizzle" },
  55: { emoji: "🌧️", text: "Heavy drizzle" },
  61: { emoji: "🌧️", text: "Slight rain" },
  63: { emoji: "🌧️", text: "Moderate rain" },
  65: { emoji: "🌧️", text: "Heavy rain" },
  71: { emoji: "❄️", text: "Light snow" },
  73: { emoji: "❄️", text: "Moderate snow" },
  75: { emoji: "❄️", text: "Heavy snow" },
  80: { emoji: "🌦️", text: "Rain showers" },
  81: { emoji: "🌦️", text: "Heavy showers" },
  82: { emoji: "⛈️", text: "Violent showers" },
  95: { emoji: "⛈️", text: "Thunderstorm" },
  99: { emoji: "⛈️", text: "Severe thunderstorm" },
  default: { emoji: "🌍", text: "Unknown weather" }
};

/* ===========================
   UI HELPERS
=========================== */
function showLoading() {
  loadingDiv.hidden = false;
  weatherDiv.hidden = true;
  errorDiv.hidden   = true;
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.hidden = false;
  weatherDiv.hidden = true;
  loadingDiv.hidden = true;
}

function showWeather() {
  loadingDiv.hidden = true;
  errorDiv.hidden = true;
  weatherDiv.hidden = false;
}

/* ===========================
   CACHE HELPERS
=========================== */
function saveToCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}

function loadFromCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  return JSON.parse(cached).data;
}

/* ===========================
   WEATHER FETCH
=========================== */
async function fetchWeather(lat, lon, cityName) {
  showLoading();

  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure",
      timezone: "auto"
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (!response.ok) throw new Error("Weather service unavailable");

    const data = await response.json();
    updateUI(data.current, cityName);
    saveToCache({ current: data.current, cityName });

  } catch (error) {
    const cached = loadFromCache();
    if (cached) {
      updateUI(cached.current, cached.cityName);
    } else {
      showError("Unable to fetch weather. Check your connection.");
    }
  }
}

/* ===========================
   UI UPDATE
=========================== */
function updateUI(current, cityName) {
  const weather = weatherMap[current.weather_code] || weatherMap.default;

  iconEl.textContent      = weather.emoji;
  tempEl.textContent      = `${Math.round(current.temperature_2m)}°C`;
  feelsEl.textContent     = `Feels like ${Math.round(current.apparent_temperature)}°C`;
  conditionEl.textContent = weather.text;
  humidityEl.textContent  = `${current.relative_humidity_2m}%`;
  windEl.textContent      = `${Math.round(current.wind_speed_10m)} km/h`;
  pressureEl.textContent  = `${Math.round(current.surface_pressure)} hPa`;
  locationEl.textContent  = cityName;

  showWeather();
}

/* ===========================
   CITY SEARCH
=========================== */
async function searchCity(city) {
  if (!city.trim()) return showError("Enter a city name");

  showLoading();

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
    );

    const data = await response.json();
    if (!data.results?.length) throw new Error();

    const place = data.results[0];
    fetchWeather(
      place.latitude,
      place.longitude,
      `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`
    );

  } catch {
    showError("City not found");
  }
}

/* ===========================
   GEOLOCATION
=========================== */
function getUserLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      fetchWeather(
        pos.coords.latitude,
        pos.coords.longitude,
        "Your location"
      );
    },
    () => showError("Location access denied. Search manually.")
  );
}

/* ===========================
   EVENTS
=========================== */
searchBtn.addEventListener("click", () => searchCity(cityInput.value));
cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchCity(cityInput.value);
});

/* ===========================
   INIT
=========================== */
window.addEventListener("load", () => {
  const cached = loadFromCache();
  if (cached) {
    updateUI(cached.current, cached.cityName);
  } else {
    getUserLocation();
  }
});

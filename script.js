const weatherDiv   = document.getElementById('weather');
    const loadingDiv   = document.getElementById('loading');
    const errorDiv     = document.getElementById('error');
    const iconEl       = document.getElementById('icon');
    const tempEl       = document.getElementById('temp');
    const feelsEl      = document.getElementById('feels');
    const conditionEl  = document.getElementById('condition');
    const humidityEl   = document.getElementById('humidity');
    const windEl       = document.getElementById('wind');
    const pressureEl   = document.getElementById('pressure');
    const locationEl   = document.getElementById('location');

    const cityInput    = document.getElementById('city-input');
    const searchBtn    = document.getElementById('search-btn');

    // WMO Weather interpretation codes → emoji + text
    const weatherMap = {
      0:   { emoji: '☀️', text: 'Clear sky' },
      1:   { emoji: '🌤️', text: 'Mainly clear' },
      2:   { emoji: '⛅', text: 'Partly cloudy' },
      3:   { emoji: '☁️', text: 'Overcast' },
      45:  { emoji: '🌫️', text: 'Fog' },
      48:  { emoji: '🌫️', text: 'Depositing rime fog' },
      51:  { emoji: '🌧️', text: 'Light drizzle' },
      53:  { emoji: '🌧️', text: 'Moderate drizzle' },
      55:  { emoji: '🌧️', text: 'Dense drizzle' },
      61:  { emoji: '🌧️', text: 'Slight rain' },
      63:  { emoji: '🌧️', text: 'Moderate rain' },
      65:  { emoji: '🌧️', text: 'Heavy rain' },
      71:  { emoji: '❄️', text: 'Slight snow' },
      73:  { emoji: '❄️', text: 'Moderate snow' },
      75:  { emoji: '❄️', text: 'Heavy snow' },
      80:  { emoji: '🌦️', text: 'Slight rain showers' },
      81:  { emoji: '🌦️', text: 'Moderate rain showers' },
      82:  { emoji: '⛈️', text: 'Violent rain showers' },
      95:  { emoji: '⛈️', text: 'Thunderstorm' },
      96:  { emoji: '⛈️', text: 'Thunderstorm with slight hail' },
      99:  { emoji: '⛈️', text: 'Thunderstorm with heavy hail' },
      // Fallback
      default: { emoji: '🌍', text: 'Unknown' }
    };

    async function fetchWeather(lat, lon, cityName = null) {
      try {
        showLoading();
        const params = new URLSearchParams({
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure',
          timezone: 'auto',
          temperature_unit: 'celsius',
          wind_speed_unit: 'kmh'
        });

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error('Weather service error');

        const data = await res.json();
        const now = data.current;

        // Update UI
        const code = now.weather_code ?? 0;
        const cond = weatherMap[code] || weatherMap.default;

        iconEl.textContent      = cond.emoji;
        tempEl.textContent      = `${Math.round(now.temperature_2m)}°C`;
        feelsEl.textContent     = `Feels like ${Math.round(now.apparent_temperature)}°C`;
        conditionEl.textContent = cond.text;
        humidityEl.textContent  = `${now.relative_humidity_2m}%`;
        windEl.textContent      = `${Math.round(now.wind_speed_10m)} km/h`;
        pressureEl.textContent  = `${Math.round(now.surface_pressure)} hPa`;
        locationEl.textContent  = cityName || `${lat.toFixed(3)}, ${lon.toFixed(3)}`;

        weatherDiv.style.display = 'block';
        errorDiv.style.display   = 'none';
      } catch (err) {
        showError(err.message || 'Failed to fetch weather');
      } finally {
        loadingDiv.style.display = 'none';
      }
    }

    async function searchCity(city) {
      if (!city.trim()) return showError('Enter a city name');

      try {
        showLoading();
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
        const data = await res.json();

        if (!data.results?.length) throw new Error('City not found');

        const place = data.results[0];
        await fetchWeather(place.latitude, place.longitude, place.name + (place.admin1 ? `, ${place.admin1}` : ''));
      } catch (err) {
        showError(err.message || 'Location not found');
      }
    }

    function getUserLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Your location'),
          err => {
            showError('Location access denied. Please search manually.');
            cityInput.focus();
          }
        );
      } else {
        showError('Geolocation not supported. Please search manually.');
      }
    }

    function showLoading() {
      loadingDiv.style.display = 'block';
      weatherDiv.style.display = 'none';
      errorDiv.style.display   = 'none';
    }

    function showError(msg) {
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
      weatherDiv.style.display = 'none';
      loadingDiv.style.display = 'none';
    }

    // Event listeners
    searchBtn.addEventListener('click', () => searchCity(cityInput.value));
    cityInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchCity(cityInput.value);
    });

    // Start with user location
    getUserLocation();
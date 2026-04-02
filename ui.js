// ===============================
// UI HANDLING
// ===============================

const UI = {
    // DOM Elements
    elements: {
        body: document.body,
        themeToggle: document.getElementById('themeToggle'),
        searchForm: document.getElementById('searchForm'),
        cityInput: document.getElementById('cityInput'),
        searchBtn: document.getElementById('searchBtn'),
        locationBtn: document.getElementById('locationBtn'),
        history: document.getElementById('history'),
        loader: document.getElementById('loader'),
        error: document.getElementById('error'),
        weatherCard: document.getElementById('weatherCard'),
        cityName: document.getElementById('cityName'),
        weatherIcon: document.getElementById('weatherIcon'),
        temperature: document.getElementById('temperature'),
        description: document.getElementById('description'),
        humidity: document.getElementById('humidity'),
        wind: document.getElementById('wind'),
        pressure: document.getElementById('pressure'),
        feelsLike: document.getElementById('feelsLike'),
        lastUpdated: document.getElementById('lastUpdated'),
        forecast: document.getElementById('forecast')
    },
    
    /**
     * Show loader
     */
    showLoader() {
        this.elements.loader.classList.remove('hidden');
        this.elements.weatherCard.classList.add('hidden');
        this.hideError();
    },
    
    /**
     * Hide loader
     */
    hideLoader() {
        this.elements.loader.classList.add('hidden');
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.elements.error.textContent = message;
        this.elements.error.classList.remove('hidden');
        this.hideLoader();
    },
    
    /**
     * Hide error message
     */
    hideError() {
        this.elements.error.classList.add('hidden');
    },
    
    /**
     * Display weather data
     * @param {Object} data - Weather data
     */
    displayWeather(data) {
        this.elements.cityName.textContent = `${data.city}${data.country ? `, ${data.country}` : ''}`;
        this.elements.temperature.textContent = data.current.temperature;
        this.elements.description.textContent = Utils.weatherCodeToText(data.current.weathercode);
        this.elements.humidity.textContent = `${data.current.humidity}%`;
        this.elements.wind.textContent = `${data.current.windspeed} km/h`;
        this.elements.pressure.textContent = `${data.current.pressure} hPa`;
        this.elements.feelsLike.textContent = `${data.current.feelsLike}°C`;
        
        const iconUrl = Utils.getWeatherIcon(data.current.weathercode);
        this.elements.weatherIcon.src = iconUrl;
        this.elements.weatherIcon.alt = Utils.weatherCodeToText(data.current.weathercode);
        
        // Last updated time
        const now = new Date();
        this.elements.lastUpdated.textContent = `Updated: ${Utils.formatTime(now)}`;
        
        this.elements.weatherCard.classList.remove('hidden');
        this.hideLoader();
        this.hideError();
    },
    
    /**
     * Display forecast data
     * @param {Object} data - Weather data with daily forecast
     */
    displayForecast(data) {
        if (!data.daily || !data.daily.times) return;
        
        const forecastHtml = data.daily.times.map((day, index) => {
            const date = new Date(day);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconUrl = Utils.getWeatherIcon(data.daily.weathercodes[index]);
            const tempMax = data.daily.tempMax[index];
            const tempMin = data.daily.tempMin[index];
            
            return `
                <div class="forecast-card">
                    <div class="forecast-day">${dayName}</div>
                    <img class="forecast-icon" src="${iconUrl}" alt="Weather icon">
                    <div class="forecast-temp">
                        <span class="forecast-max">${tempMax}°</span>
                        <span class="forecast-min">${tempMin}°</span>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.forecast.innerHTML = forecastHtml;
    },
    
    /**
     * Display search history
     * @param {Array} history - Array of city names
     */
    displayHistory(history) {
        if (!history || history.length === 0) {
            this.elements.history.innerHTML = '';
            return;
        }
        
        const historyHtml = history.map(city => `
            <button class="history-item" data-city="${city}">${city}</button>
        `).join('');
        
        this.elements.history.innerHTML = historyHtml;
        
        // Add click handlers
        document.querySelectorAll('.history-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.dataset.city;
                if (city && window.App) {
                    window.App.searchCity(city);
                }
            });
        });
    },
    
    /**
     * Initialize theme
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.elements.body.classList.add('dark');
            this.updateThemeIcon('dark');
        } else {
            this.elements.body.classList.add('light');
            this.updateThemeIcon('light');
        }
    },
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        if (this.elements.body.classList.contains('dark')) {
            this.elements.body.classList.remove('dark');
            this.elements.body.classList.add('light');
            localStorage.setItem('theme', 'light');
            this.updateThemeIcon('light');
        } else {
            this.elements.body.classList.remove('light');
            this.elements.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            this.updateThemeIcon('dark');
        }
    },
    
    /**
     * Update theme toggle button icon
     * @param {string} theme - Current theme ('dark' or 'light')
     */
    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
};

// Make UI available globally
window.UI = UI;
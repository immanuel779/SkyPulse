// ===============================
// MAIN APPLICATION
// ===============================

const App = {
    // State
    state: {
        currentCity: null,
        searchHistory: [],
        isLoading: false
    },
    
    /**
     * Initialize the application
     */
    async init() {
        // Initialize UI
        UI.initTheme();
        UI.hideError();
        
        // Load search history
        this.loadHistory();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load default city
        await this.loadDefaultCity();
        
        // Register service worker
        this.registerServiceWorker();
    },
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Theme toggle
        UI.elements.themeToggle.addEventListener('click', () => {
            UI.toggleTheme();
        });
        
        // Search form
        UI.elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const city = UI.elements.cityInput.value.trim();
            if (city) {
                this.searchCity(city);
            }
        });
        
        // Location button
        UI.elements.locationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });
        
        // Input debounce (optional)
        const debouncedSearch = Utils.debounce((value) => {
            if (value.length > 2) {
                // Optional: Show suggestions
            }
        }, 500);
        
        UI.elements.cityInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    },
    
    /**
     * Search for a city and display weather
     * @param {string} city - City name
     */
    async searchCity(city) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        UI.showLoader();
        UI.hideError();
        
        try {
            const data = await WeatherAPI.getWeatherByCity(city);
            UI.displayWeather(data);
            UI.displayForecast(data);
            this.saveToHistory(data.city);
            this.state.currentCity = data.city;
        } catch (error) {
            console.error('Search error:', error);
            UI.showError(error.message || 'Unable to fetch weather data. Please try again.');
        } finally {
            this.state.isLoading = false;
            UI.hideLoader();
        }
    },
    
    /**
     * Get weather for current location
     */
    getCurrentLocation() {
        if (!navigator.geolocation) {
            UI.showError('Geolocation is not supported by your browser');
            return;
        }
        
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        UI.showLoader();
        UI.hideError();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const data = await WeatherAPI.getWeatherByLocation(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    UI.displayWeather(data);
                    UI.displayForecast(data);
                    this.saveToHistory(data.city);
                    this.state.currentCity = data.city;
                } catch (error) {
                    console.error('Location error:', error);
                    UI.showError('Unable to get weather for your location');
                } finally {
                    this.state.isLoading = false;
                    UI.hideLoader();
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Unable to get your location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out.';
                        break;
                    default:
                        message += 'Please try again.';
                }
                UI.showError(message);
                this.state.isLoading = false;
                UI.hideLoader();
            }
        );
    },
    
    /**
     * Save city to search history
     * @param {string} city - City name
     */
    saveToHistory(city) {
        // Remove if exists
        this.state.searchHistory = this.state.searchHistory.filter(c => c !== city);
        // Add to beginning
        this.state.searchHistory.unshift(city);
        // Keep only last 10
        this.state.searchHistory = this.state.searchHistory.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(this.state.searchHistory));
        UI.displayHistory(this.state.searchHistory);
    },
    
    /**
     * Load search history from localStorage
     */
    loadHistory() {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            try {
                this.state.searchHistory = JSON.parse(saved);
                UI.displayHistory(this.state.searchHistory);
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        }
    },
    
    /**
     * Load default city on app start
     */
    async loadDefaultCity() {
        const history = this.state.searchHistory;
        
        if (history.length > 0) {
            await this.searchCity(history[0]);
        } else {
            // Try to get location, fallback to London
            this.getCurrentLocation();
            // Fallback after 5 seconds if location fails
            setTimeout(() => {
                if (!this.state.currentCity && !this.state.isLoading) {
                    this.searchCity('London');
                }
            }, 5000);
        }
    },
    
    /**
     * Register service worker
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered:', registration.scope);
                    })
                    .catch(error => {
                        console.error('Service Worker registration failed:', error);
                    });
            });
        }
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App = App;
    App.init();
});
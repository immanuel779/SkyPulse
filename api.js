// ===============================
// API HANDLING
// ===============================

const API = {
    // Base URLs
    GEOCODING_URL: 'https://geocoding-api.open-meteo.com/v1/search',
    WEATHER_URL: 'https://api.open-meteo.com/v1/forecast',
    
    // Cache instance
    cache: new Utils.WeatherCache(10 * 60 * 1000), // 10 minutes
    
    /**
     * Get coordinates for a city name
     * @param {string} cityName - City name to search
     * @returns {Promise<Object>} - City data with coordinates
     */
    async getCoordinates(cityName) {
        const cacheKey = `coord_${cityName.toLowerCase()}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            const url = `${this.GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }
            
            const result = data.results[0];
            const cityData = {
                name: result.name,
                country: result.country,
                latitude: result.latitude,
                longitude: result.longitude
            };
            
            this.cache.set(cacheKey, cityData);
            return cityData;
            
        } catch (error) {
            console.error('Geocoding API error:', error);
            throw new Error(error.message === 'City not found' 
                ? `"${cityName}" not found. Please check spelling or try a different city.`
                : 'Unable to find location. Please check your connection.');
        }
    },
    
    /**
     * Get weather data for coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Weather data
     */
    async getWeather(lat, lon) {
        const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            const url = `${this.WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,windspeed_10m_max&hourly=relative_humidity_2m,pressure_msl&timezone=auto`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Get current hour's humidity and pressure
            const currentHour = new Date().getHours();
            const humidity = data.hourly?.relative_humidity_2m?.[currentHour] || '--';
            const pressure = data.hourly?.pressure_msl?.[currentHour] || '--';
            
            const weatherData = {
                current: {
                    temperature: Math.round(data.current_weather.temperature),
                    windspeed: Math.round(data.current_weather.windspeed),
                    weathercode: data.current_weather.weathercode,
                    humidity: humidity,
                    pressure: pressure,
                    feelsLike: Math.round(data.daily.apparent_temperature_max[0] || data.current_weather.temperature)
                },
                daily: {
                    times: data.daily.time,
                    weathercodes: data.daily.weathercode,
                    tempMax: data.daily.temperature_2m_max.map(t => Math.round(t)),
                    tempMin: data.daily.temperature_2m_min.map(t => Math.round(t)),
                    feelsLikeMax: data.daily.apparent_temperature_max?.map(t => Math.round(t)),
                    precipitation: data.daily.precipitation_sum?.map(p => p)
                },
                timestamp: Date.now()
            };
            
            this.cache.set(cacheKey, weatherData);
            return weatherData;
            
        } catch (error) {
            console.error('Weather API error:', error);
            throw new Error('Failed to fetch weather data. Please try again.');
        }
    },
    
    /**
     * Get weather for a city name (combined function)
     * @param {string} cityName - City name
     * @returns {Promise<Object>} - Complete weather data with city info
     */
    async getWeatherByCity(cityName) {
        const cityData = await this.getCoordinates(cityName);
        const weatherData = await this.getWeather(cityData.latitude, cityData.longitude);
        
        return {
            city: cityData.name,
            country: cityData.country,
            ...weatherData
        };
    },
    
    /**
     * Get weather for current location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Weather data with location name
     */
    async getWeatherByLocation(lat, lon) {
        const weatherData = await this.getWeather(lat, lon);
        
        // Reverse geocoding to get city name (using Open-Meteo's geocoding)
        try {
            const reverseUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`;
            const response = await fetch(reverseUrl);
            const data = await response.json();
            const cityName = data.results?.[0]?.name || 'Your Location';
            
            return {
                city: cityName,
                country: data.results?.[0]?.country || '',
                ...weatherData
            };
        } catch {
            return {
                city: 'Your Location',
                ...weatherData
            };
        }
    }
};

// Make API available globally
window.WeatherAPI = API;
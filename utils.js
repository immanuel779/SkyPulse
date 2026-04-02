// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted time
 */
function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Get weather icon URL based on WMO code
 * @param {number} code - WMO weather code
 * @returns {string} - Icon URL
 */
function getWeatherIcon(code) {
    const icons = {
        clear: 'https://cdn-icons-png.flaticon.com/512/869/869869.png',
        partlyCloudy: 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png',
        cloudy: 'https://cdn-icons-png.flaticon.com/512/414/414825.png',
        rain: 'https://cdn-icons-png.flaticon.com/512/414/414974.png',
        snow: 'https://cdn-icons-png.flaticon.com/512/642/642102.png',
        fog: 'https://cdn-icons-png.flaticon.com/512/4005/4005901.png',
        thunderstorm: 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png'
    };
    
    if (code === 0) return icons.clear;
    if (code === 1 || code === 2) return icons.partlyCloudy;
    if (code === 3) return icons.cloudy;
    if (code === 45 || code === 48) return icons.fog;
    if (code >= 51 && code <= 67) return icons.rain;
    if (code >= 71 && code <= 77) return icons.snow;
    if (code >= 80 && code <= 82) return icons.rain;
    if (code >= 85 && code <= 86) return icons.snow;
    if (code >= 95 && code <= 99) return icons.thunderstorm;
    
    return icons.partlyCloudy;
}

/**
 * Convert WMO weather code to text description
 * @param {number} code - WMO weather code
 * @returns {string} - Weather description
 */
function weatherCodeToText(code) {
    const descriptions = {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        56: 'Freezing Drizzle',
        57: 'Heavy Freezing Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        66: 'Freezing Rain',
        67: 'Heavy Freezing Rain',
        71: 'Slight Snow',
        73: 'Moderate Snow',
        75: 'Heavy Snow',
        77: 'Snow Grains',
        80: 'Slight Rain Showers',
        81: 'Moderate Rain Showers',
        82: 'Violent Rain Showers',
        85: 'Slight Snow Showers',
        86: 'Heavy Snow Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
        99: 'Heavy Thunderstorm with Hail'
    };
    
    return descriptions[code] || 'Variable Weather';
}

/**
 * Cache management for API responses
 */
class WeatherCache {
    constructor(ttl = 10 * 60 * 1000) { // 10 minutes default
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    clear() {
        this.cache.clear();
    }
}

// Export for use in other modules
window.Utils = {
    debounce,
    formatDate,
    formatTime,
    getWeatherIcon,
    weatherCodeToText,
    WeatherCache
};
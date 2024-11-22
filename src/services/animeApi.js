const PROXY_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Cache helper functions
const getFromCache = (key) => {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        const now = new Date().getTime();
        
        // Cache valid for 30 minutes
        if (now - timestamp > 30 * 60 * 1000) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Cache error:', error);
        return null;
    }
};

const setToCache = (key, data) => {
    try {
        const cacheData = {
            data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Cache error:', error);
    }
};

export const getSeasonalAnime = async () => {
    const cacheKey = 'seasonal';
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${PROXY_URL}/anime/season`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    setToCache(cacheKey, data);
    return data;
};

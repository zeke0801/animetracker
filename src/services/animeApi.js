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

export const searchAnime = async (query) => {
    const cacheKey = `search-${query}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${PROXY_URL}/anime?q=${encodeURIComponent(query)}&limit=20`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    setToCache(cacheKey, data);
    return data;
};

export const getAnimeDetails = async (id) => {
    const cacheKey = `anime-${id}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${PROXY_URL}/anime/${id}?fields=id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    const data = await response.json();
    setToCache(cacheKey, data);
    return data;
};

export const getSeasonalAnime = async () => {
    const cacheKey = 'seasonal-anime';
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

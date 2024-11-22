require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your React app
app.use(cors({
    origin: ['https://animetrackerbyz.netlify.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Seasonal anime endpoint
app.get('/api/anime/season', async (req, res) => {
    try {
        const season = getCurrentSeason();
        const year = new Date().getFullYear();
        const apiUrl = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?limit=100&fields=id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status,start_date,broadcast,media_type,source,rating,start_season`;
        
        console.log('Fetching seasonal anime from:', apiUrl); // Debug log
        console.log('Using MAL Client ID:', process.env.MAL_CLIENT_ID); // Debug log
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('MAL API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                headers: response.headers
            });
            throw new Error(`MAL API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Seasonal anime error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch seasonal anime',
            message: error.message 
        });
    }
});

// Search anime endpoint
app.get('/api/anime', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        const apiUrl = `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(q)}&limit=20&fields=id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status,start_date,broadcast,media_type,source,rating,start_season`;
        
        console.log('Searching anime:', apiUrl); // Debug log
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MAL API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText,
                url: apiUrl,
                headers: Object.fromEntries(response.headers)
            });
            return res.status(response.status).json({ 
                error: 'MAL API error',
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Search anime error:', error);
        res.status(500).json({ 
            error: 'Failed to search anime',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Proxy endpoint for MAL API
app.get('/api/*', async (req, res) => {
    try {
        const path = req.params[0];
        const queryString = new URLSearchParams(req.query).toString();
        const apiUrl = `https://api.myanimelist.net/v2/${path}${queryString ? '?' + queryString : ''}`;
        
        console.log('Fetching from:', apiUrl); // Debug log
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-MAL-CLIENT-ID': process.env.MAL_CLIENT_ID,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`MAL API responded with status ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch from MAL API',
            message: error.message 
        });
    }
});

// Helper function to get current season
function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
}

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log('Environment variables:');
    console.log('MAL Client ID:', process.env.MAL_CLIENT_ID ? 'Set' : 'Not set');
    console.log('MAL Client ID length:', process.env.MAL_CLIENT_ID ? process.env.MAL_CLIENT_ID.length : 0);
    console.log('Client URL:', process.env.CLIENT_URL);
});

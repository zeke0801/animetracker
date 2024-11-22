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
        const apiUrl = `https://api.myanimelist.net/v2/anime/season/${year}/${season}?limit=100&fields=id,title,main_picture,broadcast,rating,start_season,synopsis,genres`;
        
        console.log('Fetching seasonal anime from:', apiUrl);
        
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
        console.error('Seasonal anime error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch seasonal anime',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Helper function to get current season
function getCurrentSeason() {
    const month = new Date().getMonth() + 1; // getMonth() returns 0-11
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
}

app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
    console.log('Environment variables:');
    console.log('MAL Client ID:', process.env.MAL_CLIENT_ID ? 'Set' : 'Not set');
});

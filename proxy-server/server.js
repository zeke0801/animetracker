require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your React app
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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


app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});

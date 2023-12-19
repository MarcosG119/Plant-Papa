import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import process from 'process';

const app = express();
const port = 3000;

const TREFLE_API_TOKEN = process.env.TREFLE_API_KEY;

// Enable CORS
app.use(cors());

// Define your proxy endpoint
app.get('/api/plants/search', async (req, res) => {
    try {
        const apiUrl = 'https://trefle.io/api/v1/plants/search';
        

        const response = await axios.get(apiUrl, {
            params: {
                token: TREFLE_API_TOKEN,
                q: req.query,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
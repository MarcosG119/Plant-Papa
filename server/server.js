import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import process from 'process';
import FormData from 'form-data';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

const TREFLE_API_TOKEN = process.env.TREFLE_API_KEY;
const PLANTNET_API_KEY = process.env.REACT_APP_PLANTNET_API_KEY;

// Enable CORS
app.use(cors({
    origin: 'http://localhost:4173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


app.get('/api/plants/:plantId', async (req, res) => {
    try {
        const apiUrl = `https://trefle.io/api/v1/plants/${req.params.plantId}`;
        

        const response = await axios.get(apiUrl, {
            params: {
                token: TREFLE_API_TOKEN,
            },
        });

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



const destination = "upload/images";

const diskStorage = multer.diskStorage({
  destination: destination,
  filename: (req, file, cb) => {
    return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 1000000,
  },
});

app.post('/api/plantnet/upload', upload.single("images"), async (req, res) => {
  try {
    const formData = new FormData();

    console.log('Request Body:', req.body);
    console.log('Request File:', req.file);
    console.log('Form Data:', formData);


    formData.append('organs', 'flower');
    formData.append('images', fs.createReadStream(req.file.path));

    if (!req.file) {
        console.error('No file provided in the request');
        return res.status(400).json({ error: 'No file provided' });
      }

    const project = 'all';

    const { status, data } = await axios.post('https://my-api.plantnet.org/v2/identify/' + project + `?api-key=${PLANTNET_API_KEY}`, formData, {
      headers: formData.getHeaders(),
    });

    console.log('status', status);
    console.log('data', data);

    console.log('Identification status: ', status);
    res.json(data);
  } catch (error) {
    console.error('Server error uploading image:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
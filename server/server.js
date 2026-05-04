const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rute tes dasar
app.get('/', (req, res) => {
    res.send('API Server MANPROSI is running!');
});

// Tes Koneksi Database
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Koneksi database berhasil!', data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal terhubung ke database. Cek apakah MySQL sudah menyala.' });
    }
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
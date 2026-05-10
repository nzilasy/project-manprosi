const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const { Role } = require('./models/index');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API Server MANPROSI is running!');
});

app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ message: 'Koneksi database berhasil!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal terhubung ke database.' });
  }
});

const DEFAULT_ROLES = [
  { name: 'petani',     description: 'Petani pemilik lahan' },
  { name: 'pengurus',   description: 'Pengurus desa' },
  { name: 'masyarakat', description: 'Masyarakat desa' },
  { name: 'wisata',     description: 'Pengelola wisata desa' },
];

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(async () => {
  console.log('Semua tabel tersinkronisasi.');

  const count = await Role.count();
  if (count === 0) {
    await Role.bulkCreate(DEFAULT_ROLES);
    console.log('Data role berhasil di-seed.');
  }

  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
});
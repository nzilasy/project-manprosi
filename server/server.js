const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');
const {
  Role,
  Kategori,
  Komoditas,
} = require('./models/index');

const authRoutes = require('./routes/authRoutes');
const lahanRoutes = require('./routes/lahanRoutes');
const komoditasRoutes = require('./routes/komoditasRoutes');
const panenRoutes = require('./routes/panenRoutes');

const { logger } = require('./middleware/loggerMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware global
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes utama
app.use('/api/auth', authRoutes);
app.use('/api/lahan', lahanRoutes);
app.use('/api/komoditas', komoditasRoutes);
app.use('/api/panen', panenRoutes);

// Route tes dasar
app.get('/', (req, res) => {
  res.json({
    message: 'API Server MANPROSI is running!',
  });
});

// Route tes koneksi database
app.get('/api/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();

    return res.json({
      message: 'Koneksi database berhasil!',
    });
  } catch (error) {
    console.error('Database connection error:', error);

    return res.status(500).json({
      message: 'Gagal terhubung ke database.',
      error: error.message,
    });
  }
});

// Middleware error harus selalu setelah semua route
app.use(notFound);
app.use(errorHandler);

const DEFAULT_ROLES = [
  {
    name: 'petani',
    description: 'Petani pemilik lahan',
  },
  {
    name: 'pengurus',
    description: 'Pengurus desa',
  },
  {
    name: 'masyarakat',
    description: 'Masyarakat desa',
  },
  {
    name: 'wisata',
    description: 'Pengelola wisata desa',
  },
];

const DEFAULT_KOMODITAS = [
  {
    nama_komoditas: 'Padi',
    satuan: 'ton',
    deskripsi: 'Komoditas padi sawah',
  },
  {
    nama_komoditas: 'Jagung',
    satuan: 'ton',
    deskripsi: 'Komoditas jagung',
  },
  {
    nama_komoditas: 'Kopi',
    satuan: 'kg',
    deskripsi: 'Komoditas kopi',
  },
  {
    nama_komoditas: 'Sayuran',
    satuan: 'kg',
    deskripsi: 'Komoditas sayuran',
  },
];

async function seedRoles() {
  for (const role of DEFAULT_ROLES) {
    await Role.findOrCreate({
      where: {
        name: role.name,
      },
      defaults: {
        description: role.description,
      },
    });
  }

  console.log('Data role berhasil disinkronkan.');
}

async function seedKomoditas() {
  const [kategoriPertanian] = await Kategori.findOrCreate({
    where: {
      nama_kategori: 'Pertanian',
    },
  });

  for (const item of DEFAULT_KOMODITAS) {
    const [komoditas, created] = await Komoditas.findOrCreate({
      where: {
        nama_komoditas: item.nama_komoditas,
      },
      defaults: {
        id_kategori: kategoriPertanian.id_kategori,
        satuan: item.satuan,
        deskripsi: item.deskripsi,
      },
    });

    if (!created) {
      await komoditas.update({
        id_kategori: komoditas.id_kategori || kategoriPertanian.id_kategori,
        satuan: komoditas.satuan || item.satuan,
        deskripsi: komoditas.deskripsi || item.deskripsi,
      });
    }
  }

  console.log('Data kategori dan komoditas berhasil disinkronkan.');
}

async function repairLegacyPanenForeignKeys() {
  const [rows] = await sequelize.query(`
    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'panen'
      AND COLUMN_NAME = 'id_lahan'
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND REFERENCED_TABLE_NAME <> 'lahan'
  `);

  for (const row of rows) {
    await sequelize.query(
      `ALTER TABLE \`panen\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
    );
  }

  if (rows.length > 0) {
    console.log('Foreign key lama tabel panen berhasil dibersihkan.');
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    await repairLegacyPanenForeignKeys();

    await sequelize.sync({ alter: true });
    console.log('Semua tabel tersinkronisasi.');

    await seedRoles();
    await seedKomoditas();

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
}

startServer();

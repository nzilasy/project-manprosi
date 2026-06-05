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
const laporanRoutes = require('./routes/laporanRoutes');
const wisataRoutes = require('./routes/wisataRoutes');
const aiRoutes = require('./routes/aiRoutes');
const kunjunganWisataRoutes = require('./routes/kunjunganWisataRoutes');
const kendalaWisataRoutes = require('./routes/kendalaWisataRoutes');

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
app.use('/api/laporan', laporanRoutes);
app.use('/api/wisata', wisataRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/kunjungan-wisata', kunjunganWisataRoutes);
app.use('/api/kendala-wisata', kendalaWisataRoutes);

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
    kategori: 'Pertanian',
    satuan: 'ton',
    deskripsi: 'Komoditas padi sawah',
  },
  {
    nama_komoditas: 'Jagung',
    kategori: 'Pertanian',
    satuan: 'ton',
    deskripsi: 'Komoditas jagung',
  },
  {
    nama_komoditas: 'Kopi',
    kategori: 'Pertanian',
    satuan: 'kg',
    deskripsi: 'Komoditas kopi',
  },
  {
    nama_komoditas: 'Sayuran',
    kategori: 'Pertanian',
    satuan: 'kg',
    deskripsi: 'Komoditas sayuran',
  },
  {
    nama_komoditas: 'Peternakan',
    kategori: 'Peternakan',
    satuan: 'ekor',
    deskripsi: 'Komoditas hasil peternakan',
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
  const kategoriByName = new Map();

  for (const item of DEFAULT_KOMODITAS) {
    const kategoriName = item.kategori || 'Pertanian';

    if (!kategoriByName.has(kategoriName)) {
      const [kategori] = await Kategori.findOrCreate({
        where: {
          nama_kategori: kategoriName,
        },
      });

      kategoriByName.set(kategoriName, kategori);
    }

    const kategori = kategoriByName.get(kategoriName);

    const [komoditas, created] = await Komoditas.findOrCreate({
      where: {
        nama_komoditas: item.nama_komoditas,
      },
      defaults: {
        id_kategori: kategori.id_kategori,
        satuan: item.satuan,
        deskripsi: item.deskripsi,
      },
    });

    if (!created) {
      await komoditas.update({
        id_kategori: komoditas.id_kategori || kategori.id_kategori,
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

async function repairDuplicateUserEmailIndexes() {
  const [tables] = await sequelize.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
  `);

  if (tables.length === 0) return;

  const [indexes] = await sequelize.query(`
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user'
      AND COLUMN_NAME = 'email'
      AND NON_UNIQUE = 0
    ORDER BY
      CASE
        WHEN INDEX_NAME = 'email' THEN 0
        WHEN INDEX_NAME = 'user_email_unique' THEN 1
        ELSE 2
      END,
      INDEX_NAME
  `);

  if (indexes.length === 0) {
    await sequelize.query('ALTER TABLE `user` ADD UNIQUE INDEX `email` (`email`)');
    return;
  }

  if (indexes.length === 1) return;

  const [, ...duplicateIndexes] = indexes;

  for (const index of duplicateIndexes) {
    await sequelize.query(
      `ALTER TABLE \`user\` DROP INDEX \`${index.INDEX_NAME}\``,
    );
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');

    await repairLegacyPanenForeignKeys();
    await repairDuplicateUserEmailIndexes();

    await sequelize.sync({ alter: true });
    await repairDuplicateUserEmailIndexes();
    console.log('Semua tabel tersinkronisasi.');

    await seedRoles();
    await seedKomoditas();
    // Data wisata dikelola dari fitur CRUD, jadi jangan seed ulang saat server restart.

    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
}

if (process.env.VERCEL !== '1') {
  startServer();
} else {
  // Untuk Vercel: inisialisasi database tapi tidak menjalankan app.listen()
  sequelize.authenticate()
    .then(() => console.log('Database terhubung (Vercel)'))
    .catch(err => console.error('Gagal terhubung database (Vercel)', err));
}

module.exports = app;

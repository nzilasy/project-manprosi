const express = require('express');
const { KendalaWisata, Lokasi, User, Wisata } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

function getUserId(req) {
  return req.user?.id_user || req.user?.id || req.user?.userId || req.user?.user_id;
}

function getUserRole(req) {
  return req.user?.role || req.user?.Role?.name || req.user?.role_name;
}

function toPlain(row) {
  return row?.get ? row.get({ plain: true }) : row;
}

function parsePhotos(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function normalizePhotos(value) {
  if (!value) return null;

  const photos = Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return photos.length ? JSON.stringify(photos) : null;
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();

  if (
    status === 'belum_diproses' ||
    status.includes('belum') ||
    status.includes('baru') ||
    status.includes('menunggu')
  ) {
    return 'belum_diproses';
  }

  if (status === 'diproses' || status.includes('proses')) {
    return 'diproses';
  }

  if (status === 'selesai' || status.includes('selesai') || status.includes('verifikasi')) {
    return 'selesai';
  }

  return null;
}

const INDONESIAN_PROVINCES = [
  'aceh',
  'sumatera utara',
  'sumatera barat',
  'riau',
  'kepulauan riau',
  'jambi',
  'sumatera selatan',
  'bengkulu',
  'lampung',
  'kepulauan bangka belitung',
  'banten',
  'dki jakarta',
  'jawa barat',
  'jawa tengah',
  'di yogyakarta',
  'jawa timur',
  'bali',
  'nusa tenggara barat',
  'nusa tenggara timur',
  'kalimantan barat',
  'kalimantan tengah',
  'kalimantan selatan',
  'kalimantan timur',
  'kalimantan utara',
  'sulawesi utara',
  'sulawesi tengah',
  'sulawesi selatan',
  'sulawesi tenggara',
  'gorontalo',
  'sulawesi barat',
  'maluku',
  'maluku utara',
  'papua',
  'papua barat',
  'papua barat daya',
  'papua tengah',
  'papua pegunungan',
  'papua selatan',
];

function normalizeLocationPart(value) {
  return String(value || '').trim();
}

function uniqueLocationParts(parts) {
  const seen = new Set();

  return parts
    .map(normalizeLocationPart)
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function getLocationText(lokasi) {
  if (!lokasi) return 'Lokasi belum diisi';

  const locationParts = uniqueLocationParts([
    lokasi.alamat,
    lokasi.desa_kelurahan,
    lokasi.kecamatan,
    lokasi.kabupaten_kota,
  ]);
  const province = normalizeLocationPart(lokasi.provinsi);
  const locationText = locationParts.join(', ').toLowerCase();
  const provinceKey = province.toLowerCase();
  const hasDifferentProvinceInInput = INDONESIAN_PROVINCES.some(
    (item) => item !== provinceKey && locationText.includes(item)
  );
  const shouldShowProvince =
    province && !locationText.includes(provinceKey) && !hasDifferentProvinceInInput;

  return uniqueLocationParts([...locationParts, shouldShowProvince ? province : null]).join(', ')
    || lokasi.nama_lokasi
    || 'Lokasi belum diisi';
}

function serializeWisata(row) {
  const item = toPlain(row);
  const lokasi = item?.lokasi || item?.Lokasi || null;

  if (!item) return null;

  return {
    id: item.id_wisata,
    id_wisata: item.id_wisata,
    nama_wisata: item.nama_wisata,
    name: item.nama_wisata,
    jenis_wisata: item.jenis_wisata || 'Alam',
    category: item.jenis_wisata || 'Alam',
    status: item.status || 'aktif',
    location: getLocationText(lokasi),
  };
}

function serializeKendala(row) {
  const item = toPlain(row);

  return {
    id: item.id_kendala_wisata,
    id_kendala_wisata: item.id_kendala_wisata,
    id_user: item.id_user,
    id_wisata: item.id_wisata,
    kategori: item.kategori,
    tingkat_keparahan: item.tingkat_keparahan || 'sedang',
    lokasi_kendala: item.lokasi_kendala || '',
    status: normalizeStatus(item.status) || 'belum_diproses',
    judul: item.judul,
    deskripsi: item.deskripsi,
    tanggal: item.tanggal,
    lampiran: parsePhotos(item.lampiran),
    wisata: item.wisata ? serializeWisata(item.wisata) : null,
    user: item.user || null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function getInclude() {
  return [
    {
      model: Wisata,
      as: 'wisata',
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    },
    {
      model: User,
      as: 'user',
      attributes: ['id_user', 'name', 'email'],
      required: false,
    },
  ];
}

async function findAccessibleKendala(req, id) {
  const where = {
    id_kendala_wisata: id,
  };

  if (getUserRole(req) === 'wisata') {
    where.id_user = getUserId(req);
  }

  return KendalaWisata.findOne({
    where,
    include: getInclude(),
  });
}

async function ensureWisataExists(idWisata) {
  const wisata = await Wisata.findByPk(idWisata);

  return wisata !== null;
}

router.use(protect);
router.use(authorize('wisata', 'pengurus'));

router.get('/', async (req, res) => {
  try {
    const where = {};

    if (getUserRole(req) === 'wisata') {
      where.id_user = getUserId(req);
    }

    if (req.query.id_wisata) {
      where.id_wisata = req.query.id_wisata;
    }

    if (req.query.status) {
      where.status = normalizeStatus(req.query.status) || req.query.status;
    }

    const rows = await KendalaWisata.findAll({
      where,
      include: getInclude(),
      order: [['tanggal', 'DESC'], ['created_at', 'DESC']],
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    return res.json({
      data: rows.map(serializeKendala),
    });
  } catch (error) {
    console.error('List kendala wisata error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil laporan kendala wisata.',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      id_wisata: idWisata,
      kategori,
      tingkat_keparahan: tingkatKeparahan,
      lokasi_kendala: lokasiKendala,
      judul,
      deskripsi,
      tanggal,
      lampiran,
    } = req.body;

    if (!idWisata) {
      return res.status(400).json({ message: 'Lokasi wisata wajib dipilih.' });
    }

    if (!(await ensureWisataExists(idWisata))) {
      return res.status(404).json({ message: 'Data wisata tidak ditemukan.' });
    }

    if (!kategori || !judul || !deskripsi) {
      return res.status(400).json({
        message: 'Kategori, judul, dan deskripsi kendala wajib diisi.',
      });
    }

    const row = await KendalaWisata.create({
      id_user: getUserId(req),
      id_wisata: idWisata,
      kategori,
      tingkat_keparahan: tingkatKeparahan || 'sedang',
      lokasi_kendala: lokasiKendala || null,
      status: 'belum_diproses',
      judul,
      deskripsi,
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      lampiran: normalizePhotos(lampiran),
    });

    const created = await KendalaWisata.findByPk(row.id_kendala_wisata, {
      include: getInclude(),
    });

    return res.status(201).json({
      message: 'Laporan kendala wisata berhasil disimpan.',
      data: serializeKendala(created),
    });
  } catch (error) {
    console.error('Create kendala wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menyimpan laporan kendala wisata.',
      error: error.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const row = await findAccessibleKendala(req, req.params.id);

    if (!row) {
      return res.status(404).json({ message: 'Laporan kendala wisata tidak ditemukan.' });
    }

    if (req.body.id_wisata !== undefined && !(await ensureWisataExists(req.body.id_wisata))) {
      return res.status(404).json({ message: 'Data wisata tidak ditemukan.' });
    }

    const nextData = {};

    [
      'id_wisata',
      'kategori',
      'tingkat_keparahan',
      'lokasi_kendala',
      'judul',
      'deskripsi',
      'tanggal',
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        nextData[field] = req.body[field] || null;
      }
    });

    if (req.body.lampiran !== undefined) {
      nextData.lampiran = normalizePhotos(req.body.lampiran);
    }

    await row.update(nextData);

    const updated = await KendalaWisata.findByPk(row.id_kendala_wisata, {
      include: getInclude(),
    });

    return res.json({
      message: 'Laporan kendala wisata berhasil diperbarui.',
      data: serializeKendala(updated),
    });
  } catch (error) {
    console.error('Update kendala wisata error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui laporan kendala wisata.',
      error: error.message,
    });
  }
});

router.patch('/:id/status', authorize('pengurus'), async (req, res) => {
  try {
    const status = normalizeStatus(req.body.status);

    if (!status) {
      return res.status(400).json({ message: 'Status laporan tidak valid.' });
    }

    const row = await KendalaWisata.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({ message: 'Laporan kendala wisata tidak ditemukan.' });
    }

    await row.update({ status });

    const updated = await KendalaWisata.findByPk(row.id_kendala_wisata, {
      include: getInclude(),
    });

    return res.json({
      message: 'Status laporan kendala wisata berhasil diperbarui.',
      data: serializeKendala(updated),
    });
  } catch (error) {
    console.error('Update status kendala wisata error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui status laporan kendala wisata.',
      error: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const row = await findAccessibleKendala(req, req.params.id);

    if (!row) {
      return res.status(404).json({ message: 'Laporan kendala wisata tidak ditemukan.' });
    }

    await row.destroy();

    return res.json({
      message: 'Laporan kendala wisata berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete kendala wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus laporan kendala wisata.',
      error: error.message,
    });
  }
});

module.exports = router;

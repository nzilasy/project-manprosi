const express = require('express');
const { Op } = require('sequelize');
const { Wisata, Lokasi, Lahan, Peternakan, KunjunganWisata } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

function parseList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch {
      // Fall back to comma-separated text below.
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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

function normalizeNumber(value) {
  if (value === '' || value === null || value === undefined) return null;

  const number = Number(String(value).replace(',', '.'));
  return Number.isNaN(number) ? null : number;
}

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) return null;

  const number = Number(String(value).replace(/[^\d-]/g, ''));
  return Number.isNaN(number) ? null : number;
}

function serializeWisata(row) {
  const item = row?.get ? row.get({ plain: true }) : row;
  const lokasi = item.Lokasi || item.lokasi || null;
  const latitude = Number(lokasi?.latitude);
  const longitude = Number(lokasi?.longitude);
  const photos = parseList(item.foto);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    id: item.id_wisata,
    id_wisata: item.id_wisata,
    name: item.nama_wisata,
    nama_wisata: item.nama_wisata,
    category: item.jenis_wisata || 'Alam',
    jenis_wisata: item.jenis_wisata || 'Alam',
    description: item.deskripsi,
    deskripsi: item.deskripsi,
    ticket_price: item.harga_tiket,
    harga_tiket: item.harga_tiket,
    rating: normalizeNumber(item.rating) ?? 0,
    reviews: normalizeInteger(item.jumlah_ulasan) ?? 0,
    jumlah_ulasan: normalizeInteger(item.jumlah_ulasan) ?? 0,
    facilities: parseList(item.fasilitas),
    fasilitas: parseList(item.fasilitas),
    image: photos[0] || null,
    photos,
    foto: photos,
    status: item.status || 'aktif',
    location: getLocationText(lokasi),
    address: lokasi?.alamat || getLocationText(lokasi),
    position: [latitude, longitude],
    latitude,
    longitude,
    lokasi,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

router.use(protect);
router.use(authorize('petani', 'pengurus', 'masyarakat', 'wisata'));

async function listWisata(req, res) {
  try {
    const { q, kategori, fasilitas } = req.query;
    const where = {};

    if (q) {
      where.nama_wisata = {
        [Op.like]: `%${q}%`,
      };
    }

    if (kategori && kategori !== 'semua') {
      where.jenis_wisata = {
        [Op.like]: `%${kategori}%`,
      };
    }

    if (fasilitas && fasilitas !== 'semua') {
      where.fasilitas = {
        [Op.like]: `%${fasilitas}%`,
      };
    }

    const rows = await Wisata.findAll({
      where,
      include: [
        {
          model: Lokasi,
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      data: rows.map(serializeWisata).filter(Boolean),
    });
  } catch (error) {
    console.error('Get wisata points error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil titik lokasi wisata.',
      error: error.message,
    });
  }
}

router.get('/', listWisata);
router.get('/points', listWisata);

router.post('/', authorize('wisata', 'pengurus'), async (req, res) => {
  try {
    const {
      nama_wisata,
      jenis_wisata,
      deskripsi,
      harga_tiket,
      fasilitas,
      foto,
      rating,
      reviews,
      jumlah_ulasan,
      status,
      alamat,
      desa_kelurahan,
      kecamatan,
      kabupaten_kota,
      provinsi,
      latitude,
      longitude,
    } = req.body;

    if (!nama_wisata) {
      return res.status(400).json({
        message: 'Nama wisata wajib diisi.',
      });
    }

    const normalizedLatitude = normalizeNumber(latitude);
    const normalizedLongitude = normalizeNumber(longitude);

    if (normalizedLatitude === null || normalizedLongitude === null) {
      return res.status(400).json({
        message: 'Latitude dan longitude wajib diisi.',
      });
    }

    const lokasi = await Lokasi.create({
      nama_lokasi: nama_wisata,
      alamat: alamat || null,
      desa_kelurahan: desa_kelurahan || null,
      kecamatan: kecamatan || null,
      kabupaten_kota: kabupaten_kota || null,
      provinsi: provinsi || null,
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
    });

    const wisata = await Wisata.create({
      id_lokasi: lokasi.id_lokasi,
      nama_wisata,
      jenis_wisata: jenis_wisata || 'Alam',
      deskripsi: deskripsi || null,
      harga_tiket: normalizeNumber(harga_tiket),
      fasilitas: JSON.stringify(parseList(fasilitas)),
      foto: JSON.stringify(parseList(foto)),
      rating: normalizeNumber(rating),
      jumlah_ulasan: normalizeInteger(jumlah_ulasan ?? reviews),
      status: status || 'aktif',
    });

    const created = await Wisata.findByPk(wisata.id_wisata, {
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    });

    return res.status(201).json({
      message: 'Lokasi wisata berhasil ditambahkan.',
      data: serializeWisata(created),
    });
  } catch (error) {
    console.error('Create wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menambahkan lokasi wisata.',
      error: error.message,
    });
  }
});

router.put('/:id', authorize('wisata', 'pengurus'), async (req, res) => {
  try {
    const idWisata = Number(req.params.id);

    if (Number.isNaN(idWisata)) {
      return res.status(400).json({
        message: 'ID wisata tidak valid.',
      });
    }

    const wisata = await Wisata.findByPk(idWisata, {
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    });

    if (!wisata) {
      return res.status(404).json({
        message: 'Lokasi wisata tidak ditemukan.',
      });
    }

    const {
      nama_wisata,
      jenis_wisata,
      deskripsi,
      harga_tiket,
      fasilitas,
      foto,
      rating,
      reviews,
      jumlah_ulasan,
      status,
      alamat,
      desa_kelurahan,
      kecamatan,
      kabupaten_kota,
      provinsi,
      latitude,
      longitude,
    } = req.body;

    if (!nama_wisata) {
      return res.status(400).json({
        message: 'Nama wisata wajib diisi.',
      });
    }

    const normalizedLatitude = normalizeNumber(latitude);
    const normalizedLongitude = normalizeNumber(longitude);

    if (normalizedLatitude === null || normalizedLongitude === null) {
      return res.status(400).json({
        message: 'Latitude dan longitude wajib diisi.',
      });
    }

    const lokasiPayload = {
      nama_lokasi: nama_wisata,
      alamat: alamat || null,
      desa_kelurahan: desa_kelurahan || null,
      kecamatan: kecamatan || null,
      kabupaten_kota: kabupaten_kota || null,
      provinsi: provinsi || null,
      latitude: normalizedLatitude,
      longitude: normalizedLongitude,
    };

    if (wisata.id_lokasi) {
      await Lokasi.update(lokasiPayload, {
        where: { id_lokasi: wisata.id_lokasi },
      });
    } else {
      const lokasi = await Lokasi.create(lokasiPayload);
      wisata.id_lokasi = lokasi.id_lokasi;
    }

    await wisata.update({
      id_lokasi: wisata.id_lokasi,
      nama_wisata,
      jenis_wisata: jenis_wisata || 'Alam',
      deskripsi: deskripsi || null,
      harga_tiket: normalizeNumber(harga_tiket),
      fasilitas: JSON.stringify(parseList(fasilitas)),
      foto: JSON.stringify(parseList(foto)),
      rating: normalizeNumber(rating),
      jumlah_ulasan: normalizeInteger(jumlah_ulasan ?? reviews),
      status: status || 'aktif',
    });

    const updated = await Wisata.findByPk(idWisata, {
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    });

    return res.json({
      message: 'Lokasi wisata berhasil diperbarui.',
      data: serializeWisata(updated),
    });
  } catch (error) {
    console.error('Update wisata error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui lokasi wisata.',
      error: error.message,
    });
  }
});

router.delete('/:id', authorize('wisata', 'pengurus'), async (req, res) => {
  try {
    const idWisata = Number(req.params.id);

    if (Number.isNaN(idWisata)) {
      return res.status(400).json({
        message: 'ID wisata tidak valid.',
      });
    }

    const wisata = await Wisata.findByPk(idWisata, {
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    });

    if (!wisata) {
      return res.status(404).json({
        message: 'Lokasi wisata tidak ditemukan.',
      });
    }

    const idLokasi = wisata.id_lokasi;

    await KunjunganWisata.destroy({
      where: { id_wisata: idWisata },
    });

    await wisata.destroy();

    if (idLokasi) {
      const [wisataCount, lahanCount, peternakanCount] = await Promise.all([
        Wisata.count({ where: { id_lokasi: idLokasi } }),
        Lahan.count({ where: { id_lokasi: idLokasi } }),
        Peternakan.count({ where: { id_lokasi: idLokasi } }),
      ]);

      if (wisataCount === 0 && lahanCount === 0 && peternakanCount === 0) {
        await Lokasi.destroy({
          where: { id_lokasi: idLokasi },
        });
      }
    }

    return res.json({
      message: 'Lokasi wisata berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus lokasi wisata.',
      error: error.message,
    });
  }
});

module.exports = router;

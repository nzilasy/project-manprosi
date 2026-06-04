const express = require('express');
const { Op } = require('sequelize');
const { Wisata, WisataRating, Lokasi, Lahan, Peternakan, KunjunganWisata, User } = require('../models/index');
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

function sanitizeAlamatPart(alamat, structuredParts, province) {
  const normalized = normalizeLocationPart(alamat);

  if (!normalized) return '';

  const structuredKeys = new Set(
    structuredParts.map((part) => part.toLowerCase()),
  );
  const provinceKey = normalizeLocationPart(province).toLowerCase();
  const segments = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    const key = segments[0]?.toLowerCase() || '';

    if (structuredKeys.has(key) || (provinceKey && key === provinceKey)) {
      return '';
    }

    return segments[0] || '';
  }

  const filtered = segments.filter((segment) => {
    const key = segment.toLowerCase();

    if (structuredKeys.has(key)) return false;
    if (provinceKey && key === provinceKey) return false;

    return !INDONESIAN_PROVINCES.includes(key);
  });

  return uniqueLocationParts(filtered).join(', ');
}

function getLocationText(lokasi) {
  if (!lokasi) return 'Lokasi belum diisi';

  const structuredParts = uniqueLocationParts([
    lokasi.desa_kelurahan,
    lokasi.kecamatan,
    lokasi.kabupaten_kota,
  ]);
  const province = normalizeLocationPart(lokasi.provinsi);
  const alamatPart = sanitizeAlamatPart(lokasi.alamat, structuredParts, province);
  const locationParts = uniqueLocationParts([
    alamatPart,
    ...structuredParts,
  ]);
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

function normalizeRatingValue(value) {
  const rating = normalizeNumber(value);

  if (rating === null || rating < 1 || rating > 5) {
    return null;
  }

  return Math.round(rating * 10) / 10;
}

function getAuthenticatedUserId(req) {
  return req.user?.id || req.user?.id_user || req.user?.user_id || null;
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

async function recalculateWisataRating(wisata, previousUserRating = null, nextUserRating = null) {
  const currentRating = normalizeNumber(wisata.rating) ?? 0;
  const currentReviews = normalizeInteger(wisata.jumlah_ulasan) ?? 0;
  let totalReviews = currentReviews;
  let totalScore = currentRating * currentReviews;

  if (previousUserRating !== null) {
    totalReviews -= 1;
    totalScore -= previousUserRating;
  }

  if (nextUserRating !== null) {
    totalReviews += 1;
    totalScore += nextUserRating;
  }

  totalReviews = Math.max(totalReviews, 0);
  const nextAverage = totalReviews > 0 ? totalScore / totalReviews : null;

  await wisata.update({
    rating: nextAverage === null ? null : Math.round(nextAverage * 100) / 100,
    jumlah_ulasan: totalReviews,
  });
}

// GET /api/wisata/public — public endpoint for landing page
router.get('/public', async (req, res) => {
  try {
    const rows = await Wisata.findAll({
      where: { status: 'aktif' },
      include: [
        {
          model: Lokasi,
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    const data = rows.map(serializeWisata).filter(Boolean);

    return res.json({ data });
  } catch (error) {
    console.error('Get public wisata error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data wisata publik.',
      error: error.message,
    });
  }
});

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

router.post('/:id/rating', authorize('masyarakat', 'petani', 'pengurus'), async (req, res) => {
  try {
    const idWisata = Number(req.params.id);
    const idUser = getAuthenticatedUserId(req);
    const nextRating = normalizeRatingValue(req.body.rating);
    const ulasan = String(req.body.ulasan || '').trim() || null;

    if (Number.isNaN(idWisata)) {
      return res.status(400).json({ message: 'ID wisata tidak valid.' });
    }

    if (!idUser) {
      return res.status(401).json({ message: 'User tidak valid.' });
    }

    if (nextRating === null) {
      return res.status(400).json({ message: 'Rating harus diisi antara 1 sampai 5.' });
    }

    const wisata = await Wisata.findByPk(idWisata);

    if (!wisata) {
      return res.status(404).json({ message: 'Lokasi wisata tidak ditemukan.' });
    }

    const existing = await WisataRating.findOne({
      where: {
        id_wisata: idWisata,
        id_user: idUser,
      },
    });
    const previousRating = existing ? normalizeNumber(existing.rating) : null;

    if (existing) {
      await existing.update({ rating: nextRating, ulasan });
    } else {
      await WisataRating.create({
        id_wisata: idWisata,
        id_user: idUser,
        rating: nextRating,
        ulasan,
      });
    }

    await recalculateWisataRating(wisata, previousRating, nextRating);

    const updated = await Wisata.findByPk(idWisata, {
      include: [
        {
          model: Lokasi,
          required: false,
        },
      ],
    });

    return res.json({
      message: existing ? 'Rating wisata berhasil diperbarui.' : 'Rating wisata berhasil disimpan.',
      data: serializeWisata(updated),
    });
  } catch (error) {
    console.error('Submit wisata rating error:', error);

    return res.status(500).json({
      message: 'Gagal menyimpan rating wisata.',
      error: error.message,
    });
  }
});

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

    await WisataRating.destroy({
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


// GET semua rating (untuk semua role)
router.get('/ratings', authorize('wisata', 'pengurus', 'masyarakat', 'petani'), async (req, res) => {
  try {
    const { User, Wisata } = require('../models/index');
    const ratings = await WisataRating.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id_user', 'name', 'email'],
        },
        {
          model: Wisata,
          as: 'wisata',
          attributes: ['id_wisata', 'nama_wisata'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Attach balasan_by user info
    const ratingsData = ratings.map(r => {
      const plain = r.toJSON();
      return plain;
    });

    // Get all unique balasan_by IDs
    const balasanByIds = [...new Set(ratingsData.filter(r => r.balasan_by).map(r => r.balasan_by))];
    let balasanUsers = {};
    if (balasanByIds.length > 0) {
      const users = await User.findAll({
        where: { id_user: balasanByIds },
        attributes: ['id_user', 'name'],
      });
      users.forEach(u => { balasanUsers[u.id_user] = u.name; });
    }

    const enrichedRatings = ratingsData.map(r => ({
      ...r,
      balasan_by_name: r.balasan_by ? (balasanUsers[r.balasan_by] || 'Pengelola') : null,
    }));

    res.json({
      status: 'success',
      data: enrichedRatings,
    });
  } catch (error) {
    console.error('Get wisata ratings error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
});

// PUT balas ulasan (hanya pengelola wisata & pengurus)
router.put('/ratings/:id/reply', authorize('wisata', 'pengurus'), async (req, res) => {
  try {
    const idRating = Number(req.params.id);
    const idUser = getAuthenticatedUserId(req);
    const balasan = req.body.balasan !== undefined ? String(req.body.balasan).trim() : null;

    const rating = await WisataRating.findByPk(idRating);
    if (!rating) {
      return res.status(404).json({ message: 'Ulasan tidak ditemukan.' });
    }

    if (balasan === '') {
      await rating.update({
        balasan: null,
        balasan_by: null,
        balasan_at: null,
      });
    } else if (balasan !== null) {
      await rating.update({
        balasan,
        balasan_by: idUser,
        balasan_at: new Date(),
      });
    } else {
      return res.status(400).json({ message: 'Balasan tidak boleh kosong.' });
    }

    res.json({
      status: 'success',
      message: 'Balasan berhasil disimpan.',
      data: rating,
    });
  } catch (error) {
    console.error('Reply wisata rating error:', error);
    res.status(500).json({ message: 'Gagal menyimpan balasan.' });
  }
});

module.exports = router;

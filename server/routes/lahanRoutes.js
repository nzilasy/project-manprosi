const express = require('express');
const { Op } = require('sequelize');
const {
  Lahan,
  Lokasi,
  Komoditas,
  Panen,
  Peternakan,
} = require('../models/index');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const includeLahan = [
  {
    model: Lokasi,
    as: 'lokasi',
    required: false,
  },
  {
    model: Komoditas,
    as: 'komoditas',
    required: false,
  },
];

const includePeternakan = [
  {
    model: Lokasi,
    required: true,
    where: {
      latitude: {
        [Op.ne]: null,
      },
      longitude: {
        [Op.ne]: null,
      },
    },
  },
];

function getUserId(req) {
  return (
    req.user?.id_user ||
    req.user?.id ||
    req.user?.userId ||
    req.user?.user_id
  );
}

function getUserRole(req) {
  return (
    req.user?.role ||
    req.user?.Role?.name ||
    req.user?.role_name ||
    req.user?.nama_role
  );
}

function buildLahanWhere(req, extraWhere = {}) {
  const role = getUserRole(req);
  const userId = getUserId(req);

  if (role === 'petani') {
    return {
      ...extraWhere,
      id_user: userId,
    };
  }

  return extraWhere;
}

function normalizeOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  return number;
}

function normalizePolygon(value) {
  if (!value) return null;

  let polygon = value;

  if (typeof value === 'string') {
    try {
      polygon = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(polygon)) return null;

  const points = polygon
    .map((point) => {
      if (Array.isArray(point)) {
        return [Number(point[0]), Number(point[1])];
      }

      if (point && typeof point === 'object') {
        return [Number(point.lat), Number(point.lng)];
      }

      return null;
    })
    .filter((point) => {
      return (
        point &&
        !Number.isNaN(point[0]) &&
        !Number.isNaN(point[1])
      );
    });

  return points.length >= 3 ? points : null;
}

function getLocationText(item) {
  const lokasi = item.lokasi || item.Lokasi || {};

  return (
    getReadableLocation(
      item.lokasi_lahan,
      lokasi.nama_lokasi,
      lokasi.nama_desa,
      lokasi.desa_kelurahan,
      lokasi.alamat,
      lokasi.kecamatan,
      lokasi.kabupaten,
      lokasi.kabupaten_kota,
    ) ||
    getPlaceName(item)
  );
}

function isCoordinateText(value) {
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(String(value || '').trim());
}

function getReadableLocation(...values) {
  return values.find((value) => value && !isCoordinateText(value));
}

function getPlaceName(item) {
  const lokasi = item.lokasi || item.Lokasi || {};

  return (
    getReadableLocation(
      item.nama_tempat,
      item.nama_peternakan,
      lokasi.nama_lokasi,
      lokasi.nama_desa,
      lokasi.desa_kelurahan,
      item.nama_lahan,
    ) ||
    'Area Komoditas'
  );
}

function getPotentialStatus(item) {
  const luasHa = getAreaInHa(item);

  if (luasHa >= 5) {
    return {
      label: 'Potensi Tinggi',
      key: 'tinggi',
      color: '#2f6f55',
    };
  }

  if (luasHa >= 1) {
    return {
      label: 'Potensi Sedang',
      key: 'sedang',
      color: '#c59b4a',
    };
  }

  return {
    label: 'Potensi Rendah',
    key: 'rendah',
    color: '#7a6042',
  };
}

function getAreaInHa(item) {
  const luas = Number(item.luas || 0);
  const satuan = String(item.satuan_luas || 'ha').toLowerCase();

  return satuan === 'm2' || satuan === 'm²' ? luas / 10000 : luas;
}

// GET /api/lahan/public
router.get('/public', async (req, res) => {
  try {
    const [lahan, peternakan] = await Promise.all([
      Lahan.findAll({
        where: {
          latitude: {
            [Op.ne]: null,
          },
          longitude: {
            [Op.ne]: null,
          },
        },
        include: includeLahan,
        order: [['created_at', 'DESC']],
        limit: 100,
      }),
      Peternakan.findAll({
        include: includePeternakan,
        order: [['created_at', 'DESC']],
        limit: 100,
      }),
    ]);

    const lahanData = lahan
      .map((item) => {
        const latitude = Number(item.latitude);
        const longitude = Number(item.longitude);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          return null;
        }

        const komoditas = item.komoditas?.nama_komoditas || 'Belum dipilih';
        const potential = getPotentialStatus(item);
        const placeName = getPlaceName(item);

        return {
          id: item.id_lahan,
          name: item.nama_lahan,
          nama_tempat: placeName,
          place_name: placeName,
          location: getLocationText(item),
          position: [latitude, longitude],
          status: potential.label,
          potential: potential.key,
          color: potential.color,
          commodity: [komoditas],
          production: '-',
          area: `${item.luas} ${item.satuan_luas || 'ha'}`,
          area_ha: Number(getAreaInHa(item).toFixed(4)),
          productivity: '-',
          planting_date: item.tanggal_tanam_terakhir,
        };
      })
      .filter(Boolean);

    const peternakanData = peternakan
      .map((item) => {
        const lokasi = item.Lokasi || item.lokasi || {};
        const latitude = Number(lokasi.latitude);
        const longitude = Number(lokasi.longitude);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          return null;
        }

        const placeName = getPlaceName(item);
        const jenisTernak = item.jenis_ternak || 'Peternakan';

        return {
          id: `peternakan-${item.id_peternakan}`,
          id_peternakan: item.id_peternakan,
          source_type: 'peternakan',
          name: item.nama_peternakan || placeName,
          nama_tempat: placeName,
          place_name: placeName,
          location: getLocationText(item),
          position: [latitude, longitude],
          status: item.status || 'Aktif',
          potential: 'peternakan',
          color: '#0f766e',
          commodity: [`Peternakan - ${jenisTernak}`],
          production: item.skala || '-',
          area: item.skala || '-',
          area_ha: 0,
          productivity: '-',
          planting_date: null,
          livestock_type: jenisTernak,
          description: item.deskripsi || null,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      })
      .filter(Boolean);

    return res.json({
      data: [...lahanData, ...peternakanData],
    });
  } catch (error) {
    console.error('Get public lahan error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data lahan publik.',
      error: error.message,
    });
  }
});

router.use(protect);
router.use(authorize('petani', 'pengurus'));

// GET /api/lahan/summary
router.get('/summary', async (req, res) => {
  try {
    const lahan = await Lahan.findAll({
      where: buildLahanWhere(req),
      include: includeLahan,
    });

    const totalLahan = lahan.length;

    const totalLuas = lahan.reduce((sum, item) => {
      return sum + Number(item.luas || 0);
    }, 0);

    const lahanAktif = lahan.filter((item) => item.status === 'aktif').length;

    let panenTerakhir = null;

    if (lahan.length > 0) {
      const idLahanList = lahan.map((item) => item.id_lahan);

      panenTerakhir = await Panen.findOne({
        where: {
          id_lahan: {
            [Op.in]: idLahanList,
          },
        },
        order: [['tanggal_panen', 'DESC']],
      });
    }

    return res.json({
      data: {
        total_lahan: totalLahan,
        total_luas: Number(totalLuas.toFixed(2)),
        lahan_aktif: lahanAktif,
        panen_terakhir: panenTerakhir,
      },
    });
  } catch (error) {
    console.error('Get lahan summary error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil ringkasan lahan.',
      error: error.message,
    });
  }
});

// GET /api/lahan
router.get('/', async (req, res) => {
  try {
    const { q, status, id_komoditas } = req.query;

    const where = {};

    if (q) {
      where.nama_lahan = {
        [Op.like]: `%${q}%`,
      };
    }

    if (status && status !== 'semua') {
      where.status = status;
    }

    if (id_komoditas) {
      where.id_komoditas = id_komoditas;
    }

    const lahan = await Lahan.findAll({
      where: buildLahanWhere(req, where),
      include: includeLahan,
      order: [['created_at', 'DESC']],
    });

    return res.json({
      data: lahan,
    });
  } catch (error) {
    console.error('Get lahan error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data lahan.',
      error: error.message,
    });
  }
});

// GET /api/lahan/:id
router.get('/:id', async (req, res) => {
  try {
    const lahan = await Lahan.findOne({
      where: buildLahanWhere(req, {
        id_lahan: req.params.id,
      }),
      include: includeLahan,
    });

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    return res.json({
      data: lahan,
    });
  } catch (error) {
    console.error('Get lahan detail error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail lahan.',
      error: error.message,
    });
  }
});

// POST /api/lahan
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'User tidak valid. Silakan login ulang.',
      });
    }

    const {
      nama_lahan,
      nama_tempat,
      id_komoditas,
      id_lokasi,
      luas,
      satuan_luas,
      lokasi_lahan,
      tanggal_tanam_terakhir,
      latitude,
      longitude,
      polygon_lahan,
      status,
      catatan,
      deskripsi,
    } = req.body;

    if (!nama_lahan || nama_lahan.trim() === '') {
      return res.status(400).json({
        message: 'Nama lahan wajib diisi.',
      });
    }

    const normalizedNamaTempat = String(nama_tempat || '').trim();

    if (!normalizedNamaTempat) {
      return res.status(400).json({
        message: 'Nama tempat wajib diisi.',
      });
    }

    if (!tanggal_tanam_terakhir) {
      return res.status(400).json({
        message: 'Tanggal tanam terakhir wajib diisi.',
      });
    }

    if (luas === undefined || luas === null || luas === '') {
      return res.status(400).json({
        message: 'Luas lahan wajib diisi.',
      });
    }

    if (id_komoditas) {
      const komoditas = await Komoditas.findByPk(id_komoditas);

      if (!komoditas) {
        return res.status(404).json({
          message: 'Komoditas tidak ditemukan.',
        });
      }
    }

    const lahan = await Lahan.create({
      id_user: userId,
      id_lokasi: id_lokasi || null,
      id_komoditas: id_komoditas || null,
      nama_lahan: nama_lahan.trim(),
      nama_tempat: normalizedNamaTempat,
      luas: Number(luas),
      satuan_luas: satuan_luas || 'ha',
      lokasi_lahan: lokasi_lahan || null,
      tanggal_tanam_terakhir: tanggal_tanam_terakhir || null,
      latitude: normalizeOptionalNumber(latitude),
      longitude: normalizeOptionalNumber(longitude),
      polygon_lahan: normalizePolygon(polygon_lahan),
      status: status || 'aktif',
      catatan: catatan || null,
      deskripsi: deskripsi || null,
    });

    const result = await Lahan.findByPk(lahan.id_lahan, {
      include: includeLahan,
    });

    return res.status(201).json({
      message: 'Lahan berhasil dibuat.',
      data: result,
    });
  } catch (error) {
    console.error('Create lahan error:', error);

    return res.status(500).json({
      message: 'Gagal membuat lahan.',
      error: error.message,
    });
  }
});

// PUT /api/lahan/:id
router.put('/:id', async (req, res) => {
  try {
    const lahan = await Lahan.findOne({
      where: buildLahanWhere(req, {
        id_lahan: req.params.id,
      }),
    });

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    if (req.body.id_komoditas) {
      const komoditas = await Komoditas.findByPk(req.body.id_komoditas);

      if (!komoditas) {
        return res.status(404).json({
          message: 'Komoditas tidak ditemukan.',
        });
      }
    }

    const nextNamaTempat = req.body.nama_tempat ?? lahan.nama_tempat;
    const nextTanggalTanam =
      req.body.tanggal_tanam_terakhir ?? lahan.tanggal_tanam_terakhir;

    if (!nextNamaTempat || String(nextNamaTempat).trim() === '') {
      return res.status(400).json({
        message: 'Nama tempat wajib diisi.',
      });
    }

    if (!nextTanggalTanam) {
      return res.status(400).json({
        message: 'Tanggal tanam terakhir wajib diisi.',
      });
    }

    await lahan.update({
      id_lokasi: req.body.id_lokasi ?? lahan.id_lokasi,
      id_komoditas: req.body.id_komoditas ?? lahan.id_komoditas,
      nama_lahan: req.body.nama_lahan ?? lahan.nama_lahan,
      nama_tempat: String(nextNamaTempat).trim(),
      luas:
        req.body.luas === undefined ||
        req.body.luas === null ||
        req.body.luas === ''
          ? lahan.luas
          : Number(req.body.luas),
      satuan_luas: req.body.satuan_luas ?? lahan.satuan_luas,
      lokasi_lahan: req.body.lokasi_lahan ?? lahan.lokasi_lahan,
      tanggal_tanam_terakhir: nextTanggalTanam,
      latitude:
        req.body.latitude === undefined
          ? lahan.latitude
          : normalizeOptionalNumber(req.body.latitude),
      longitude:
        req.body.longitude === undefined
          ? lahan.longitude
          : normalizeOptionalNumber(req.body.longitude),
      polygon_lahan:
        req.body.polygon_lahan === undefined
          ? lahan.polygon_lahan
          : normalizePolygon(req.body.polygon_lahan),
      status: req.body.status ?? lahan.status,
      catatan: req.body.catatan ?? lahan.catatan,
      deskripsi: req.body.deskripsi ?? lahan.deskripsi,
    });

    const result = await Lahan.findByPk(lahan.id_lahan, {
      include: includeLahan,
    });

    return res.json({
      message: 'Lahan berhasil diperbarui.',
      data: result,
    });
  } catch (error) {
    console.error('Update lahan error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui lahan.',
      error: error.message,
    });
  }
});

// DELETE /api/lahan/:id
router.delete('/:id', async (req, res) => {
  try {
    const lahan = await Lahan.findOne({
      where: buildLahanWhere(req, {
        id_lahan: req.params.id,
      }),
    });

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    await lahan.destroy();

    return res.json({
      message: 'Lahan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete lahan error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus lahan.',
      error: error.message,
    });
  }
});

module.exports = router;

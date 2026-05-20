const express = require('express');
const { Op } = require('sequelize');
const {
  Lahan,
  Lokasi,
  Komoditas,
  Panen,
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

const includePanen = [
  {
    model: Lahan,
    required: true,
    include: includeLahan,
  },
  {
    model: Komoditas,
    required: false,
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

  const number = Number(String(value).replace(',', '.'));
  return Number.isNaN(number) ? null : number;
}

function normalizeDate(value) {
  if (!value) return null;
  return value;
}

function normalizePhotos(value) {
  if (!value) return null;

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return null;
}

function calculateProductivity(jumlah, luasPanen) {
  const total = Number(jumlah || 0);
  const luas = Number(luasPanen || 0);

  if (!total || !luas) {
    return null;
  }

  return Number((total / luas).toFixed(2));
}

function serializePanen(row) {
  const item = row?.get ? row.get({ plain: true }) : row;

  if (!item) {
    return item;
  }

  return {
    ...item,
    lahan: item.Lahan || item.lahan || null,
    komoditas: item.Komoditas || item.Komodita || item.komoditas || null,
  };
}

async function findAccessibleLahan(req, idLahan) {
  return Lahan.findOne({
    where: buildLahanWhere(req, {
      id_lahan: idLahan,
    }),
    include: includeLahan,
  });
}

router.use(protect);
router.use(authorize('petani', 'pengurus'));

// GET /api/panen
router.get('/', async (req, res) => {
  try {
    const {
      id_lahan,
      start_date,
      end_date,
      year,
      limit,
    } = req.query;

    const where = {};
    const lahanWhere = {};

    if (id_lahan) {
      lahanWhere.id_lahan = id_lahan;
    }

    if (start_date || end_date) {
      where.tanggal_panen = {};

      if (start_date) {
        where.tanggal_panen[Op.gte] = start_date;
      }

      if (end_date) {
        where.tanggal_panen[Op.lte] = end_date;
      }
    } else if (year) {
      where.tanggal_panen = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      };
    }

    const rows = await Panen.findAll({
      where,
      include: [
        {
          model: Lahan,
          required: true,
          where: buildLahanWhere(req, lahanWhere),
          include: includeLahan,
        },
        {
          model: Komoditas,
          required: false,
        },
      ],
      order: [['tanggal_panen', 'DESC'], ['created_at', 'DESC']],
      limit: limit ? Number(limit) : undefined,
    });

    return res.json({
      data: rows.map(serializePanen),
    });
  } catch (error) {
    console.error('Get panen error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil riwayat panen.',
      error: error.message,
    });
  }
});

// GET /api/panen/:id
router.get('/:id', async (req, res) => {
  try {
    const panen = await Panen.findOne({
      where: {
        id_panen: req.params.id,
      },
      include: [
        {
          model: Lahan,
          required: true,
          where: buildLahanWhere(req),
          include: includeLahan,
        },
        {
          model: Komoditas,
          required: false,
        },
      ],
    });

    if (!panen) {
      return res.status(404).json({
        message: 'Data panen tidak ditemukan.',
      });
    }

    return res.json({
      data: serializePanen(panen),
    });
  } catch (error) {
    console.error('Get panen detail error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail panen.',
      error: error.message,
    });
  }
});

// POST /api/panen
router.post('/', async (req, res) => {
  try {
    const {
      id_lahan,
      id_komoditas,
      tanggal_mulai_periode,
      tanggal_selesai_periode,
      tanggal_panen,
      luas_panen,
      satuan_luas_panen,
      jumlah,
      satuan,
      produktivitas,
      kadar_air,
      kualitas,
      harga_jual,
      foto_panen,
      keterangan,
    } = req.body;

    if (!id_lahan) {
      return res.status(400).json({
        message: 'Lahan wajib dipilih.',
      });
    }

    const lahan = await findAccessibleLahan(req, id_lahan);

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    const harvestDate = normalizeDate(
      tanggal_panen || tanggal_selesai_periode || tanggal_mulai_periode,
    );

    if (!harvestDate) {
      return res.status(400).json({
        message: 'Periode panen wajib diisi.',
      });
    }

    if (jumlah === undefined || jumlah === null || jumlah === '') {
      return res.status(400).json({
        message: 'Hasil panen wajib diisi.',
      });
    }

    const selectedKomoditas = id_komoditas || lahan.id_komoditas || null;
    const normalizedJumlah = normalizeOptionalNumber(jumlah);
    const normalizedLuas = normalizeOptionalNumber(luas_panen);

    if (normalizedJumlah === null) {
      return res.status(400).json({
        message: 'Hasil panen harus berupa angka yang valid.',
      });
    }

    const panen = await Panen.create({
      id_lahan: lahan.id_lahan,
      id_komoditas: selectedKomoditas,
      tanggal_mulai_periode: normalizeDate(tanggal_mulai_periode),
      tanggal_selesai_periode: normalizeDate(tanggal_selesai_periode),
      tanggal_panen: harvestDate,
      luas_panen: normalizedLuas,
      satuan_luas_panen: satuan_luas_panen || lahan.satuan_luas || 'ha',
      jumlah: normalizedJumlah,
      satuan: satuan || 'ton',
      produktivitas:
        normalizeOptionalNumber(produktivitas) ??
        calculateProductivity(normalizedJumlah, normalizedLuas),
      kadar_air: normalizeOptionalNumber(kadar_air),
      kualitas: kualitas || null,
      harga_jual: normalizeOptionalNumber(harga_jual),
      foto_panen: normalizePhotos(foto_panen),
      keterangan: keterangan || null,
    });

    const result = await Panen.findByPk(panen.id_panen, {
      include: includePanen,
    });

    return res.status(201).json({
      message: 'Data panen berhasil disimpan.',
      data: serializePanen(result),
    });
  } catch (error) {
    console.error('Create panen error:', error);

    return res.status(500).json({
      message: 'Gagal menyimpan data panen.',
      error: error.message,
    });
  }
});

// PUT /api/panen/:id
router.put('/:id', async (req, res) => {
  try {
    const panen = await Panen.findOne({
      where: {
        id_panen: req.params.id,
      },
      include: [
        {
          model: Lahan,
          required: true,
          where: buildLahanWhere(req),
        },
      ],
    });

    if (!panen) {
      return res.status(404).json({
        message: 'Data panen tidak ditemukan.',
      });
    }

    const lahan = req.body.id_lahan
      ? await findAccessibleLahan(req, req.body.id_lahan)
      : panen.Lahan;

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    const nextJumlah =
      req.body.jumlah === undefined
        ? Number(panen.jumlah || 0)
        : normalizeOptionalNumber(req.body.jumlah);
    const nextLuas =
      req.body.luas_panen === undefined
        ? normalizeOptionalNumber(panen.luas_panen)
        : normalizeOptionalNumber(req.body.luas_panen);

    if (nextJumlah === null) {
      return res.status(400).json({
        message: 'Hasil panen harus berupa angka yang valid.',
      });
    }

    await panen.update({
      id_lahan: lahan.id_lahan,
      id_komoditas:
        req.body.id_komoditas ?? panen.id_komoditas ?? lahan.id_komoditas,
      tanggal_mulai_periode:
        req.body.tanggal_mulai_periode ?? panen.tanggal_mulai_periode,
      tanggal_selesai_periode:
        req.body.tanggal_selesai_periode ?? panen.tanggal_selesai_periode,
      tanggal_panen:
        req.body.tanggal_panen ??
        req.body.tanggal_selesai_periode ??
        panen.tanggal_panen,
      luas_panen: nextLuas,
      satuan_luas_panen:
        req.body.satuan_luas_panen ?? panen.satuan_luas_panen,
      jumlah: nextJumlah,
      satuan: req.body.satuan ?? panen.satuan,
      produktivitas:
        req.body.produktivitas === undefined
          ? calculateProductivity(nextJumlah, nextLuas)
          : normalizeOptionalNumber(req.body.produktivitas),
      kadar_air:
        req.body.kadar_air === undefined
          ? panen.kadar_air
          : normalizeOptionalNumber(req.body.kadar_air),
      kualitas: req.body.kualitas ?? panen.kualitas,
      harga_jual:
        req.body.harga_jual === undefined
          ? panen.harga_jual
          : normalizeOptionalNumber(req.body.harga_jual),
      foto_panen:
        req.body.foto_panen === undefined
          ? panen.foto_panen
          : normalizePhotos(req.body.foto_panen),
      keterangan: req.body.keterangan ?? panen.keterangan,
    });

    const result = await Panen.findByPk(panen.id_panen, {
      include: includePanen,
    });

    return res.json({
      message: 'Data panen berhasil diperbarui.',
      data: serializePanen(result),
    });
  } catch (error) {
    console.error('Update panen error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui data panen.',
      error: error.message,
    });
  }
});

// DELETE /api/panen/:id
router.delete('/:id', async (req, res) => {
  try {
    const panen = await Panen.findOne({
      where: {
        id_panen: req.params.id,
      },
      include: [
        {
          model: Lahan,
          required: true,
          where: buildLahanWhere(req),
        },
      ],
    });

    if (!panen) {
      return res.status(404).json({
        message: 'Data panen tidak ditemukan.',
      });
    }

    await panen.destroy();

    return res.json({
      message: 'Data panen berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete panen error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus data panen.',
      error: error.message,
    });
  }
});

module.exports = router;

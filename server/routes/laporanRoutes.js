const express = require('express');
const { Lahan, Laporan, Panen } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

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
  if (getUserRole(req) === 'petani') {
    return {
      ...extraWhere,
      id_user: getUserId(req),
    };
  }

  return extraWhere;
}

function normalizePhotos(value) {
  if (!value) return null;

  const photos = Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  return photos.length > 0 ? JSON.stringify(photos) : null;
}

function parsePhotos(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

async function getAccessibleLahan(req) {
  return Lahan.findAll({
    where: buildLahanWhere(req),
    order: [['created_at', 'DESC']],
  });
}

function serializeLaporan(row, lahanMap = new Map()) {
  const item = row?.get ? row.get({ plain: true }) : row;

  if (!item) return item;

  return {
    ...item,
    lampiran: parsePhotos(item.lampiran),
    lahan: lahanMap.get(Number(item.reportable_id)) || null,
  };
}

function normalizeReportStatus(value) {
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

router.use(protect);
router.use(authorize('petani', 'pengurus'));

router.get('/', async (req, res) => {
  try {
    const lahan = await getAccessibleLahan(req);
    const lahanIds = lahan.map((item) => item.id_lahan);
    const lahanMap = new Map(lahan.map((item) => [Number(item.id_lahan), item]));

    if (lahanIds.length === 0) {
      return res.json({ data: [] });
    }

    const where = {
      reportable_type: 'lahan',
      reportable_id: lahanIds,
    };

    if (req.query.id_lahan) {
      where.reportable_id = req.query.id_lahan;
    }

    const rows = await Laporan.findAll({
      where,
      order: [['tanggal', 'DESC'], ['created_at', 'DESC']],
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });

    return res.json({
      data: rows.map((item) => serializeLaporan(item, lahanMap)),
    });
  } catch (error) {
    console.error('Get laporan error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil laporan kendala.',
      error: error.message,
    });
  }
});

router.get('/summary/:id_lahan', async (req, res) => {
  try {
    const lahan = await Lahan.findOne({
      where: buildLahanWhere(req, {
        id_lahan: req.params.id_lahan,
      }),
    });

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    const latestPanen = await Panen.findOne({
      where: {
        id_lahan: lahan.id_lahan,
      },
      order: [['tanggal_panen', 'DESC'], ['created_at', 'DESC']],
    });

    return res.json({
      data: {
        lahan,
        panen_terakhir: latestPanen,
      },
    });
  } catch (error) {
    console.error('Get laporan summary error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil ringkasan lahan.',
      error: error.message,
    });
  }
});

router.patch('/:id/status', authorize('pengurus'), async (req, res) => {
  try {
    const status = normalizeReportStatus(req.body.status);

    if (!status) {
      return res.status(400).json({
        message: 'Status laporan tidak valid.',
      });
    }

    const laporan = await Laporan.findByPk(req.params.id);

    if (!laporan) {
      return res.status(404).json({
        message: 'Laporan tidak ditemukan.',
      });
    }

    await laporan.update({ status });

    const lahan =
      laporan.reportable_type === 'lahan'
        ? await Lahan.findByPk(laporan.reportable_id)
        : null;
    const lahanMap = lahan
      ? new Map([[Number(laporan.reportable_id), lahan]])
      : new Map();

    return res.json({
      message: 'Status laporan berhasil diperbarui.',
      data: serializeLaporan(laporan, lahanMap),
    });
  } catch (error) {
    console.error('Update status laporan error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui status laporan.',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      id_lahan,
      kategori,
      tingkat_keparahan,
      judul,
      deskripsi,
      tanggal,
      lokasi_kendala,
      lampiran,
    } = req.body;

    if (!id_lahan) {
      return res.status(400).json({
        message: 'Lahan wajib dipilih.',
      });
    }

    const lahan = await Lahan.findOne({
      where: buildLahanWhere(req, {
        id_lahan,
      }),
    });

    if (!lahan) {
      return res.status(404).json({
        message: 'Lahan tidak ditemukan.',
      });
    }

    if (!kategori) {
      return res.status(400).json({
        message: 'Kategori kendala wajib dipilih.',
      });
    }

    if (!judul && !deskripsi) {
      return res.status(400).json({
        message: 'Judul atau deskripsi kendala wajib diisi.',
      });
    }

    const laporan = await Laporan.create({
      id_user: getUserId(req),
      reportable_type: 'lahan',
      reportable_id: lahan.id_lahan,
      kategori,
      tingkat_keparahan: tingkat_keparahan || 'sedang',
      lokasi_kendala: lokasi_kendala || lahan.lokasi_lahan || null,
      status: 'belum_diproses',
      judul: judul || String(deskripsi).slice(0, 140),
      deskripsi: deskripsi || judul,
      tanggal: tanggal || new Date().toISOString().slice(0, 10),
      lampiran: normalizePhotos(lampiran),
    });

    const lahanMap = new Map([[Number(lahan.id_lahan), lahan]]);

    return res.status(201).json({
      message: 'Laporan kendala berhasil disimpan.',
      data: serializeLaporan(laporan, lahanMap),
    });
  } catch (error) {
    console.error('Create laporan error:', error);

    return res.status(500).json({
      message: 'Gagal menyimpan laporan kendala.',
      error: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const laporan = await Laporan.findByPk(req.params.id);

    if (!laporan) {
      return res.status(404).json({
        message: 'Laporan tidak ditemukan.',
      });
    }

    const role = getUserRole(req);
    const userId = getUserId(req);

    if (role === 'petani' && laporan.id_user !== userId) {
      return res.status(403).json({
        message: 'Akses ditolak. Anda hanya dapat menghapus laporan Anda sendiri.',
      });
    }

    await laporan.destroy();

    return res.json({
      message: 'Laporan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete laporan error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus laporan.',
      error: error.message,
    });
  }
});

module.exports = router;

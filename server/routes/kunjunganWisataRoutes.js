const express = require('express');
const { Op } = require('sequelize');
const { KunjunganWisata, Wisata, Lokasi } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

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
      // Fallback to comma-separated text below.
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function toPlain(row) {
  return row?.get ? row.get({ plain: true }) : row;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isDateInCurrentMonth(value) {
  if (!value) return false;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
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
  const lokasi = item?.Lokasi || item?.lokasi || null;
  const photos = parseList(item?.foto);

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
    image: photos[0] || null,
    photos,
  };
}

function serializeKunjungan(row) {
  const item = toPlain(row);

  return {
    id: item.id_kunjungan,
    id_kunjungan: item.id_kunjungan,
    id_wisata: item.id_wisata,
    tanggal_kunjungan: item.tanggal_kunjungan,
    jumlah_pengunjung: toNumber(item.jumlah_pengunjung),
    asal_pengunjung: item.asal_pengunjung || '',
    catatan: item.catatan || '',
    wisata: item.wisata ? serializeWisata(item.wisata) : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function getIncludeWisata() {
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
  ];
}

function buildDateWhere({ tahun, bulan }) {
  const year = Number(tahun) || new Date().getFullYear();

  if (bulan) {
    const month = String(bulan).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const end = new Date(year, Number(month), 0).toISOString().slice(0, 10);

    return {
      [Op.between]: [start, end],
    };
  }

  return {
    [Op.between]: [`${year}-01-01`, `${year}-12-31`],
  };
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

    if (req.query.id_wisata) {
      where.id_wisata = req.query.id_wisata;
    }

    if (req.query.tahun || req.query.bulan) {
      where.tanggal_kunjungan = buildDateWhere(req.query);
    }

    const rows = await KunjunganWisata.findAll({
      where,
      include: getIncludeWisata(),
      order: [['tanggal_kunjungan', 'DESC'], ['created_at', 'DESC']],
    });

    return res.json({
      data: rows.map(serializeKunjungan),
    });
  } catch (error) {
    console.error('List kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data kunjungan wisata.',
      error: error.message,
    });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const tahun = Number(req.query.tahun) || new Date().getFullYear();
    const today = getTodayDate();
    const yearlyWhere = {
      tanggal_kunjungan: buildDateWhere({ tahun }),
    };

    const [kunjungan, wisataRows] = await Promise.all([
      KunjunganWisata.findAll({
        where: yearlyWhere,
        include: getIncludeWisata(),
        order: [['tanggal_kunjungan', 'ASC']],
      }),
      Wisata.findAll({
        include: [
          {
            model: Lokasi,
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
      }),
    ]);

    const monthly = MONTH_LABELS.map((month) => ({
      month,
      pengunjung: 0,
    }));
    const popularMap = new Map();
    let totalPengunjung = 0;
    let pengunjungHariIni = 0;

    for (const row of kunjungan.map(toPlain)) {
      const jumlah = toNumber(row.jumlah_pengunjung);
      const monthIndex = new Date(row.tanggal_kunjungan).getMonth();

      if (monthly[monthIndex]) {
        monthly[monthIndex].pengunjung += jumlah;
      }

      totalPengunjung += jumlah;

      if (row.tanggal_kunjungan === today) {
        pengunjungHariIni += jumlah;
      }

      const wisata = row.wisata ? serializeWisata(row.wisata) : null;

      if (wisata) {
        const current = popularMap.get(wisata.id_wisata) || {
          ...wisata,
          total_pengunjung: 0,
        };

        current.total_pengunjung += jumlah;
        popularMap.set(wisata.id_wisata, current);
      }
    }

    const wisataList = wisataRows.map(serializeWisata).filter(Boolean);
    const popularWisata = [...popularMap.values()]
      .sort((a, b) => b.total_pengunjung - a.total_pengunjung)
      .slice(0, 3);

    const fallbackPopular = wisataList
      .filter((wisata) => !popularMap.has(wisata.id_wisata))
      .slice(0, Math.max(0, 3 - popularWisata.length))
      .map((wisata) => ({
        ...wisata,
        total_pengunjung: 0,
      }));

    const rataRataKunjungan =
      kunjungan.length > 0 ? Math.round(totalPengunjung / kunjungan.length) : 0;

    return res.json({
      data: {
        tahun,
        total_pengunjung: totalPengunjung,
        pengunjung_hari_ini: pengunjungHariIni,
        wisata_aktif: wisataList.filter((item) => item.status === 'aktif').length,
        rata_rata_kunjungan: rataRataKunjungan,
        total_kunjungan: kunjungan.length,
        chart: monthly,
        wisata_populer: [...popularWisata, ...fallbackPopular],
        wisata: wisataList,
      },
    });
  } catch (error) {
    console.error('Summary kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil ringkasan kunjungan wisata.',
      error: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await KunjunganWisata.findByPk(req.params.id, {
      include: getIncludeWisata(),
    });

    if (!row) {
      return res.status(404).json({
        message: 'Data kunjungan wisata tidak ditemukan.',
      });
    }

    return res.json({
      data: serializeKunjungan(row),
    });
  } catch (error) {
    console.error('Detail kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail kunjungan wisata.',
      error: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      id_wisata: idWisata,
      tanggal_kunjungan: tanggalKunjungan,
      jumlah_pengunjung: jumlahPengunjung,
      asal_pengunjung: asalPengunjung,
      catatan,
    } = req.body;

    if (!idWisata || !tanggalKunjungan || jumlahPengunjung === undefined) {
      return res.status(400).json({
        message: 'Wisata, tanggal kunjungan, dan jumlah pengunjung wajib diisi.',
      });
    }

    if (!isDateInCurrentMonth(tanggalKunjungan)) {
      return res.status(400).json({
        message: 'Tanggal laporan hanya boleh diisi untuk bulan berjalan.',
      });
    }

    if (!(await ensureWisataExists(idWisata))) {
      return res.status(404).json({
        message: 'Data wisata tidak ditemukan.',
      });
    }

    const jumlah = Number(jumlahPengunjung);

    if (!Number.isInteger(jumlah) || jumlah < 0) {
      return res.status(400).json({
        message: 'Jumlah pengunjung harus berupa angka bulat minimal 0.',
      });
    }

    const row = await KunjunganWisata.create({
      id_wisata: idWisata,
      tanggal_kunjungan: tanggalKunjungan,
      jumlah_pengunjung: jumlah,
      asal_pengunjung: asalPengunjung || null,
      catatan: catatan || null,
    });

    const created = await KunjunganWisata.findByPk(row.id_kunjungan, {
      include: getIncludeWisata(),
    });

    return res.status(201).json({
      message: 'Data kunjungan wisata berhasil disimpan.',
      data: serializeKunjungan(created),
    });
  } catch (error) {
    console.error('Create kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menyimpan data kunjungan wisata.',
      error: error.message,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const row = await KunjunganWisata.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({
        message: 'Data kunjungan wisata tidak ditemukan.',
      });
    }

    const nextData = {};

    if (req.body.id_wisata !== undefined) {
      if (!(await ensureWisataExists(req.body.id_wisata))) {
        return res.status(404).json({
          message: 'Data wisata tidak ditemukan.',
        });
      }

      nextData.id_wisata = req.body.id_wisata;
    }

    if (req.body.tanggal_kunjungan !== undefined) {
      if (!isDateInCurrentMonth(req.body.tanggal_kunjungan)) {
        return res.status(400).json({
          message: 'Tanggal laporan hanya boleh diisi untuk bulan berjalan.',
        });
      }

      nextData.tanggal_kunjungan = req.body.tanggal_kunjungan;
    }

    if (req.body.jumlah_pengunjung !== undefined) {
      const jumlah = Number(req.body.jumlah_pengunjung);

      if (!Number.isInteger(jumlah) || jumlah < 0) {
        return res.status(400).json({
          message: 'Jumlah pengunjung harus berupa angka bulat minimal 0.',
        });
      }

      nextData.jumlah_pengunjung = jumlah;
    }

    if (req.body.asal_pengunjung !== undefined) {
      nextData.asal_pengunjung = req.body.asal_pengunjung || null;
    }

    if (req.body.catatan !== undefined) {
      nextData.catatan = req.body.catatan || null;
    }

    await row.update(nextData);

    const updated = await KunjunganWisata.findByPk(row.id_kunjungan, {
      include: getIncludeWisata(),
    });

    return res.json({
      message: 'Data kunjungan wisata berhasil diperbarui.',
      data: serializeKunjungan(updated),
    });
  } catch (error) {
    console.error('Update kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui data kunjungan wisata.',
      error: error.message,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const row = await KunjunganWisata.findByPk(req.params.id);

    if (!row) {
      return res.status(404).json({
        message: 'Data kunjungan wisata tidak ditemukan.',
      });
    }

    await row.destroy();

    return res.json({
      message: 'Data kunjungan wisata berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete kunjungan wisata error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus data kunjungan wisata.',
      error: error.message,
    });
  }
});

module.exports = router;

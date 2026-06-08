const express = require('express');
const {
  Lahan,
  Komoditas,
  Lokasi,
  Panen,
  Peternakan,
  Wisata,
  KunjunganWisata,
  KendalaWisata,
  Laporan,
  User,
} = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const MAX_MESSAGE_LENGTH = 1000;

const SYSTEM_PROMPT = `
Kamu adalah asisten AI pertanian untuk aplikasi Agrosync/Potensi Desa.
Tugasmu membantu petani memahami kondisi lahan, komoditas, hasil panen,
kendala tanaman, dan rekomendasi peningkatan potensi pertanian desa.

Aturan jawaban:
1. Jawab hanya topik pertanian, lahan, komoditas, panen, kendala tanaman,
   iklim/cuaca pertanian, pupuk, hama, pascapanen, dan peningkatan potensi desa.
2. Jika pertanyaan di luar topik, jawab singkat bahwa kamu hanya membantu
   pertanyaan seputar pertanian dan potensi desa.
3. Gunakan bahasa Indonesia yang sederhana, praktis, dan mudah dipahami petani.
4. Berikan langkah tindakan yang realistis, aman, dan tidak berlebihan.
5. Untuk pestisida atau bahan kimia, sarankan mengikuti label produk dan arahan
   penyuluh pertanian setempat.
6. Jika data tidak cukup, jelaskan data apa yang dibutuhkan.
7. Jangan mengarang data lahan atau angka produksi yang tidak tersedia.
`;

const PENGURUS_SYSTEM_PROMPT = `
Kamu adalah asisten AI untuk pengurus desa di aplikasi Agrosync/Potensi Desa.
Tugasmu membantu pengurus desa membaca data potensi wilayah, laporan warga,
lahan belum termanfaatkan, komoditas, peternakan, dan wisata desa.

Aturan jawaban:
1. Jawab hanya topik pengelolaan potensi desa, pertanian, peternakan, wisata,
   laporan kendala, prioritas tindak lanjut, dan pemanfaatan lahan.
2. Jika pertanyaan di luar topik, jawab singkat bahwa kamu hanya membantu
   seputar potensi desa dan tindak lanjut laporan.
3. Gunakan bahasa Indonesia yang sederhana, praktis, dan cocok untuk pengurus desa.
4. Berikan rekomendasi berbentuk langkah kerja yang bisa diverifikasi di lapangan.
5. Bedakan antara data yang tersedia dari aplikasi dan saran/inferensi AI.
6. Jangan mengarang angka, lokasi, atau nama pelapor yang tidak tersedia.
7. Jika data belum cukup, sebutkan data tambahan yang perlu dikumpulkan.
`;

const WISATA_SYSTEM_PROMPT = `
Kamu adalah asisten AI untuk pengelola wisata di aplikasi Agrosync/Potensi Desa.
Tugasmu membantu pengelola wisata membaca data kunjungan, menangani kendala
wisata, meningkatkan fasilitas, dan menyusun strategi promosi.

Aturan jawaban:
1. Jawab hanya topik pengelolaan wisata, pemasaran wisata, fasilitas, kunjungan,
   keluhan pengunjung, dan inovasi daya tarik wisata.
2. Jika pertanyaan di luar topik, jawab singkat bahwa kamu hanya membantu
   seputar pengelolaan wisata desa.
3. Gunakan bahasa Indonesia yang ramah, profesional, dan berorientasi pada layanan pelanggan.
4. Berikan solusi konkret dan langkah-langkah praktis untuk menyelesaikan kendala.
5. Bedakan antara data yang tersedia dari aplikasi dan saran/inferensi AI.
6. Jangan mengarang angka kunjungan atau laporan kendala yang tidak tersedia.
7. Jika data belum cukup, sebutkan data tambahan yang perlu dikumpulkan.
`;

function toPlain(row) {
  return row?.get ? row.get({ plain: true }) : row;
}

function formatNumber(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return '-';

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(number);
}

function formatLahanContext(lahanRows) {
  if (lahanRows.length === 0) {
    return 'Data lahan petani belum tersedia.';
  }

  return lahanRows
    .map((row, index) => {
      const item = toPlain(row);
      const komoditas = item.komoditas?.nama_komoditas || 'Komoditas belum diisi';
      const lokasi =
        item.lokasi_lahan ||
        item.lokasi?.nama_lokasi ||
        item.lokasi?.alamat ||
        'Lokasi belum diisi';

      return [
        `${index + 1}. ${item.nama_lahan}`,
        `komoditas: ${komoditas}`,
        `luas: ${formatNumber(item.luas)} ${item.satuan_luas || 'ha'}`,
        `status: ${item.status || '-'}`,
        `lokasi: ${lokasi}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatPanenContext(panenRows) {
  if (panenRows.length === 0) {
    return 'Riwayat panen petani belum tersedia.';
  }

  return panenRows
    .map((row, index) => {
      const item = toPlain(row);
      const lahan = item.Lahan?.nama_lahan || 'Lahan belum diketahui';
      const komoditas = item.Komoditas?.nama_komoditas || 'Komoditas belum diketahui';

      return [
        `${index + 1}. ${lahan}`,
        `komoditas: ${komoditas}`,
        `periode: ${item.tanggal_mulai_periode || item.tanggal_panen || '-'} s/d ${item.tanggal_selesai_periode || '-'}`,
        `hasil: ${formatNumber(item.jumlah)} ${item.satuan || ''}`.trim(),
        `produktivitas: ${formatNumber(item.produktivitas)} ton/ha`,
        `kualitas: ${item.kualitas || '-'}`,
      ].join(' | ');
    })
    .join('\n');
}

function getLocationText(lokasi) {
  if (!lokasi) return 'Lokasi belum diisi';

  return (
    lokasi.nama_lokasi ||
    lokasi.alamat ||
    [
      lokasi.desa_kelurahan,
      lokasi.kecamatan,
      lokasi.kabupaten_kota,
    ].filter(Boolean).join(', ') ||
    'Lokasi belum diisi'
  );
}

function formatPengurusLahanContext(lahanRows) {
  if (lahanRows.length === 0) {
    return 'Data lahan/potensi pertanian belum tersedia.';
  }

  return lahanRows
    .map((row, index) => {
      const item = toPlain(row);
      const komoditas = item.komoditas?.nama_komoditas || 'Komoditas belum diisi';
      const lokasi = item.lokasi_lahan || item.nama_tempat || getLocationText(item.lokasi);
      const pelapor = item.user?.name || 'Petani';

      return [
        `${index + 1}. ${item.nama_lahan}`,
        `komoditas: ${komoditas}`,
        `luas: ${formatNumber(item.luas)} ${item.satuan_luas || 'ha'}`,
        `status: ${item.status || '-'}`,
        `lokasi: ${lokasi}`,
        `pelapor: ${pelapor}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatPeternakanContext(peternakanRows) {
  if (peternakanRows.length === 0) {
    return 'Data peternakan belum tersedia.';
  }

  return peternakanRows
    .map((row, index) => {
      const item = toPlain(row);
      const lokasi = getLocationText(item.Lokasi);
      const pelapor = item.User?.name || 'Peternak';

      return [
        `${index + 1}. ${item.nama_peternakan || 'Peternakan tanpa nama'}`,
        `jenis: ${item.jenis_ternak || '-'}`,
        `skala: ${item.skala || '-'}`,
        `status: ${item.status || '-'}`,
        `lokasi: ${lokasi}`,
        `pelapor: ${pelapor}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatLaporanContext(laporanRows) {
  if (laporanRows.length === 0) {
    return 'Data laporan kendala pertanian/peternakan belum tersedia.';
  }

  return laporanRows
    .map((row, index) => {
      const item = toPlain(row);
      const pelapor = item.User?.name || 'Pelapor';

      return [
        `${index + 1}. ${item.judul || 'Laporan tanpa judul'}`,
        `kategori: ${item.kategori || item.reportable_type || '-'}`,
        `status: ${item.status || '-'}`,
        `tingkat: ${item.tingkat_keparahan || '-'}`,
        `tanggal: ${item.tanggal || '-'}`,
        `lokasi: ${item.lokasi_kendala || 'Lokasi belum diisi'}`,
        `pelapor: ${pelapor}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatWisataContext(wisataRows) {
  if (wisataRows.length === 0) {
    return 'Data wisata belum tersedia.';
  }

  return wisataRows
    .map((row, index) => {
      const item = toPlain(row);

      return [
        `${index + 1}. ${item.nama_wisata || 'Wisata tanpa nama'}`,
        `jenis: ${item.jenis_wisata || '-'}`,
        `status: ${item.status || '-'}`,
        `rating: ${formatNumber(item.rating)} (${formatNumber(item.jumlah_ulasan)} ulasan)`,
        `fasilitas: ${item.fasilitas || '-'}`,
        `lokasi: ${getLocationText(item.Lokasi)}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatKendalaWisataContext(kendalaRows) {
  if (kendalaRows.length === 0) {
    return 'Data kendala wisata belum tersedia.';
  }

  return kendalaRows
    .map((row, index) => {
      const item = toPlain(row);

      return [
        `${index + 1}. ${item.judul || 'Kendala tanpa judul'}`,
        `wisata: ${item.wisata?.nama_wisata || '-'}`,
        `kategori: ${item.kategori || '-'}`,
        `status: ${item.status || '-'}`,
        `tingkat: ${item.tingkat_keparahan || '-'}`,
        `tanggal: ${item.tanggal || '-'}`,
        `lokasi: ${item.lokasi_kendala || getLocationText(item.wisata?.Lokasi)}`,
      ].join(' | ');
    })
    .join('\n');
}

function formatKunjunganContext(kunjunganRows) {
  if (kunjunganRows.length === 0) {
    return 'Data kunjungan wisata belum tersedia.';
  }

  return kunjunganRows
    .map((row, index) => {
      const item = toPlain(row);

      return [
        `${index + 1}. ${item.wisata?.nama_wisata || 'Wisata'}`,
        `tanggal: ${item.tanggal_kunjungan || '-'}`,
        `jumlah: ${formatNumber(item.jumlah_pengunjung)} pengunjung`,
        `asal: ${item.asal_pengunjung || '-'}`,
      ].join(' | ');
    })
    .join('\n');
}

async function getAgricultureContext(userId) {
  const [lahanRows, panenRows] = await Promise.all([
    Lahan.findAll({
      where: { id_user: userId },
      include: [
        {
          model: Komoditas,
          as: 'komoditas',
          attributes: ['nama_komoditas'],
        },
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['nama_lokasi', 'alamat', 'desa_kelurahan', 'kecamatan', 'kabupaten_kota'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 8,
    }),
    Panen.findAll({
      include: [
        {
          model: Lahan,
          where: { id_user: userId },
          attributes: ['nama_lahan'],
          required: true,
        },
        {
          model: Komoditas,
          attributes: ['nama_komoditas'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 8,
    }),
  ]);

  return [
    'Konteks data petani dari aplikasi:',
    '',
    'Lahan:',
    formatLahanContext(lahanRows),
    '',
    'Riwayat panen terbaru:',
    formatPanenContext(panenRows),
  ].join('\n');
}

async function getPengurusContext() {
  const [lahanRows, peternakanRows, laporanRows, wisataRows, kendalaWisataRows, kunjunganRows] =
    await Promise.all([
      Lahan.findAll({
        include: [
          {
            model: Komoditas,
            as: 'komoditas',
            attributes: ['nama_komoditas'],
          },
          {
            model: Lokasi,
            as: 'lokasi',
            required: false,
          },
          {
            model: User,
            as: 'user',
            attributes: ['name'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 12,
      }),
      Peternakan.findAll({
        include: [
          {
            model: Lokasi,
            required: false,
          },
          {
            model: User,
            attributes: ['name'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 8,
      }),
      Laporan.findAll({
        include: [
          {
            model: User,
            attributes: ['name'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      Wisata.findAll({
        include: [
          {
            model: Lokasi,
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 8,
      }),
      KendalaWisata.findAll({
        include: [
          {
            model: Wisata,
            as: 'wisata',
            include: [
              {
                model: Lokasi,
                required: false,
              },
            ],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      KunjunganWisata.findAll({
        include: [
          {
            model: Wisata,
            as: 'wisata',
            required: false,
          },
        ],
        order: [['tanggal_kunjungan', 'DESC']],
        limit: 10,
      }),
    ]);

  return [
    'Konteks data pengurus desa dari aplikasi:',
    '',
    'Potensi pertanian/lahan:',
    formatPengurusLahanContext(lahanRows),
    '',
    'Potensi peternakan:',
    formatPeternakanContext(peternakanRows),
    '',
    'Laporan kendala pertanian/peternakan terbaru:',
    formatLaporanContext(laporanRows),
    '',
    'Data wisata:',
    formatWisataContext(wisataRows),
    '',
    'Kendala wisata terbaru:',
    formatKendalaWisataContext(kendalaWisataRows),
    '',
    'Kunjungan wisata terbaru:',
    formatKunjunganContext(kunjunganRows),
  ].join('\n');
}

async function getWisataDashboardContext() {
  const [wisataRows, kendalaWisataRows, kunjunganRows] =
    await Promise.all([
      Wisata.findAll({
        include: [
          {
            model: Lokasi,
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 12,
      }),
      KendalaWisata.findAll({
        include: [
          {
            model: Wisata,
            as: 'wisata',
            include: [
              {
                model: Lokasi,
                required: false,
              },
            ],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      KunjunganWisata.findAll({
        include: [
          {
            model: Wisata,
            as: 'wisata',
            required: false,
          },
        ],
        order: [['tanggal_kunjungan', 'DESC']],
        limit: 10,
      }),
    ]);

  return [
    'Konteks data pengelolaan wisata dari aplikasi:',
    '',
    'Data wisata:',
    formatWisataContext(wisataRows),
    '',
    'Kendala wisata terbaru:',
    formatKendalaWisataContext(kendalaWisataRows),
    '',
    'Kunjungan wisata terbaru:',
    formatKunjunganContext(kunjunganRows),
  ].join('\n');
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-6)
    .filter((item) => item?.content && ['user', 'assistant'].includes(item.role))
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(item.content).slice(0, MAX_MESSAGE_LENGTH) }],
    }));
}

function getGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || '').join('\n').trim();
}

async function callGemini({
  apiKey,
  model,
  message,
  history,
  context,
  systemPrompt = SYSTEM_PROMPT,
  questionLabel = 'Pertanyaan pengguna',
}) {
  if (typeof fetch !== 'function') {
    throw new Error('Runtime Node belum mendukung fetch.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt.trim() }],
          },
          contents: [
            ...normalizeHistory(history),
            {
              role: 'user',
              parts: [
                {
                  text: `${context}\n\n${questionLabel}:\n${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.55,
            topP: 0.9,
            maxOutputTokens: 900,
          },
        }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = data?.error?.message || 'Gemini API tidak dapat memproses permintaan.';
      throw new Error(detail);
    }

    const answer = getGeminiText(data);

    if (!answer) {
      throw new Error('Gemini tidak mengembalikan jawaban.');
    }

    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

router.use(protect);
router.use(authorize('petani', 'pengurus', 'wisata'));

router.post('/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const history = req.body?.history || [];
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const role = req.user?.role;

  if (!message) {
    return res.status(400).json({ message: 'Pertanyaan wajib diisi.' });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `Pertanyaan maksimal ${MAX_MESSAGE_LENGTH} karakter.`,
    });
  }

  if (!apiKey || apiKey === 'your_gemini_api_key') {
    return res.status(503).json({
      message: 'Gemini API key belum dikonfigurasi di server/.env.',
    });
  }

  try {
    let context;
    let systemPrompt;
    let questionLabel;

    if (role === 'pengurus') {
      context = await getPengurusContext();
      systemPrompt = PENGURUS_SYSTEM_PROMPT;
      questionLabel = 'Pertanyaan pengurus desa';
    } else if (role === 'wisata') {
      context = await getWisataDashboardContext();
      systemPrompt = WISATA_SYSTEM_PROMPT;
      questionLabel = 'Pertanyaan pengelola wisata';
    } else {
      context = await getAgricultureContext(req.user.id);
      systemPrompt = SYSTEM_PROMPT;
      questionLabel = 'Pertanyaan petani';
    }

    const answer = await callGemini({
      apiKey,
      model,
      message,
      history,
      context,
      systemPrompt,
      questionLabel,
    });

    return res.json({
      answer,
      model,
    });
  } catch (error) {
    console.error('Gemini chat error:', error);

    return res.status(500).json({
      message: 'Gagal mendapatkan jawaban AI.',
      error: error.message,
    });
  }
});

module.exports = router;

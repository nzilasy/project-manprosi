const express = require('express');
const { Lahan, Komoditas, Lokasi, Panen } = require('../models/index');
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

async function callGemini({ apiKey, model, message, history, context }) {
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
            parts: [{ text: SYSTEM_PROMPT.trim() }],
          },
          contents: [
            ...normalizeHistory(history),
            {
              role: 'user',
              parts: [
                {
                  text: `${context}\n\nPertanyaan petani:\n${message}`,
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
router.use(authorize('petani'));

router.post('/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const history = req.body?.history || [];
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

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
    const context = await getAgricultureContext(req.user.id);
    const answer = await callGemini({
      apiKey,
      model,
      message,
      history,
      context,
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

const express = require('express');
const { Op } = require('sequelize');
const { Komoditas } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

// GET /api/komoditas
router.get('/', async (req, res) => {
  try {
    const { q, id_kategori } = req.query;

    const where = {};

    if (q) {
      where.nama_komoditas = {
        [Op.like]: `%${q}%`,
      };
    }

    if (id_kategori) {
      where.id_kategori = id_kategori;
    }

    const komoditas = await Komoditas.findAll({
      where,
      order: [['nama_komoditas', 'ASC']],
    });

    return res.json({
      data: komoditas,
    });
  } catch (error) {
    console.error('Get komoditas error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data komoditas.',
      error: error.message,
    });
  }
});

// GET /api/komoditas/:id
router.get('/:id', async (req, res) => {
  try {
    const komoditas = await Komoditas.findByPk(req.params.id);

    if (!komoditas) {
      return res.status(404).json({
        message: 'Komoditas tidak ditemukan.',
      });
    }

    return res.json({
      data: komoditas,
    });
  } catch (error) {
    console.error('Get komoditas detail error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail komoditas.',
      error: error.message,
    });
  }
});

// POST /api/komoditas
router.post('/', authorize('pengurus'), async (req, res) => {
  try {
    const {
      id_kategori,
      nama_komoditas,
      satuan,
      deskripsi,
    } = req.body;

    if (!nama_komoditas || nama_komoditas.trim() === '') {
      return res.status(400).json({
        message: 'Nama komoditas wajib diisi.',
      });
    }

    const komoditas = await Komoditas.create({
      id_kategori: id_kategori || null,
      nama_komoditas: nama_komoditas.trim(),
      satuan: satuan || null,
      deskripsi: deskripsi || null,
    });

    return res.status(201).json({
      message: 'Komoditas berhasil dibuat.',
      data: komoditas,
    });
  } catch (error) {
    console.error('Create komoditas error:', error);

    return res.status(500).json({
      message: 'Gagal membuat komoditas.',
      error: error.message,
    });
  }
});

// PUT /api/komoditas/:id
router.put('/:id', authorize('pengurus'), async (req, res) => {
  try {
    const komoditas = await Komoditas.findByPk(req.params.id);

    if (!komoditas) {
      return res.status(404).json({
        message: 'Komoditas tidak ditemukan.',
      });
    }

    await komoditas.update({
      id_kategori: req.body.id_kategori ?? komoditas.id_kategori,
      nama_komoditas:
        req.body.nama_komoditas !== undefined
          ? req.body.nama_komoditas.trim()
          : komoditas.nama_komoditas,
      satuan: req.body.satuan ?? komoditas.satuan,
      deskripsi: req.body.deskripsi ?? komoditas.deskripsi,
    });

    return res.json({
      message: 'Komoditas berhasil diperbarui.',
      data: komoditas,
    });
  } catch (error) {
    console.error('Update komoditas error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui komoditas.',
      error: error.message,
    });
  }
});

// DELETE /api/komoditas/:id
router.delete('/:id', authorize('pengurus'), async (req, res) => {
  try {
    const komoditas = await Komoditas.findByPk(req.params.id);

    if (!komoditas) {
      return res.status(404).json({
        message: 'Komoditas tidak ditemukan.',
      });
    }

    await komoditas.destroy();

    return res.json({
      message: 'Komoditas berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete komoditas error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus komoditas.',
      error: error.message,
    });
  }
});

module.exports = router;
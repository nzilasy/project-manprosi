const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Role } = require('../models/index');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const VALID_ROLES = ['petani', 'pengurus', 'masyarakat', 'wisata'];
const RESET_TOKEN_EXPIRES_IN_MS = 60 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, role: roleName } = req.body;

  if (!name || !email || !password || !roleName) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }
  if (!VALID_ROLES.includes(roleName)) {
    return res.status(400).json({ message: 'Role tidak valid.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  }

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    const roleRecord = await Role.findOne({ where: { name: roleName } });
    if (!roleRecord) {
      return res.status(500).json({ message: 'Role tidak ditemukan di database.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      id_role: roleRecord.id_role,
    });

    return res.status(201).json({
      message: 'Registrasi berhasil.',
      userId: user.id_user,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ['name'] }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const roleName = user.Role?.name ?? null;

    const token = jwt.sign(
      { id: user.id_user, role: roleName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id_user,
        name: user.name,
        email: user.email,
        role: roleName,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email wajib diisi.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        message: 'Jika email terdaftar, link reset password akan tersedia.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `/reset-password/${resetToken}`;

    await user.update({
      reset_password_token: hashResetToken(resetToken),
      reset_password_expires: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS),
    });

    return res.json({
      message: 'Link reset password berhasil dibuat.',
      reset_url: resetUrl,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password baru wajib diisi.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  }

  try {
    const user = await User.findOne({
      where: {
        reset_password_token: hashResetToken(token),
        reset_password_expires: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Link reset password tidak valid atau sudah kadaluarsa.',
      });
    }

    await user.update({
      password: await bcrypt.hash(password, 10),
      reset_password_token: null,
      reset_password_expires: null,
    });

    return res.json({
      message: 'Password berhasil diperbarui. Silakan login.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id_user', 'name', 'email', 'phone', 'created_at'],
      include: [{ model: Role, attributes: ['name'] }],
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    return res.json({
      user: {
        id: user.id_user,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.Role?.name ?? null,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RekomendasiAI = sequelize.define('RekomendasiAI', {
  id_rekomendasi: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recommendable_type: { type: DataTypes.ENUM('lahan', 'peternakan') },
  recommendable_id: { type: DataTypes.INTEGER },
  judul: { type: DataTypes.STRING(150) },
  rekomendasi: { type: DataTypes.TEXT },
  tanggal: { type: DataTypes.DATEONLY },
}, { tableName: 'rekomendasi_ai', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = RekomendasiAI;
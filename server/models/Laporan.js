const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Laporan = sequelize.define('Laporan', {
  id_laporan: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_user: { type: DataTypes.INTEGER },
  reportable_type: { type: DataTypes.ENUM('lahan', 'peternakan') },
  reportable_id: { type: DataTypes.INTEGER },
  kategori: { type: DataTypes.STRING(80), allowNull: true },
  tingkat_keparahan: { type: DataTypes.STRING(50), allowNull: true },
  lokasi_kendala: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.STRING(50), defaultValue: 'baru' },
  judul: { type: DataTypes.STRING(150) },
  deskripsi: { type: DataTypes.TEXT },
  tanggal: { type: DataTypes.DATEONLY },
  lampiran: { type: DataTypes.TEXT },
}, { tableName: 'laporan', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Laporan;

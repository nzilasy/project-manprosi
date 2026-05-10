const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wisata = sequelize.define('Wisata', {
  id_wisata: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_lokasi: { type: DataTypes.INTEGER },
  nama_wisata: { type: DataTypes.STRING(100) },
  jenis_wisata: { type: DataTypes.STRING(100) },
  deskripsi: { type: DataTypes.TEXT },
  harga_tiket: { type: DataTypes.DECIMAL(10, 2) },
  fasilitas: { type: DataTypes.TEXT },
  foto: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING(50) },
}, { tableName: 'wisata', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Wisata;
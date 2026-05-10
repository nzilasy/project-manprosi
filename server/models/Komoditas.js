const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Komoditas = sequelize.define('Komoditas', {
  id_komoditas: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_kategori: { type: DataTypes.INTEGER },
  nama_komoditas: { type: DataTypes.STRING(100) },
  satuan: { type: DataTypes.STRING(50) },
  deskripsi: { type: DataTypes.TEXT },
}, { tableName: 'komoditas', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Komoditas;
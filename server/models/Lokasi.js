const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lokasi = sequelize.define('Lokasi', {
  id_lokasi: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nama_lokasi: { type: DataTypes.STRING(100) },
  alamat: { type: DataTypes.TEXT },
  desa_kelurahan: { type: DataTypes.STRING(100) },
  kecamatan: { type: DataTypes.STRING(100) },
  kabupaten_kota: { type: DataTypes.STRING(100) },
  provinsi: { type: DataTypes.STRING(100) },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
}, { tableName: 'lokasi', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Lokasi;
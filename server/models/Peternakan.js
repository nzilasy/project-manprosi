const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Peternakan = sequelize.define('Peternakan', {
  id_peternakan: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_user: { type: DataTypes.INTEGER },
  id_lokasi: { type: DataTypes.INTEGER },
  nama_peternakan: { type: DataTypes.STRING(100) },
  jenis_ternak: { type: DataTypes.STRING(100) },
  skala: { type: DataTypes.STRING(50) },
  status: { type: DataTypes.STRING(50) },
  deskripsi: { type: DataTypes.TEXT },
}, { tableName: 'peternakan', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Peternakan;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lahan = sequelize.define('Lahan', {
  id_lahan: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_user: { type: DataTypes.INTEGER },
  id_lokasi: { type: DataTypes.INTEGER },
  nama_lahan: { type: DataTypes.STRING(100) },
  luas: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.STRING(50) },
  deskripsi: { type: DataTypes.TEXT },
}, { tableName: 'lahan', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Lahan;
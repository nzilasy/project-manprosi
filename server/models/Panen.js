const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Panen = sequelize.define('Panen', {
  id_panen: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_lahan: { type: DataTypes.INTEGER },
  id_komoditas: { type: DataTypes.INTEGER },
  tanggal_panen: { type: DataTypes.DATEONLY },
  jumlah: { type: DataTypes.DECIMAL(10, 2) },
  satuan: { type: DataTypes.STRING(50) },
  kualitas: { type: DataTypes.STRING(50) },
  harga_jual: { type: DataTypes.DECIMAL(12, 2) },
  keterangan: { type: DataTypes.TEXT },
}, { tableName: 'panen', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Panen;
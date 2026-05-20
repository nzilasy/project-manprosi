const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Panen = sequelize.define('Panen', {
  id_panen: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_lahan: { type: DataTypes.INTEGER },
  id_komoditas: { type: DataTypes.INTEGER },
  tanggal_mulai_periode: { type: DataTypes.DATEONLY, allowNull: true },
  tanggal_selesai_periode: { type: DataTypes.DATEONLY, allowNull: true },
  tanggal_panen: { type: DataTypes.DATEONLY },
  luas_panen: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  satuan_luas_panen: { type: DataTypes.STRING(20), allowNull: true },
  jumlah: { type: DataTypes.DECIMAL(10, 2) },
  satuan: { type: DataTypes.STRING(50) },
  produktivitas: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  kadar_air: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  kualitas: { type: DataTypes.STRING(50) },
  harga_jual: { type: DataTypes.DECIMAL(12, 2) },
  foto_panen: { type: DataTypes.JSON, allowNull: true },
  keterangan: { type: DataTypes.TEXT },
}, { tableName: 'panen', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Panen;

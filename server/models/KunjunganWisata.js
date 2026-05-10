const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const KunjunganWisata = sequelize.define('KunjunganWisata', {
  id_kunjungan: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_wisata: { type: DataTypes.INTEGER },
  tanggal_kunjungan: { type: DataTypes.DATEONLY },
  jumlah_pengunjung: { type: DataTypes.INTEGER },
  asal_pengunjung: { type: DataTypes.STRING(100) },
}, { tableName: 'kunjungan_wisata', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = KunjunganWisata;
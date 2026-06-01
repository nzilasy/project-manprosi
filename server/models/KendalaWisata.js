const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const KendalaWisata = sequelize.define('KendalaWisata', {
  id_kendala_wisata: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_user: { type: DataTypes.INTEGER },
  id_wisata: { type: DataTypes.INTEGER },
  kategori: { type: DataTypes.STRING(80), allowNull: false },
  tingkat_keparahan: { type: DataTypes.STRING(50), defaultValue: 'sedang' },
  lokasi_kendala: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.STRING(50), defaultValue: 'belum_diproses' },
  judul: { type: DataTypes.STRING(150), allowNull: false },
  deskripsi: { type: DataTypes.TEXT, allowNull: false },
  tanggal: { type: DataTypes.DATEONLY },
  lampiran: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'kendala_wisata',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = KendalaWisata;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Lahan = sequelize.define('Lahan', {
  id_lahan: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_lokasi: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_komoditas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nama_lahan: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nama_tempat: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  luas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  satuan_luas: {
    type: DataTypes.STRING(20),
    defaultValue: 'ha',
  },
  lokasi_lahan: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tanggal_tanam_terakhir: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  polygon_lahan: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'aktif',
  },
  catatan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'lahan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Lahan;

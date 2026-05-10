const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Kategori = sequelize.define('Kategori', {
  id_kategori: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nama_kategori: { type: DataTypes.STRING(100) },
  deskripsi: { type: DataTypes.TEXT },
}, { tableName: 'kategori', timestamps: false });

module.exports = Kategori;
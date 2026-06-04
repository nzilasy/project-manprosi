const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WisataRating = sequelize.define('WisataRating', {
  id_rating: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_wisata: { type: DataTypes.INTEGER, allowNull: false },
  id_user: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false },
  ulasan: { type: DataTypes.TEXT, allowNull: true },
  balasan: { type: DataTypes.TEXT, allowNull: true },
  balasan_by: { type: DataTypes.INTEGER, allowNull: true },
  balasan_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'wisata_rating',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['id_wisata', 'id_user'],
    },
  ],
});

module.exports = WisataRating;

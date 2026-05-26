const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id_user: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  id_role: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(100) },
  password: { type: DataTypes.STRING(255) },
  phone: { type: DataTypes.STRING(20) },
  reset_password_token: { type: DataTypes.STRING(255), allowNull: true },
  reset_password_expires: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'user', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

module.exports = User;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, unique: true },
  phone:    { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.ENUM('driver', 'manager', 'client'), allowNull: false },
  vehicle:  { type: DataTypes.STRING },
  status:   { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'users' });

module.exports = User;
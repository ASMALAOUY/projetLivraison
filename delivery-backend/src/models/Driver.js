const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Driver = sequelize.define('Driver', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  phone:    { type: DataTypes.STRING, allowNull: false, unique: true },
  vehicle:  { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
  status:   { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'drivers' });

module.exports = Driver;
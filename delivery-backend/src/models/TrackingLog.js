const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackingLog = sequelize.define('TrackingLog', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  eventType: { type: DataTypes.ENUM('gps','status_change'), allowNull: false },
  latitude:  { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  newStatus: { type: DataTypes.STRING },
}, { tableName: 'tracking_logs' });

module.exports = TrackingLog;
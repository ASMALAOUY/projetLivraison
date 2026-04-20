const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackingLog = sequelize.define('TrackingLog', {
  id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId:  { type: DataTypes.UUID, allowNull: true },
  pointId:   { type: DataTypes.UUID, allowNull: true },
  eventType: { type: DataTypes.ENUM('gps', 'status_change'), allowNull: false },
  latitude:  { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  newStatus: { type: DataTypes.STRING },
}, {
  tableName:  'tracking_logs',
  timestamps: true,
  indexes: [{ fields: ['driverId'] }],
});

module.exports = TrackingLog;
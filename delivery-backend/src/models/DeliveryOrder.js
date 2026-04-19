const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryOrder = sequelize.define('DeliveryOrder', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId:   { type: DataTypes.UUID, allowNull: false },
  managerId:  { type: DataTypes.UUID },
  date:       { type: DataTypes.DATEONLY, allowNull: false },
  status:     { type: DataTypes.ENUM('planned','in_progress','done'), defaultValue: 'planned' },
  startedAt:  { type: DataTypes.DATE },
  finishedAt: { type: DataTypes.DATE },
}, { tableName: 'delivery_orders' });

module.exports = DeliveryOrder;
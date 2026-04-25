const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryOrder = sequelize.define('DeliveryOrder', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  driverId:   { type: DataTypes.UUID, allowNull: true },
  managerId:  { type: DataTypes.UUID, allowNull: true },
  date:       { type: DataTypes.DATEONLY, allowNull: false },
  status:     {
    type: DataTypes.ENUM('pending_acceptance', 'planned', 'in_progress', 'done'),
    defaultValue: 'pending_acceptance',
  },
  startedAt:  { type: DataTypes.DATE },
  finishedAt: { type: DataTypes.DATE },
}, { 
  tableName: 'delivery_orders',
  timestamps: true,
  //  Désactiver la création automatique des contraintes
  define: {
    freezeTableName: true
  }
});

module.exports = DeliveryOrder;
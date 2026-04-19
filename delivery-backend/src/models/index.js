const sequelize     = require('../config/database');
const User          = require('./User');
const DeliveryOrder = require('./DeliveryOrder');
const DeliveryPoint = require('./DeliveryPoint');
const TrackingLog   = require('./TrackingLog');

// ── Livreur ──────────────────────────────────────────────
User.hasMany(DeliveryOrder, {
  foreignKey: 'driverId',
  as: 'DriverOrders',
});
DeliveryOrder.belongsTo(User, {
  foreignKey: 'driverId',
  as: 'Driver',
});

// ── Gestionnaire ─────────────────────────────────────────
User.hasMany(DeliveryOrder, {
  foreignKey: 'managerId',
  as: 'ManagedOrders',
});
DeliveryOrder.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'Manager',
});

// ── Tournée → Points ─────────────────────────────────────
DeliveryOrder.hasMany(DeliveryPoint, {
  foreignKey: 'orderId',
  as: 'DeliveryPoints',
});
DeliveryPoint.belongsTo(DeliveryOrder, {
  foreignKey: 'orderId',
});

// ── Client → Points ──────────────────────────────────────
User.hasMany(DeliveryPoint, {
  foreignKey: 'clientId',
  as: 'ClientPoints',
});
DeliveryPoint.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'Client',
});

// ── Livreur → TrackingLogs ───────────────────────────────
User.hasMany(TrackingLog, {
  foreignKey: 'driverId',
  as: 'TrackingLogs',
});
TrackingLog.belongsTo(User, {
  foreignKey: 'driverId',
  as: 'TrackingDriver',
});

// ── Point → TrackingLogs ─────────────────────────────────
DeliveryPoint.hasMany(TrackingLog, {
  foreignKey: 'pointId',
  as: 'Logs',
});
TrackingLog.belongsTo(DeliveryPoint, {
  foreignKey: 'pointId',
});

module.exports = { sequelize, User, DeliveryOrder, DeliveryPoint, TrackingLog };
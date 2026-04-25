const sequelize = require('../config/database');
const User = require('./User');
const Driver = require('./Driver');
const DeliveryOrder = require('./DeliveryOrder');
const DeliveryPoint = require('./DeliveryPoint');
const TrackingLog = require('./TrackingLog');

// ── Driver (table séparée) → Tournées ─────────────────────
// constraints: false = Sequelize ne crée PAS de FK en DB
// car driverId dans delivery_orders pointe vers 'users', pas 'drivers'
Driver.hasMany(DeliveryOrder, {
  foreignKey: 'driverId',
  as: 'DriverOrders',
  constraints: false,
});
DeliveryOrder.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'Driver',
  constraints: false,
});

// ── Gestionnaire (User) → Tournées ─────────────────────────
User.hasMany(DeliveryOrder, {
  foreignKey: 'managerId',
  as: 'ManagedOrders',
  constraints: false,
});
DeliveryOrder.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'Manager',
  constraints: false,
});

// ── Tournée → Points ──────────────────────────────────────
DeliveryOrder.hasMany(DeliveryPoint, {
  foreignKey: 'orderId',
  as: 'DeliveryPoints',
});
DeliveryPoint.belongsTo(DeliveryOrder, {
  foreignKey: 'orderId',
  as: 'DeliveryOrder',
});

// ── Client (User) → Points ─────────────────────────────────
User.hasMany(DeliveryPoint, {
  foreignKey: 'clientId',
  as: 'ClientPoints',
  constraints: false,
});
DeliveryPoint.belongsTo(User, {
  foreignKey: 'clientId',
  as: 'Client',
  constraints: false,
});

// ── TrackingLog → User (livreur) ───────────────────────────
// ✅ CORRECTION : driverId dans tracking_logs = UUID de 'users' (pas 'drivers')
// constraints: false empêche la recréation de la FK vers 'drivers'
User.hasMany(TrackingLog, {
  foreignKey: 'driverId',
  as: 'TrackingLogs',
  constraints: false,
});
TrackingLog.belongsTo(User, {
  foreignKey: 'driverId',
  as: 'TrackingDriver',
  constraints: false,
});

// ── Point → TrackingLogs ──────────────────────────────────
DeliveryPoint.hasMany(TrackingLog, {
  foreignKey: 'pointId',
  as: 'Logs',
  constraints: false,
});
TrackingLog.belongsTo(DeliveryPoint, {
  foreignKey: 'pointId',
  as: 'DeliveryPoint',
  constraints: false,
});

module.exports = { sequelize, User, Driver, DeliveryOrder, DeliveryPoint, TrackingLog };
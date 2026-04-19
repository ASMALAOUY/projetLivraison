const sequelize     = require('../config/database');
const User          = require('./User');
const DeliveryOrder = require('./DeliveryOrder');
const DeliveryPoint = require('./DeliveryPoint');
const TrackingLog   = require('./TrackingLog');

// Un gestionnaire crée des ordres
User.hasMany(DeliveryOrder, { foreignKey: 'managerId', as: 'ManagedOrders' });
DeliveryOrder.belongsTo(User, { foreignKey: 'managerId', as: 'Manager' });

// Un livreur est assigné à des ordres
User.hasMany(DeliveryOrder, { foreignKey: 'driverId', as: 'DriverOrders' });
DeliveryOrder.belongsTo(User, { foreignKey: 'driverId', as: 'Driver' });

// Un client peut avoir des points de livraison
User.hasMany(DeliveryPoint, { foreignKey: 'clientId', as: 'DeliveryPoints' });
DeliveryPoint.belongsTo(User, { foreignKey: 'clientId', as: 'Client' });

// Un livreur génère des logs de tracking
User.hasMany(TrackingLog, { foreignKey: 'driverId', as: 'TrackingLogs' });
TrackingLog.belongsTo(User, { foreignKey: 'driverId', as: 'Driver' });

DeliveryOrder.hasMany(DeliveryPoint, { foreignKey: 'orderId' });
DeliveryPoint.belongsTo(DeliveryOrder, { foreignKey: 'orderId' });

DeliveryPoint.hasMany(TrackingLog, { foreignKey: 'pointId' });
TrackingLog.belongsTo(DeliveryPoint, { foreignKey: 'pointId' });

module.exports = { sequelize, User, DeliveryOrder, DeliveryPoint, TrackingLog };
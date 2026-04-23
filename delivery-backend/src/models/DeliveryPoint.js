const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryPoint = sequelize.define('DeliveryPoint', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId:     { type: DataTypes.UUID, allowNull: false },
  clientId:    { type: DataTypes.UUID },
  address:     { type: DataTypes.STRING, allowNull: false },
  latitude:    { type: DataTypes.FLOAT, allowNull: false },
  longitude:   { type: DataTypes.FLOAT, allowNull: false },
  sequence:    { type: DataTypes.INTEGER, allowNull: false },
  status:      { type: DataTypes.ENUM('pending','in_progress','delivered','failed'), defaultValue: 'pending' },
  clientName:  { type: DataTypes.STRING },
  failureNote: { type: DataTypes.TEXT },
  items:       { type: DataTypes.JSONB },       // ← liste des articles commandés
  totalPrice:  { type: DataTypes.FLOAT },       // ← prix total
  pickupAddress: { type: DataTypes.STRING },    // ← adresse de récupération
  rating:        { type: DataTypes.INTEGER },        // 1 à 5
ratingComment: { type: DataTypes.STRING },         // commentaire optionnel
}, { tableName: 'delivery_points' });

module.exports = DeliveryPoint;
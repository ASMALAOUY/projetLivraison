const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, DeliveryOrder, User, Driver } = require('../models');
const { Op } = require('sequelize');

// ─── Créer une commande ───────────────────────────────────────────────────────
router.post('/order', auth, async (req, res, next) => {
  try {
    const { address, latitude, longitude, note, items, pickupAddress } = req.body;

    if (!address)       return res.status(400).json({ error: 'Adresse requise' });
    if (!items?.length) return res.status(400).json({ error: 'Ajoutez au moins un article' });

    const client  = await User.findByPk(req.user.id);
    if (!client)  return res.status(404).json({ error: 'Client introuvable' });

    const manager = await User.findOne({ where: { role: 'manager', status: 'active' } });

    const today      = new Date().toISOString().split('T')[0];
    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const order = await DeliveryOrder.create({
      driverId:  null,
      managerId: manager?.id || null,
      date:      today,
      status:    'planned',
    });

    const count = await DeliveryPoint.count({ where: { orderId: order.id } });

    const point = await DeliveryPoint.create({
      orderId:       order.id,
      clientId:      client.id,
      address,
      latitude:      latitude  || 31.6295,
      longitude:     longitude || -7.9811,
      sequence:      count + 1,
      status:        'pending',
      clientName:    client.name,
      failureNote:   note || null,
      items,
      totalPrice,
      pickupAddress: pickupAddress || 'Entrepôt central',
    });

    res.status(201).json({
      message: 'Commande créée avec succès !',
      orderId: order.id,
      pointId: point.id,
    });
  } catch (e) {
    console.error('ERREUR client/order:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Mes commandes (client connecté) ─────────────────────────────────────────
router.get('/my-orders', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where:  { clientId: req.user.id },
      order:  [['createdAt', 'DESC']],
    });

    const result = [];

    for (const point of points) {
      const pointData = point.toJSON();

      // Formater les items
      if (typeof pointData.items === 'string') {
        try   { pointData.items = JSON.parse(pointData.items); }
        catch { pointData.items = []; }
      }

      // Récupérer la tournée
      const order = await DeliveryOrder.findByPk(point.orderId);


   
      let driverData = null;

      // Priorité 1 : driverAcceptedId sur le point lui-même
      const driverUserId = pointData.driverAcceptedId || (order && order.driverId);

      if (driverUserId) {
        // Chercher d'abord dans users (role=driver)
        const driverUser = await User.findOne({
          where: { id: driverUserId, role: 'driver' },
          attributes: ['id', 'name', 'phone', 'vehicle'],
        });
        if (driverUser) {
          driverData = driverUser.toJSON();
        } else {
          
          const oldDriver = await Driver.findByPk(driverUserId, {
            attributes: ['id', 'name', 'phone', 'vehicle'],
          }).catch(() => null);
          if (oldDriver) driverData = oldDriver.toJSON();
        }
      }

      result.push({
        ...pointData,
        DeliveryOrder: order
          ? {
              ...order.toJSON(),
              driverId: driverUserId || null,
              Driver:   driverData,
            }
          : null,
      });
    }

    
    const unique = result.filter((item, index, self) =>
      index === self.findIndex(t => t.id === item.id)
    )
    res.json(unique)
  } catch (e) {
    console.error('ERREUR my-orders:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Annuler une commande (seulement si pending) ──────────────────────────────
router.patch('/cancel/:pointId', auth, async (req, res, next) => {
  try {
    const point = await DeliveryPoint.findOne({
      where: { id: req.params.pointId, clientId: req.user.id },
    });
    if (!point)
      return res.status(404).json({ error: 'Commande introuvable' });
    if (point.status !== 'pending')
      return res.status(400).json({ error: "Impossible d'annuler une commande déjà en cours ou livrée" });

    await point.update({ status: 'failed', failureNote: 'Annulée par le client' });
    res.json({ message: 'Commande annulée avec succès' });
  } catch (e) {
    console.error('ERREUR cancel:', e.message);
    next(e);
  }
});

// ─── Noter le livreur (seulement après livraison) ────────────────────────────
router.post('/rate/:pointId', auth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Note entre 1 et 5 requise' });

    const point = await DeliveryPoint.findOne({
      where: { id: req.params.pointId, clientId: req.user.id },
    });
    if (!point)
      return res.status(404).json({ error: 'Commande introuvable' });
    if (point.status !== 'delivered')
      return res.status(400).json({ error: "Vous ne pouvez noter qu'une livraison effectuée" });
    if (point.rating)
      return res.status(400).json({ error: 'Vous avez déjà noté cette livraison' });

    await point.update({ rating, ratingComment: comment || null });
    res.json({ message: 'Merci pour votre évaluation !' });
  } catch (e) {
    console.error('ERREUR rate:', e.message);
    next(e);
  }
});

module.exports = router;
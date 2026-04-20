const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, DeliveryOrder, User } = require('../models');

// Client passe une commande — pas de livreur assigné d'avance
router.post('/order', auth, async (req, res, next) => {
  try {
    const { address, latitude, longitude, note, items, pickupAddress } = req.body;

    if (!address)       return res.status(400).json({ error: 'Adresse requise' });
    if (!items?.length) return res.status(400).json({ error: 'Ajoutez au moins un article' });

    const client  = await User.findByPk(req.user.id);
    const manager = await User.findOne({ where: { role: 'manager', status: 'active' } });

    // Trouver n'importe quel livreur actif pour créer la tournée
    const driver = await User.findOne({ where: { role: 'driver', status: 'active' } });
    if (!driver) return res.status(503).json({ error: 'Aucun livreur disponible.' });

    const today      = new Date().toISOString().split('T')[0];
    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // Créer une tournée OUVERTE (sans livreur assigné = disponible pour tous)
    const order = await DeliveryOrder.create({
      driverId:  driver.id, // temporaire, sera mis à jour à l'acceptation
      managerId: manager?.id || null,
      date:      today,
      status:    'planned',
      isOpen:    true,      // commande ouverte
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
      message: 'Commande créée ! En attente d\'un livreur.',
      orderId: order.id,
      pointId: point.id,
    });

  } catch (e) {
    console.error('ERREUR client/order:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Client voit ses commandes
router.get('/my-orders', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { clientId: req.user.id },
      include: [{
        model: DeliveryOrder,
        include: [{
          model: User,
          as: 'Driver',
          attributes: ['id', 'name', 'phone', 'vehicle'],
        }],
      }],
      order: [['createdAt', 'DESC']],
    });

    const result = points.map(p => {
      const plain = p.toJSON();
      if (typeof plain.items === 'string') {
        try { plain.items = JSON.parse(plain.items); } catch { plain.items = []; }
      }
      return plain;
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
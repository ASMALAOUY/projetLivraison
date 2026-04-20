const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, DeliveryOrder, User } = require('../models');

router.post('/order', auth, async (req, res, next) => {
  try {
    const { address, latitude, longitude, note, items, pickupAddress } = req.body;

    if (!address)       return res.status(400).json({ error: 'Adresse requise' });
    if (!items?.length) return res.status(400).json({ error: 'Ajoutez au moins un article' });

    const client  = await User.findByPk(req.user.id);
    const driver  = await User.findOne({ where: { role: 'driver', status: 'active' } });
    const manager = await User.findOne({ where: { role: 'manager', status: 'active' } });

    if (!driver) return res.status(503).json({
      error: 'Aucun livreur disponible.',
    });

    const today      = new Date().toISOString().split('T')[0];
    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // ── Chercher une tournée existante pour ce livreur aujourd'hui ──
    let order = await DeliveryOrder.findOne({
      where: {
        driverId: driver.id,
        date:     today,
        status:   'planned',
      },
    });

    // ── Sinon créer une nouvelle tournée ──
    if (!order) {
      order = await DeliveryOrder.create({
        driverId:  driver.id,
        managerId: manager?.id || null,
        date:      today,
        status:    'planned',
      });
      console.log('Nouvelle tournée créée:', order.id);
    } else {
      console.log('Tournée existante utilisée:', order.id);
    }

    // ── Compter les points existants pour la séquence ──
    const count = await DeliveryPoint.count({
      where: { orderId: order.id },
    });

    // ── Créer le point de livraison ──
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
      items:         items,
      totalPrice,
      pickupAddress: pickupAddress || 'Entrepôt central',
    });

    console.log('Point créé:', point.id, 'dans tournée:', order.id);

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
    console.error('ERREUR my-orders:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
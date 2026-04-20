const router  = require('express').Router();
const auth    = require('../middlewares/auth');
const { Op }  = require('sequelize');
const { User, DeliveryOrder, DeliveryPoint, TrackingLog } = require('../models');

// Liste de tous les livreurs
router.get('/', auth, async (req, res, next) => {
  try {
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: { exclude: ['password'] },
    });
    res.json(drivers.map(d => d.toJSON()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Commandes disponibles pour TOUS les livreurs (statut planned)
router.get('/available-orders', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: { status: 'planned' },
      include: [{
        model: DeliveryPoint,
        as: 'DeliveryPoints',
        required: true, // seulement les tournées avec des points
      }],
      order: [['createdAt', 'ASC']],
    });

    const result = orders.map(o => {
      const plain = o.toJSON();
      if (plain.DeliveryPoints) {
        plain.DeliveryPoints = plain.DeliveryPoints.map(p => {
          if (typeof p.items === 'string') {
            try { p.items = JSON.parse(p.items); } catch { p.items = []; }
          }
          return p;
        });
      }
      return plain;
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Livreur accepte une commande
router.post('/accept-order/:orderId', auth, async (req, res, next) => {
  try {
    const order = await DeliveryOrder.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Tournée introuvable' });

    if (order.status !== 'planned') {
      return res.status(400).json({ error: 'Cette commande a déjà été acceptée par un autre livreur' });
    }

    // Assigner ce livreur et démarrer
    await order.update({
      driverId:  req.user.id,
      status:    'in_progress',
      startedAt: new Date(),
    });

    // Mettre les points en "in_progress"
    await DeliveryPoint.update(
      { status: 'in_progress' },
      { where: { orderId: order.id, status: 'pending' } }
    );

    res.json({ message: 'Commande acceptée !', order: order.toJSON() });
  } catch (e) {
    console.error('ERREUR accept-order:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Mes commandes acceptées (en cours)
router.get('/me/orders', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: {
        driverId: req.user.id,
        status:   { [Op.in]: ['in_progress', 'done'] },
      },
      include: [{
        model: DeliveryPoint,
        as: 'DeliveryPoints',
        required: false,
      }],
      order: [['updatedAt', 'DESC']],
    });

    const result = orders.map(o => {
      const plain = o.toJSON();
      if (plain.DeliveryPoints) {
        plain.DeliveryPoints = plain.DeliveryPoints.map(p => {
          if (typeof p.items === 'string') {
            try { p.items = JSON.parse(p.items); } catch { p.items = []; }
          }
          return p;
        });
      }
      return plain;
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
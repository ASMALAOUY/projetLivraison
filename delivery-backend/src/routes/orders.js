const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryOrder, DeliveryPoint, User } = require('../models');
const { Op } = require('sequelize');


async function resolveDriver(plain) {
  // 1. driverId direct sur la tournée
  if (plain.driverId) {
    const driver = await User.findOne({
      where: { id: plain.driverId },
      attributes: ['id', 'name', 'phone', 'vehicle'],
    });
    if (driver) return driver.toJSON();
  }

  
  const point = await DeliveryPoint.findOne({
    where: {
      orderId:          plain.id,
      driverAcceptedId: { [Op.not]: null },
    },
  });

  if (point?.driverAcceptedId) {
    const driver = await User.findOne({
      where: { id: point.driverAcceptedId },
      attributes: ['id', 'name', 'phone', 'vehicle'],
    });
    if (driver) return driver.toJSON();
  }

  return null;
}

// ─── GET toutes les tournées ──────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const orders = await DeliveryOrder.findAll({
      include: [
        { model: User,          as: 'Manager',        attributes: ['id', 'name', 'email'], required: false },
        { model: DeliveryPoint, as: 'DeliveryPoints', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    const result = await Promise.all(orders.map(async (o) => {
      const plain = o.toJSON();

      if (plain.DeliveryPoints) {
        plain.DeliveryPoints = plain.DeliveryPoints.map(p => {
          if (typeof p.items === 'string') {
            try { p.items = JSON.parse(p.items); } catch { p.items = []; }
          }
          return p;
        });
      }

      //   cherche aussi dans driverAcceptedId si driverId est null
      plain.Driver = await resolveDriver(plain);

      return plain;
    }));

    res.json(result);
  } catch (error) {
    console.error('ERREUR GET /orders:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── POST créer une tournée ───────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { driverId, date } = req.body;
    if (!driverId) return res.status(400).json({ error: 'Livreur requis' });
    if (!date)     return res.status(400).json({ error: 'Date requise' });

    const driver = await User.findOne({ where: { id: driverId, role: 'driver' } });
    if (!driver) return res.status(404).json({ error: 'Livreur introuvable' });

    const order = await DeliveryOrder.create({
      driverId,
      managerId: req.user.id,
      date,
      status: 'planned',
    });

    const plain    = order.toJSON();
    plain.Driver   = { id: driver.id, name: driver.name, vehicle: driver.vehicle };
    plain.DeliveryPoints = [];

    res.status(201).json(plain);
  } catch (error) {
    console.error('ERREUR POST /orders:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET une tournée par ID ───────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await DeliveryOrder.findByPk(req.params.id, {
      include: [
        { model: User,          as: 'Manager',        attributes: ['id', 'name', 'email'], required: false },
        { model: DeliveryPoint, as: 'DeliveryPoints', required: false },
      ],
    });

    if (!order) return res.status(404).json({ error: 'Tournée non trouvée' });

    const plain = order.toJSON();

    if (plain.DeliveryPoints) {
      plain.DeliveryPoints = plain.DeliveryPoints.map(p => {
        if (typeof p.items === 'string') {
          try { p.items = JSON.parse(p.items); } catch { p.items = []; }
        }
        return p;
      });
    }

    //  Même correction ici
    plain.Driver = await resolveDriver(plain);

    res.json(plain);
  } catch (error) {
    console.error('ERREUR GET /orders/:id:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET tournées d'un livreur ────────────────────────────────────────────────
router.get('/driver/:driverId', auth, async (req, res) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: { driverId: req.params.driverId },
      include: [{ model: DeliveryPoint, as: 'DeliveryPoints', required: false }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    console.error('ERREUR GET /orders/driver/:driverId:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH statut d'une tournée ───────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['planned', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const order = await DeliveryOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Tournée non trouvée' });

    await order.update({ status });
    res.json({ message: 'Statut mis à jour', order });
  } catch (error) {
    console.error('ERREUR PATCH /orders/:id/status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
const router  = require('express').Router();
const auth    = require('../middlewares/auth');
const { Op }  = require('sequelize');
const { User, DeliveryOrder, DeliveryPoint, TrackingLog, Driver } = require('../models');
const bcrypt  = require('bcryptjs');

// ─── Liste de tous les livreurs ───────────────────────────────────────────────
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
// ─── Commandes disponibles (points pending) ───────────────────────────────────
router.get('/available-orders', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'ASC']],
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
    console.error('ERREUR available-orders:', e.message);
    res.status(500).json({ error: e.message });
  }
});

   

 router.post('/accept-point/:pointId', auth, async (req, res, next) => {
  try {
    const point = await DeliveryPoint.findByPk(req.params.pointId)
    if (!point) return res.status(404).json({ error: 'Commande introuvable' })
    if (point.status !== 'pending')
      return res.status(400).json({ error: 'Cette commande a déjà été acceptée' })

    const order = await DeliveryOrder.findByPk(point.orderId)
    if (!order) return res.status(404).json({ error: 'Tournée introuvable' })

    // ✅ Stocker le driverId dans le point lui-même
    await point.update({
      status: 'in_progress',
      driverAcceptedId: req.user.id,   // ← sauvegarde qui a accepté
    })

    await order.update({ status: 'in_progress' })

    res.json({ message: 'Commande acceptée !', pointId: point.id, orderId: order.id })
  } catch (e) {
    console.error('ERREUR accept-point:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ─── Mes commandes (livreur connecté) ─────────────────────────────────────────
router.get('/me/orders', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: {
        driverAcceptedId: req.user.id,
        status: { [Op.in]: ['in_progress', 'delivered', 'failed'] },
      },
      order: [['updatedAt', 'DESC']],
    })

    const result = points.map(p => {
      const plain = p.toJSON()
      if (typeof plain.items === 'string') {
        try { plain.items = JSON.parse(plain.items) } catch { plain.items = [] }
      }
      return plain
    })

    // Retourner dans le format attendu par le mobile : tableau de "tournées"
    // avec DeliveryPoints imbriqués — on simule une tournée par point
    const formatted = result.map(p => ({
      id:     p.orderId,
      date:   p.createdAt,
      status: p.status,
      DeliveryPoints: [p],
    }))

    res.json(formatted)
  } catch (e) {
    console.error('ERREUR me/orders:', e.message)
    res.status(500).json({ error: e.message })
  }
})

// ─── POST ajouter un livreur (gestionnaire uniquement) ────────────────────────
router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'manager')
      return res.status(403).json({ error: 'Accès refusé' });

    const { name, phone, vehicle, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ error: 'Nom, téléphone et mot de passe requis' });

    const existing = await User.findOne({ where: { phone } });
    if (existing)
      return res.status(409).json({ error: 'Ce numéro de téléphone est déjà utilisé' });

    const hash   = await bcrypt.hash(password, 10);
    const driver = await User.create({
      name, phone, vehicle,
      password: hash,
      role:   'driver',
      status: 'active',
    });

    const { password: _, ...safe } = driver.toJSON();
    res.status(201).json(safe);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Téléphone déjà utilisé' });
    res.status(500).json({ error: e.message });
  }
});

// ─── PATCH activer / désactiver un livreur ────────────────────────────────────
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'manager')
      return res.status(403).json({ error: 'Accès refusé' });

    const driver = await User.findByPk(req.params.id);
    if (!driver || driver.role !== 'driver')
      return res.status(404).json({ error: 'Livreur introuvable' });

    const newStatus = driver.status === 'active' ? 'inactive' : 'active';
    await driver.update({ status: newStatus });

    const { password: _, ...safe } = driver.toJSON();
    res.json(safe);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE supprimer un livreur ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'manager')
      return res.status(403).json({ error: 'Accès refusé' });

    const driver = await User.findByPk(req.params.id);
    if (!driver || driver.role !== 'driver')
      return res.status(404).json({ error: 'Livreur introuvable' });

    const activeOrders = await DeliveryOrder.count({
      where: { driverId: req.params.id, status: 'in_progress' },
    });
    if (activeOrders > 0)
      return res.status(400).json({
        error: 'Impossible de supprimer : ce livreur a des tournées en cours',
      });

    await driver.destroy();
    res.json({ message: 'Livreur supprimé avec succès' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
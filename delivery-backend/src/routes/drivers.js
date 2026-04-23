const router  = require('express').Router();
const auth    = require('../middlewares/auth');
const { Op }  = require('sequelize');
const { User, DeliveryOrder, DeliveryPoint, TrackingLog } = require('../models');
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

// ─── Commandes disponibles (points pending uniquement) ────────────────────────
router.get('/available-orders', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: { status: 'planned' },
      include: [{
        model: DeliveryPoint,
        as: 'DeliveryPoints',
        required: true,
        where: { status: 'pending' }, // ✅ seulement les points non acceptés
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

// ─── Accepter un point individuel ────────────────────────────────────────────
router.post('/accept-point/:pointId', auth, async (req, res, next) => {
  try {
    const point = await DeliveryPoint.findByPk(req.params.pointId, {
      include: [{ model: DeliveryOrder }]
    });

    if (!point) return res.status(404).json({ error: 'Commande introuvable' });

    if (point.status !== 'pending') {
      return res.status(400).json({ error: 'Cette commande a déjà été acceptée' });
    }

    // ✅ Mettre à jour le point
    await point.update({ status: 'in_progress' });

    // ✅ Assigner le livreur ET passer la tournée en in_progress
    const order = point.DeliveryOrder;
    await order.update({
      driverId: req.user.id,
      status: 'in_progress', // ← était manquant, c'est pour ça que /me/orders ne trouvait rien
    });

    res.json({ message: 'Commande acceptée !', point });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Mes commandes (livreur connecté) ─────────────────────────────────────────
// ✅ Route unique — suppression du doublon qui causait un conflit
router.get('/me/orders', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: {
        driverId: req.user.id,
        status: { [Op.in]: ['planned', 'in_progress', 'done'] }, // ✅ 'planned' inclus au cas où
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
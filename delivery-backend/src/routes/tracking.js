const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { TrackingLog, User } = require('../models');  // ← User, PAS Driver
const { Op } = require('sequelize');

// ── POST : livreur envoie sa position GPS ─────────────────────────────────────
router.post('/gps', auth, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return res.status(400).json({ error: 'latitude et longitude requis' });

    // ← Les livreurs sont dans 'users' (role=driver)
    const driver = await User.findOne({ where: { id: req.user.id, role: 'driver' } });
    if (!driver) return res.status(404).json({ error: 'Livreur non trouvé' });

    const log = await TrackingLog.create({
      driverId:  driver.id,
      eventType: 'gps',
      latitude:  parseFloat(latitude),
      longitude: parseFloat(longitude),
    });
    res.status(201).json(log.toJSON());
  } catch (e) {
    console.error('ERREUR GPS:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET : dernière position de TOUS les livreurs actifs ───────────────────────
router.get('/live', auth, async (req, res, next) => {
  try {
    // ← PAS d'include Driver — on cherche dans User séparément
    const logs = await TrackingLog.findAll({
      where: {
        eventType: 'gps',
        latitude:  { [Op.ne]: null },
        createdAt: { [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      order: [['createdAt', 'DESC']],
    });

    const seen = new Map();
    for (const log of logs) {
      if (!seen.has(log.driverId)) {
        const driverUser = await User.findOne({
          where: { id: log.driverId, role: 'driver' },
          attributes: ['id', 'name', 'vehicle', 'phone'],
        });
        seen.set(log.driverId, {
          driverId:   log.driverId,
          driverName: driverUser?.name    || 'Livreur',
          vehicle:    driverUser?.vehicle || 'Moto',
          phone:      driverUser?.phone   || null,
          latitude:   log.latitude,
          longitude:  log.longitude,
          updatedAt:  log.createdAt,
        });
      }
    }
    res.json([...seen.values()]);
  } catch (e) {
    console.error('ERREUR /tracking/live:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET : dernière position d'UN seul livreur ─────────────────────────────────
router.get('/position/:driverId', auth, async (req, res, next) => {
  try {
    const last = await TrackingLog.findOne({
      where: {
        driverId:  req.params.driverId,
        eventType: 'gps',
        latitude:  { [Op.ne]: null },
      },
      order: [['createdAt', 'DESC']],
    });
    res.json(last ? last.toJSON() : null);
  } catch (e) {
    console.error('ERREUR /tracking/position:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET : historique GPS d'un livreur ─────────────────────────────────────────
router.get('/history/:driverId', auth, async (req, res, next) => {
  try {
    const logs = await TrackingLog.findAll({
      where: { driverId: req.params.driverId, eventType: 'gps' },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(logs.map(l => l.toJSON()));
  } catch (e) {
    console.error('ERREUR /tracking/history:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { TrackingLog, User } = require('../models');
const { Op } = require('sequelize');

// ── POST : livreur envoie sa position GPS ─────────────────────────────────────
router.post('/gps', auth, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude)
      return res.status(400).json({ error: 'latitude et longitude requis' });

    const log = await TrackingLog.create({
      driverId:  req.user.id,
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
    const logs = await TrackingLog.findAll({
      where: {
        eventType: 'gps',
        latitude:  { [Op.ne]: null },
        createdAt: { [Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      },
      include: [{
        model: User,
        as: 'TrackingDriver', // ✅ correspond à l'alias dans models/index.js
        attributes: ['id', 'name', 'vehicle', 'phone'],
        required: true,
      }],
      order: [['createdAt', 'DESC']],
    });

    // Dédupliquer : garder seulement la dernière position par livreur
    const seen = new Map();
    for (const log of logs) {
      if (!seen.has(log.driverId)) {
        seen.set(log.driverId, {
          driverId:   log.driverId,
          driverName: log.TrackingDriver?.name || 'Livreur',
          vehicle:    log.TrackingDriver?.vehicle || 'Moto',
          phone:      log.TrackingDriver?.phone,
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
    res.status(500).json({ error: e.message });
  }
});

// ── GET : historique GPS d'un livreur ─────────────────────────────────────────
router.get('/history/:driverId', auth, async (req, res, next) => {
  try {
    const logs = await TrackingLog.findAll({
      where: {
        driverId:  req.params.driverId,
        eventType: 'gps',
      },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(logs.map(l => l.toJSON()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
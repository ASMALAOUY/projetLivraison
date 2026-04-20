const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { TrackingLog, User } = require('../models');
const { Op } = require('sequelize');

// Livreur envoie sa position GPS
router.post('/gps', auth, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const log = await TrackingLog.create({
      driverId:  req.user.id,
      eventType: 'gps',
      latitude,
      longitude,
    });
    res.status(201).json(log.toJSON());
  } catch (e) {
    console.error('ERREUR GPS:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Dernière position d'un livreur
router.get('/position/:driverId', async (req, res, next) => {
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

// Historique GPS d'un livreur
router.get('/history/:driverId', auth, async (req, res, next) => {
  try {
    const logs = await TrackingLog.findAll({
      where: {
        driverId:  req.params.driverId,
        eventType: 'gps',
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(logs.map(l => l.toJSON()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
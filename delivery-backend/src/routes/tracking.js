const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { TrackingLog } = require('../models');

router.post('/gps', auth, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const log = await TrackingLog.create({
      driverId:  req.user.id,
      eventType: 'gps',
      latitude,
      longitude,
    });
    res.status(201).json(log);
  } catch (e) { next(e); }
});

router.get('/history/:driverId', auth, async (req, res, next) => {
  try {
    const logs = await TrackingLog.findAll({
      where: { driverId: req.params.driverId },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(logs);
  } catch (e) { next(e); }
});

module.exports = router;
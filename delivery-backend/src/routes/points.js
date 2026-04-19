const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, TrackingLog } = require('../models');

router.get('/order/:orderId', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { orderId: req.params.orderId },
      order: [['sequence', 'ASC']],
    });
    res.json(points);
  } catch (e) { next(e); }
});

router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status, failureNote } = req.body;
    const point = await DeliveryPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ error: 'Point introuvable' });
    if (point.status === 'delivered')
      return res.status(400).json({ error: 'Point déjà clôturé' });

    await point.update({
      status,
      failureNote: status === 'failed' ? failureNote : null,
    });

    await TrackingLog.create({
      driverId:  req.user.id,
      pointId:   req.params.id,
      eventType: 'status_change',
      newStatus: status,
    });

    res.json(point);
  } catch (e) { next(e); }
});

module.exports = router;
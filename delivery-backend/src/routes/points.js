const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, TrackingLog } = require('../models');

router.get('/order/:orderId', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { orderId: req.params.orderId },
      order: [['sequence', 'ASC']],
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
    console.error('ERREUR points/order:', e.message);
    res.status(500).json({ error: e.message });
  }
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
      failureNote: status === 'failed' ? (failureNote || null) : null,
    });

    await TrackingLog.create({
      driverId:  req.user.id,
      pointId:   req.params.id,
      eventType: 'status_change',
      newStatus: status,
    });

    res.json(point.toJSON());
  } catch (e) {
    console.error('ERREUR patch status:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { orderId, address, latitude, longitude, sequence, clientName, clientId } = req.body;
    const point = await DeliveryPoint.create({
      orderId, address,
      latitude:  latitude  || 31.6295,
      longitude: longitude || -7.9811,
      sequence, clientName, clientId,
      status: 'pending',
    });
    res.status(201).json(point.toJSON());
  } catch (e) {
    console.error('ERREUR POST point:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
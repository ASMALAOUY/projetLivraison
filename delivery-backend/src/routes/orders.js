// src/routes/orders.js
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryOrder, DeliveryPoint, User } = require('../models');

router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      include: [
        { model: User, as: 'Driver', attributes: ['id', 'name', 'phone', 'vehicle'], required: false },
        { model: DeliveryPoint, as: 'DeliveryPoints', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders.map(o => o.toJSON()));
  } catch (e) {
    console.error('ERREUR GET /orders:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { driverId, date } = req.body;
    if (!driverId || !date)
      return res.status(400).json({ error: 'driverId et date requis' });
    const order = await DeliveryOrder.create({
      driverId,
      managerId: req.user.id,
      date,
      status: 'planned',
    });
    res.status(201).json(order.toJSON());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryOrder, Driver, DeliveryPoint } = require('../models');

router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      include: [
        { model: Driver, attributes: ['id', 'name'] },
        { model: DeliveryPoint },
      ],
      order: [['date', 'DESC']],
    });
    res.json(orders);
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { driverId, date } = req.body;
    const order = await DeliveryOrder.create({ driverId, date });
    res.status(201).json(order);
  } catch (e) { next(e); }
});

module.exports = router;
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { User, DeliveryOrder, DeliveryPoint } = require('../models');

router.get('/', auth, async (req, res, next) => {
  try {
    const drivers = await User.findAll({
      where: { role: 'driver' },
      attributes: { exclude: ['password'] },
    });
    res.json(drivers.map(d => d.toJSON()));
  } catch (e) {
    console.error('ERREUR drivers:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/me/orders', auth, async (req, res, next) => {
  try {
    console.log('=== me/orders pour driver:', req.user.id);

    // Sans filtre de date — toutes les commandes du livreur
    const orders = await DeliveryOrder.findAll({
      where: {
        driverId: req.user.id,
      },
      include: [{
        model: DeliveryPoint,
        as: 'DeliveryPoints',
        required: false,
      }],
      order: [['date', 'DESC']],
    });

    console.log('Commandes trouvées pour ce livreur:', orders.length);
    res.json(orders.map(o => o.toJSON()));

  } catch (e) {
    console.error('ERREUR me/orders:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { DeliveryPoint, DeliveryOrder, User } = require('../models');

router.post('/order', auth, async (req, res, next) => {
  try {
    const { address, latitude, longitude, note, items, pickupAddress } = req.body;

    if (!address)          return res.status(400).json({ error: 'Adresse de livraison requise' });
    if (!items?.length)    return res.status(400).json({ error: 'Ajoutez au moins un article' });

  const driver = await User.findOne({ where: { role: 'driver', status: 'active' } });
console.log('📦 Driver trouvé:', driver ? driver.id : 'NON');

const manager = await User.findOne({ where: { role: 'manager', status: 'active' } });
console.log('📋 Manager trouvé:', manager ? manager.id : 'NON');

const client = await User.findByPk(req.user.id);
console.log('👤 Client trouvé:', client ? client.id : 'NON');
    if (!driver) return res.status(503).json({ error: 'Aucun livreur disponible. Réessayez plus tard.' });

    const today = new Date().toISOString().split('T')[0];
    const totalPrice = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const order = await DeliveryOrder.create({
      driverId:  driver.id,
      managerId: manager?.id || null,
      date:      today,
      status:    'planned',
    });

    const count = await DeliveryPoint.count({ where: { orderId: order.id } });

    const point = await DeliveryPoint.create({
      orderId:       order.id,
      clientId:      client.id,
      address,
      latitude:      latitude  || 31.6295,
      longitude:     longitude || -7.9811,
      sequence:      count + 1,
      status:        'pending',
      clientName:    client.name,
      failureNote:   note || null,
      items,
      totalPrice,
      pickupAddress: pickupAddress || 'Entrepôt central',
    });

    res.status(201).json({ message: 'Commande créée !', order, point });
  } catch (e) { next(e); }
});

router.get('/my-orders', auth, async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { clientId: req.user.id },
      include: [{
        model: DeliveryOrder,
        include: [{ model: User, as: 'Driver', attributes: ['id','name','phone','vehicle'] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(points);
  } catch (e) { next(e); }
});
router.get('/tracking/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Trouver le point de livraison actif du client (non livré, non échoué)
    const activePoint = await DeliveryPoint.findOne({
      where: { 
        clientId: userId,
        status: ['pending', 'in_progress']  // seulement les commandes actives
      },
      include: [{
        model: DeliveryOrder,
        include: [{
          model: User,
          as: 'Driver',
          attributes: ['id', 'name', 'phone', 'vehicle']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
     if (!activePoint) {
      return res.json([]);
    }
    
    res.json([activePoint]);
  } catch (e) { 
    next(e); 
  }
});

module.exports = router;
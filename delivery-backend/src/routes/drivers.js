const router = require('express').Router();
const auth = require('../middlewares/auth');
const { DeliveryOrder, User, DeliveryPoint } = require('../models');

// GET - Récupérer toutes les commandes (pour le manager)
router.get('/', auth, async (req, res, next) => {
  try {
    const orders = await DeliveryOrder.findAll({
      include: [
        { 
          model: User, 
          as: 'Driver', 
          attributes: ['id', 'name', 'phone', 'vehicle'] 
        },
        { 
          model: DeliveryPoint 
        }
      ],
      order: [['date', 'DESC']],
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// GET - Récupérer une commande par ID
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await DeliveryOrder.findByPk(req.params.id, {
      include: [
        { model: User, as: 'Driver', attributes: ['id', 'name', 'phone'] },
        { model: DeliveryPoint }
      ]
    });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST - Créer une nouvelle commande (manager)
router.post('/', auth, async (req, res, next) => {
  try {
    const { driverId, date, points } = req.body;
    
    if (!driverId || !date) {
      return res.status(400).json({ error: 'driverId et date requis' });
    }
    
    const order = await DeliveryOrder.create({
      driverId,
      managerId: req.user.id,
      date,
      status: 'planned',
    });
    
    // Si des points de livraison sont fournis, les créer
    if (points && points.length > 0) {
      for (let i = 0; i < points.length; i++) {
        await DeliveryPoint.create({
          orderId: order.id,
          address: points[i].address,
          latitude: points[i].latitude,
          longitude: points[i].longitude,
          sequence: i + 1,
          status: 'pending',
          clientName: points[i].clientName,
        });
      }
    }
    
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// PATCH - Mettre à jour le statut d'une commande
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await DeliveryOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    await order.update({ status });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// DELETE - Supprimer une commande
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const order = await DeliveryOrder.findByPk(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    // Supprimer d'abord les points de livraison associés
    await DeliveryPoint.destroy({ where: { orderId: req.params.id } });
    
    // Puis supprimer la commande
    await order.destroy();
    
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
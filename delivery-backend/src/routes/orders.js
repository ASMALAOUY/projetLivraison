const router = require('express').Router();
const auth = require('../middlewares/auth');
const { DeliveryOrder, DeliveryPoint, User, Driver } = require('../models');
const { Op } = require('sequelize');

// Récupérer toutes les commandes (pour admin/manager)
router.get('/', auth, async (req, res) => {
  try {
    const orders = await DeliveryOrder.findAll({
      include: [
        {
          model: User,
          as: 'Manager',  // ✅ Alias correct pour le manager
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: DeliveryPoint,
          as: 'DeliveryPoints',  // ✅ Alias correct (pluriel, D et P majuscules)
          required: false,
          order: [['sequence', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('ERREUR GET /orders:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une commande spécifique
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await DeliveryOrder.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'Manager',  // ✅ Alias correct
          attributes: ['id', 'name', 'email'],
          required: false
        },
        {
          model: DeliveryPoint,
          as: 'DeliveryPoints',  // ✅ Alias correct
          required: false,
          order: [['sequence', 'ASC']]
        },
        {
          model: Driver,
          as: 'Driver',  // ✅ Alias pour le livreur (si vous voulez l'inclure)
          attributes: ['id', 'name', 'phone', 'vehicle'],
          required: false
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    // Formater les items des points de livraison
    const formattedOrder = order.toJSON();
    if (formattedOrder.DeliveryPoints) {
      formattedOrder.DeliveryPoints = formattedOrder.DeliveryPoints.map(point => {
        if (typeof point.items === 'string') {
          try {
            point.items = JSON.parse(point.items);
          } catch {
            point.items = [];
          }
        }
        return point;
      });
    }
    
    res.json(formattedOrder);
  } catch (error) {
    console.error('ERREUR GET /orders/:id:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les commandes d'un livreur spécifique
router.get('/driver/:driverId', auth, async (req, res) => {
  try {
    const orders = await DeliveryOrder.findAll({
      where: { driverId: req.params.driverId },
      include: [
        {
          model: DeliveryPoint,
          as: 'DeliveryPoints',
          required: false,
          order: [['sequence', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('ERREUR GET /orders/driver/:driverId:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour le statut d'une commande
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['planned', 'in_progress', 'done'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    
    const order = await DeliveryOrder.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    await order.update({ status });
    res.json({ message: 'Statut mis à jour', order });
  } catch (error) {
    console.error('ERREUR PATCH /orders/:id/status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
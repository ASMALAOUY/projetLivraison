const router = require('express').Router()
const { DeliveryPoint, User } = require('../models')
const { Op } = require('sequelize')

router.get('/', async (req, res) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: {
        status:        'delivered',
        rating:        { [Op.not]: null },
        ratingComment: { [Op.not]: null, [Op.ne]: '' },
      },
      order: [['updatedAt', 'DESC']],
      limit: 50,
    })

    const reviews = points.map(p => ({
      id:         p.id,
      rating:     p.rating,
      comment:    p.ratingComment,
      clientName: p.clientName || 'Client anonyme',
      city:       'Marrakech',
      date:       p.updatedAt,
    }))

    res.json(reviews)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { status: 'delivered', rating: { [Op.not]: null } },
      attributes: ['rating'],
    })

    const total = points.length
    if (total === 0) return res.json({ average: 0, total: 0, distribution: { 1:0, 2:0, 3:0, 4:0, 5:0 } })

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let sum = 0
    points.forEach(p => { distribution[p.rating]++; sum += p.rating })

    res.json({
      average:      Math.round((sum / total) * 10) / 10,
      total,
      distribution,
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
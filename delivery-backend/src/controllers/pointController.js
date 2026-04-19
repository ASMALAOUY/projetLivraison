const { DeliveryPoint, TrackingLog } = require('../models');

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, failureNote } = req.body;

    const point = await DeliveryPoint.findByPk(id);
    if (!point) return res.status(404).json({ error: 'Point introuvable' });

    // Règle métier : livré = clôturé
    if (point.status === 'delivered')
      return res.status(400).json({ error: 'Ce point est déjà clôturé' });

    await point.update({ status, failureNote: status === 'failed' ? failureNote : null });

    // Journalisation obligatoire
    await TrackingLog.create({
      driverId:  req.user.id,
      pointId:   id,
      eventType: 'status_change',
      newStatus: status,
    });

    res.json(point);
  } catch (e) { next(e); }
};

exports.getByOrder = async (req, res, next) => {
  try {
    const points = await DeliveryPoint.findAll({
      where: { orderId: req.params.orderId },
      order: [['sequence', 'ASC']],
    });
    res.json(points);
  } catch (e) { next(e); }
};
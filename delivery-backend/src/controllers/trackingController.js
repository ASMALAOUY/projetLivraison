const { TrackingLog } = require('../models');

exports.sendGPS = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const log = await TrackingLog.create({
      driverId:  req.user.id,
      eventType: 'gps',
      latitude,
      longitude,
    });
    res.status(201).json(log);
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const logs = await TrackingLog.findAll({
      where:  { driverId: req.params.driverId },
      order:  [['createdAt', 'DESC']],
    });
    res.json(logs);
  } catch (e) { next(e); }
};
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { Driver, DeliveryOrder } = require('../models');

exports.register = async (req, res, next) => {
  try {
    const { name, phone, vehicle, password } = req.body;
    const hash   = await bcrypt.hash(password, 10);
    const driver = await Driver.create({ name, phone, vehicle, password: hash });
    res.status(201).json(driver);
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const driver = await Driver.findOne({ where: { phone } });
    if (!driver || !(await bcrypt.compare(password, driver.password)))
      return res.status(401).json({ error: 'Identifiants invalides' });
    const token = jwt.sign({ id: driver.id, role: 'driver' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, driver });
  } catch (e) { next(e); }
};

exports.getTodayOrders = async (req, res, next) => {
  try {
    const today  = new Date().toISOString().split('T')[0];
    const orders = await DeliveryOrder.findAll({
      where: { driverId: req.user.id, date: today },
      include: ['DeliveryPoints'],
      order:   [[{ model: DeliveryPoint }, 'sequence', 'ASC']],
    });
    res.json(orders);
  } catch (e) { next(e); }
};
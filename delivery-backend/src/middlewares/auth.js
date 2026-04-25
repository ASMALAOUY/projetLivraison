const jwt = require('jsonwebtoken');
const { User, Driver } = require('../models');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token manquant' });
  
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Chercher d'abord dans User (client/manager)
    let user = await User.findByPk(decoded.id);
    
    if (user) {
      req.user = user;
      req.user.role = user.role;
    } else {
      // Sinon chercher dans Driver (livreur)
      const driver = await Driver.findByPk(decoded.id);
      if (driver) {
        req.user = driver;
        req.user.role = 'driver';
      }
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Token invalide' });
  }
};
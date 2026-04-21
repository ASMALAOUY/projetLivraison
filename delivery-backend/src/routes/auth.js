const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');

const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

// ── REGISTER ─────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, role, vehicle } = req.body;

    // ── Bloquer l'inscription publique des gestionnaires ──
    if (role === 'manager') {
      return res.status(403).json({
        error: 'Les comptes gestionnaire sont créés par l\'administrateur uniquement.',
      });
    }

    if (!['driver', 'client'].includes(role))
      return res.status(400).json({ error: 'Rôle invalide' });

    if (!name || !password || !role)
      return res.status(400).json({ error: 'Champs obligatoires manquants' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hash, role, vehicle });
    const token = sign({ id: user.id, role: user.role });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email,
              phone: user.phone, role: user.role, vehicle: user.vehicle },
    });
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Email ou téléphone déjà utilisé' });
    next(e);
  }
});

// ── LOGIN ─────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, phone, password, role } = req.body;

    if (!password) return res.status(400).json({ error: 'Mot de passe requis' });

    const where = {};
    if (email) where.email = email;
    else if (phone) where.phone = phone;
    else return res.status(400).json({ error: 'Email ou téléphone requis' });

    if (role) where.role = role;

    const user = await User.findOne({ where });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Identifiants invalides' });

    if (user.status === 'inactive')
      return res.status(403).json({ error: 'Compte désactivé' });

    const token = sign({ id: user.id, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email,
              phone: user.phone, role: user.role, vehicle: user.vehicle },
    });
  } catch (e) { next(e); }
});

// ── ME (profil connecté) ──────────────────────────────
router.get('/me', require('../middlewares/auth'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (e) { next(e); }
});

module.exports = router;
module.exports = (err, req, res, next) => {
  console.error('Erreur :', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
};
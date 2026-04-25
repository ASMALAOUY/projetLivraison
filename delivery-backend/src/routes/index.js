const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/drivers', require('./drivers'));
 router.use('/orders', require('./orders'));      // ← COMMENTEZ cette ligne
 router.use('/points', require('./points'));      // ← COMMENTEZ cette ligne
router.use('/tracking', require('./tracking'));
router.use('/client', require('./clientOrders'));
router.use('/reviews', require('./reviews'));

module.exports = router;
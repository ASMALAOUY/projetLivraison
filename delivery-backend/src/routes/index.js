const router = require('express').Router();

router.use('/auth',     require('./auth'));
router.use('/drivers',  require('./drivers'));
router.use('/orders',   require('./orders'));
router.use('/points',   require('./points'));
router.use('/tracking', require('./tracking'));
router.use('/client',   require('./clientOrders'));

module.exports = router;
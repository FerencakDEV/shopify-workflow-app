const express = require('express');
const router = express.Router();
const { orderCreated, orderUpdated } = require('../controllers/webhookController');

router.post('/order-created', orderCreated);
router.post('/order-updated', orderUpdated);

module.exports = router;

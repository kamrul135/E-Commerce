const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.post('/', [
  body('shipping_address').trim().notEmpty().withMessage('Shipping address is required'),
  body('shipping_city').trim().notEmpty().withMessage('City is required'),
  body('shipping_postal_code').trim().notEmpty().withMessage('Postal code is required'),
  body('shipping_country').trim().notEmpty().withMessage('Country is required'),
], validate, orderController.createOrder);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.put('/:id/status', authorizeAdmin, orderController.updateStatus);

module.exports = router;

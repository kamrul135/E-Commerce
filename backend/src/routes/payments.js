const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

// Process a payment
router.post(
  '/process',
  [
    body('order_id').notEmpty().withMessage('Order ID is required'),
    body('payment_method')
      .isIn(['credit_card', 'debit_card', 'paypal', 'cod'])
      .withMessage('Invalid payment method'),
  ],
  validate,
  paymentController.processPayment
);

// Get payment history
router.get('/', paymentController.getPayments);

// Get payment for a specific order
router.get('/order/:orderId', paymentController.getPaymentByOrder);

// Refund a payment (admin only)
router.post('/:id/refund', authorizeAdmin, paymentController.refundPayment);

module.exports = router;

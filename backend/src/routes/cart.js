const express = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/', [body('product_id').isUUID().withMessage('Valid product ID is required')], validate, cartController.addItem);
router.put('/:id', [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')], validate, cartController.updateQuantity);
router.delete('/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;

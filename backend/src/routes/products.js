const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.get('/', productController.getAll);
router.get('/:id', productController.getById);

router.post('/', authenticate, authorizeAdmin, [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
], validate, productController.create);

router.put('/:id', authenticate, authorizeAdmin, productController.update);
router.delete('/:id', authenticate, authorizeAdmin, productController.delete);

module.exports = router;

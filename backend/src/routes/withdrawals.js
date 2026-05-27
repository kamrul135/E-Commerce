const express = require('express');
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, withdrawalController.getAll);
router.post('/', authenticate, withdrawalController.create);
router.put('/:id/status', authenticate, withdrawalController.updateStatus);

module.exports = router;
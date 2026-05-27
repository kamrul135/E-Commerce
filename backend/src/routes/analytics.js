const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, analyticsController.getDashboardStats);

module.exports = router;
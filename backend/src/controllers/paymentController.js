const Payment = require('../models/Payment');
const Order = require('../models/Order');

const paymentController = {
  /**
   * Process a payment for an existing order.
   * POST /api/payments/process
   */
  async processPayment(req, res) {
    try {
      const { order_id, payment_method, card_details } = req.body;

      // Verify order exists and belongs to user
      const order = await Order.findById(order_id, req.user.role === 'admin' ? null : req.user.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      if (order.payment_status === 'paid') {
        return res.status(400).json({ error: 'Order is already paid.' });
      }

      const result = await Payment.processPayment({
        userId: req.user.id,
        orderId: order_id,
        amount: parseFloat(order.total),
        paymentMethod: payment_method,
        cardDetails: card_details,
      });

      if (result.success) {
        // Update order payment status
        await Order.updatePaymentStatus(order_id, 'paid', result.transaction_id);
        // Move order from pending to processing
        if (order.status === 'pending') {
          await Order.updateStatus(order_id, 'processing');
        }
      } else if (result.status === 'pending') {
        // COD — mark as pending payment
        await Order.updatePaymentStatus(order_id, 'pending', result.transaction_id);
      } else {
        // Payment failed
        await Order.updatePaymentStatus(order_id, 'failed', result.transaction_id);
      }

      if (!result.success && result.status !== 'pending') {
        return res.status(400).json({
          error: result.error || 'Payment failed.',
          transaction_id: result.transaction_id,
        });
      }

      res.json({
        message: result.status === 'pending'
          ? 'Order placed. Payment will be collected on delivery.'
          : 'Payment processed successfully!',
        payment: result.payment,
        transaction_id: result.transaction_id,
        status: result.status,
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({ error: 'Payment processing failed. Please try again.' });
    }
  },

  /**
   * Get payment details for an order.
   * GET /api/payments/order/:orderId
   */
  async getPaymentByOrder(req, res) {
    try {
      const payment = await Payment.findByOrderId(req.params.orderId);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found for this order.' });
      }

      // Only allow owner or admin
      if (req.user.role !== 'admin' && payment.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      res.json({ payment });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({ error: 'Failed to fetch payment details.' });
    }
  },

  /**
   * Get user's payment history.
   * GET /api/payments
   */
  async getPayments(req, res) {
    try {
      const { page, limit } = req.query;
      const result = await Payment.findByUserId(req.user.id, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      });
      res.json(result);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Failed to fetch payments.' });
    }
  },

  /**
   * Refund a payment (admin only).
   * POST /api/payments/:id/refund
   */
  async refundPayment(req, res) {
    try {
      const payment = await Payment.findByTransactionId(req.params.id);
      if (!payment) {
        // Try by payment ID instead
        const byId = await Payment.updateStatus(req.params.id, 'refunded');
        if (!byId) return res.status(404).json({ error: 'Payment not found.' });
        await Order.updatePaymentStatus(byId.order_id, 'refunded', byId.transaction_id);
        await Order.updateStatus(byId.order_id, 'cancelled');
        return res.json({ message: 'Payment refunded.', payment: byId });
      }

      const updated = await Payment.updateStatus(payment.id, 'refunded');
      await Order.updatePaymentStatus(payment.order_id, 'refunded', payment.transaction_id);
      await Order.updateStatus(payment.order_id, 'cancelled');

      res.json({ message: 'Payment refunded successfully.', payment: updated });
    } catch (error) {
      console.error('Refund payment error:', error);
      res.status(500).json({ error: 'Failed to process refund.' });
    }
  },
};

module.exports = paymentController;

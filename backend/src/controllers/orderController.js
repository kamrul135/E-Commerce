const Order = require('../models/Order');
const Cart = require('../models/Cart');

const orderController = {
  async createOrder(req, res) {
    try {
      const { shipping_address, shipping_city, shipping_postal_code, shipping_country, payment_method, card_details } = req.body;
      const cartItems = await Cart.getByUserId(req.user.id);
      if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty.' });

      const total = await Cart.getCartTotal(req.user.id);
      const order = await Order.create(req.user.id, {
        shipping_address, shipping_city, shipping_postal_code, shipping_country, payment_method, items: cartItems, total,
      });

      // Process payment immediately
      const Payment = require('../models/Payment');
      const paymentResult = await Payment.processPayment({
        userId: req.user.id,
        orderId: order.id,
        amount: total,
        paymentMethod: payment_method || 'credit_card',
        cardDetails: card_details,
      });

      if (paymentResult.success) {
        await Order.updatePaymentStatus(order.id, 'paid', paymentResult.transaction_id);
        await Order.updateStatus(order.id, 'processing');
      } else if (paymentResult.status === 'pending') {
        // COD
        await Order.updatePaymentStatus(order.id, 'pending', paymentResult.transaction_id);
      } else {
        // Payment failed — still create order but mark as failed
        await Order.updatePaymentStatus(order.id, 'failed', paymentResult.transaction_id);
        return res.status(400).json({
          error: paymentResult.error || 'Payment failed.',
          order_id: order.id,
          transaction_id: paymentResult.transaction_id,
        });
      }

      const fullOrder = await Order.findById(order.id);
      res.status(201).json({
        message: paymentResult.status === 'pending'
          ? 'Order placed! Payment will be collected on delivery.'
          : 'Order placed and payment processed successfully!',
        order: fullOrder,
        payment: paymentResult.payment,
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: error.message || 'Failed to create order.' });
    }
  },

  async getOrders(req, res) {
    try {
      const { page, limit } = req.query;
      let result;
      if (req.user.role === 'admin') {
        result = await Order.findAll({ page: page || 1, limit: limit || 10, status: req.query.status });
      } else {
        result = await Order.findByUserId(req.user.id, { page: page || 1, limit: limit || 10 });
      }
      res.json(result);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders.' });
    }
  },

  async getOrder(req, res) {
    try {
      const userId = req.user.role === 'admin' ? null : req.user.id;
      const order = await Order.findById(req.params.id, userId);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      res.json({ order });
    } catch (error) {
      console.error('Get order error:', error);
      res.status(500).json({ error: 'Failed to fetch order.' });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

      const order = await Order.updateStatus(req.params.id, status);
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      res.json({ message: 'Order status updated', order });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status.' });
    }
  },
};

module.exports = orderController;

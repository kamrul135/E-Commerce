const Cart = require('../models/Cart');
const Product = require('../models/Product');

const cartController = {
  async getCart(req, res) {
    try {
      const items = await Cart.getByUserId(req.user.id);
      const total = await Cart.getCartTotal(req.user.id);
      res.json({ items, total, itemCount: items.length });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({ error: 'Failed to fetch cart.' });
    }
  },

  async addItem(req, res) {
    try {
      const { product_id, quantity = 1 } = req.body;
      const product = await Product.findById(product_id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });
      if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock.' });

      await Cart.addItem(req.user.id, product_id, quantity);
      const items = await Cart.getByUserId(req.user.id);
      const total = await Cart.getCartTotal(req.user.id);
      res.json({ message: 'Item added to cart', items, total, itemCount: items.length });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({ error: 'Failed to add item to cart.' });
    }
  },

  async updateQuantity(req, res) {
    try {
      const { quantity } = req.body;
      if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1.' });

      const item = await Cart.updateQuantity(req.params.id, req.user.id, quantity);
      if (!item) return res.status(404).json({ error: 'Cart item not found.' });

      const items = await Cart.getByUserId(req.user.id);
      const total = await Cart.getCartTotal(req.user.id);
      res.json({ message: 'Cart updated', items, total, itemCount: items.length });
    } catch (error) {
      console.error('Update cart error:', error);
      res.status(500).json({ error: 'Failed to update cart.' });
    }
  },

  async removeItem(req, res) {
    try {
      const item = await Cart.removeItem(req.params.id, req.user.id);
      if (!item) return res.status(404).json({ error: 'Cart item not found.' });

      const items = await Cart.getByUserId(req.user.id);
      const total = await Cart.getCartTotal(req.user.id);
      res.json({ message: 'Item removed from cart', items, total, itemCount: items.length });
    } catch (error) {
      console.error('Remove cart item error:', error);
      res.status(500).json({ error: 'Failed to remove item.' });
    }
  },

  async clearCart(req, res) {
    try {
      await Cart.clearCart(req.user.id);
      res.json({ message: 'Cart cleared', items: [], total: 0, itemCount: 0 });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({ error: 'Failed to clear cart.' });
    }
  },
};

module.exports = cartController;

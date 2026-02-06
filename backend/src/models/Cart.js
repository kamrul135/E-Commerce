const db = require('../config/database');

const Cart = {
  async getByUserId(userId) {
    const result = await db.query(
      `SELECT ci.id, ci.quantity, ci.product_id,
              p.name, p.price, p.stock, p.image_url,
              (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async addItem(userId, productId, quantity = 1) {
    const result = await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3
       RETURNING *`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  },

  async updateQuantity(id, userId, quantity) {
    const result = await db.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    );
    return result.rows[0];
  },

  async removeItem(id, userId) {
    const result = await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  async clearCart(userId) {
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  },

  async getCartTotal(userId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(p.price * ci.quantity), 0) as total
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );
    return parseFloat(result.rows[0].total);
  },
};

module.exports = Cart;

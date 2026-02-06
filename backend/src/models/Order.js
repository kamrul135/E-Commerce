const db = require('../config/database');

const Order = {
  async create(userId, { shipping_address, shipping_city, shipping_postal_code, shipping_country, payment_method, items, total }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total, shipping_address, shipping_city, shipping_postal_code, shipping_country, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, total, shipping_address, shipping_city, shipping_postal_code, shipping_country, payment_method || 'credit_card']
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.name, item.price, item.quantity, item.price * item.quantity]
        );

        const stockResult = await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1 RETURNING id',
          [item.quantity, item.product_id]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Insufficient stock for product: ${item.name}`);
        }
      }

      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const countResult = await db.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      orders: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async findById(orderId, userId = null) {
    let query = `SELECT o.* FROM orders o WHERE o.id = $1`;
    const params = [orderId];

    if (userId) {
      query += ' AND o.user_id = $2';
      params.push(userId);
    }

    const orderResult = await db.query(query, params);
    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];
    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    order.items = itemsResult.rows;

    return order;
  },

  async updateStatus(orderId, status) {
    const result = await db.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    return result.rows[0];
  },

  async findAll({ page = 1, limit = 10, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM orders o ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    return {
      orders: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },
};

module.exports = Order;

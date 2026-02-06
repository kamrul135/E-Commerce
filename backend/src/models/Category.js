const db = require('../config/database');

const Category = {
  async findAll() {
    const result = await db.query(
      `SELECT c.*, COUNT(p.id) as product_count 
       FROM categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       GROUP BY c.id 
       ORDER BY c.name`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create({ name, description }) {
    const result = await db.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return result.rows[0];
  },
};

module.exports = Category;

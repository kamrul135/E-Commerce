const db = require('../config/database');

const Product = {
  async findAll({ page = 1, limit = 12, category, search, sort, featured }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (category) {
      conditions.push(`c.name ILIKE $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (featured !== undefined) {
      conditions.push(`p.featured = $${paramIndex}`);
      values.push(featured);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY p.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY p.price DESC';
    else if (sort === 'name') orderClause = 'ORDER BY p.name ASC';
    else if (sort === 'newest') orderClause = 'ORDER BY p.created_at DESC';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       ${whereClause} 
       ${orderClause} 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    return {
      products: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const result = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async create({ name, description, price, stock, category_id, image_url, featured }) {
    const result = await db.query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, stock, category_id, image_url, featured || false]
    );
    return result.rows[0];
  },

  async update(id, fields) {
    const allowedFields = ['name', 'description', 'price', 'stock', 'category_id', 'image_url', 'featured'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },
};

module.exports = Product;

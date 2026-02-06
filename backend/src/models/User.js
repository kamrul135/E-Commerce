const db = require('../config/database');

const User = {
  async create({ name, email, password, role = 'customer' }) {
    const result = await db.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, password, role]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, role, address, city, postal_code, country, phone, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async update(id, fields) {
    const allowedFields = ['name', 'address', 'city', 'postal_code', 'country', 'phone'];
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

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, name, email, role, address, city, postal_code, country, phone`,
      values
    );
    return result.rows[0];
  },

  async updatePassword(id, hashedPassword) {
    await db.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
  },
};

module.exports = User;

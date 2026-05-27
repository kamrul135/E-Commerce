const db = require('../config/database');

const Withdrawal = {
  async create({ userId, amount, bankMethod, accountNumber }) {
    const requestId = `WD-${Math.floor(10000 + Math.random() * 90000)}`; // e.g. WD-12345
    const result = await db.query(
      `INSERT INTO withdrawals (user_id, request_id, amount, bank_method, account_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, requestId, amount, bankMethod, accountNumber]
    );
    return result.rows[0];
  },

  async findAll() {
    const result = await db.query(
      `SELECT w.*, u.email as user_email
       FROM withdrawals w
       LEFT JOIN users u ON w.user_id = u.id
       ORDER BY w.created_at DESC`
    );
    return result.rows;
  },

  async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE withdrawals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }
};

module.exports = Withdrawal;
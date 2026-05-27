const Withdrawal = require('../models/Withdrawal');

const withdrawalController = {
  // Admin logic to read all withdrawals
  async getAll(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied.' });
      }
      const withdrawals = await Withdrawal.findAll();
      res.json({ withdrawals });
    } catch (error) {
      console.error('Fetch withdrawals error:', error);
      res.status(500).json({ error: 'Failed to fetch withdrawals.' });
    }
  },

  // Logic to request a new withdrawal
  async create(req, res) {
    try {
      const { amount, bank_method, account_number } = req.body;

      if (!amount || amount < 500) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is 500.' });
      }
      if (!bank_method || !account_number) {
        return res.status(400).json({ error: 'Bank method and account number are required.' });
      }

      // Real balance check logic
      const db = require('../config/database');
      const salesResult = await db.query("SELECT SUM(amount) as total_sales FROM payments WHERE status = 'completed'");
      const totalSales = parseFloat(salesResult.rows[0].total_sales || 0);

      const withdrawResult = await db.query("SELECT SUM(amount) as total_withdraw FROM withdrawals WHERE status IN ('pending', 'completed')");
      const totalWithdraw = parseFloat(withdrawResult.rows[0].total_withdraw || 0);

      const availableBalance = totalSales - totalWithdraw;

      if (amount > availableBalance) {
        return res.status(400).json({ error: 'Insufficient available balance.' });
      }
      
      const withdrawal = await Withdrawal.create({
        userId: req.user.id,
        amount,
        bankMethod: bank_method,
        accountNumber: account_number
      });

      res.status(201).json({ message: 'Withdrawal requested successfully', withdrawal });
    } catch (error) {
      console.error('Create withdrawal error:', error);
      res.status(500).json({ error: 'Failed to request withdrawal.' });
    }
  },

  // Admin logic to update status
  async updateStatus(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied.' });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['processing', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }

      const updated = await Withdrawal.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: 'Withdrawal not found.' });
      }

      res.json({ message: 'Withdrawal updated', withdrawal: updated });
    } catch (error) {
      console.error('Update withdrawal error:', error);
      res.status(500).json({ error: 'Failed to update withdrawal status.' });
    }
  }
};

module.exports = withdrawalController;
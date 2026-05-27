const db = require('../config/database');

const analyticsController = {
  async getDashboardStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied.' });
      }

      // Total Sales (Completed payments)
      const salesResult = await db.query("SELECT SUM(amount) as total_sales FROM payments WHERE status = 'completed'");
      const totalSales = parseFloat(salesResult.rows[0].total_sales || 0);

      // Total Withdrawals (Pending & Completed)
      const withdrawResult = await db.query("SELECT SUM(amount) as total_withdraw FROM withdrawals WHERE status IN ('pending', 'completed')");
      const totalWithdraw = parseFloat(withdrawResult.rows[0].total_withdraw || 0);

      const availableBalance = totalSales - totalWithdraw;

      // Monthly Revenue (Last 5 months)
      const monthlyRevenue = await db.query(`
        SELECT to_char(created_at, 'Mon') as month, SUM(amount) as revenue
        FROM payments
        WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '5 months'
        GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at) ASC
        LIMIT 5
      `);

      // Top Products
      const topProducts = await db.query(`
        SELECT product_name as name, SUM(quantity) as sold
        FROM order_items
        GROUP BY product_name
        ORDER BY sold DESC
        LIMIT 4
      `);

      res.json({
        totalSales,
        availableBalance,
        totalWithdraw,
        monthlyRevenue: monthlyRevenue.rows.map(row => ({
          month: row.month,
          revenue: parseFloat(row.revenue)
        })),
        topProducts: topProducts.rows.map(row => ({
          name: row.name,
          sold: parseInt(row.sold)
        }))
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics.' });
    }
  }
};

module.exports = analyticsController;
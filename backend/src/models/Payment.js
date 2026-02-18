const db = require('../config/database');
const crypto = require('crypto');

const Payment = {
  /**
   * Create a payment record and return the result.
   * Simulates payment processing with realistic delays and validation.
   */
  async processPayment({ userId, orderId, amount, paymentMethod, cardDetails }) {
    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Simulate payment validation
    const validation = this.validatePayment(paymentMethod, cardDetails);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        transaction_id: transactionId,
        status: 'failed',
      };
    }

    // Simulate processing (check for test failure card numbers)
    const status = this.simulateProcessing(paymentMethod, cardDetails);

    const result = await db.query(
      `INSERT INTO payments (
        user_id, order_id, transaction_id, amount, payment_method,
        card_last_four, card_brand, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        orderId,
        transactionId,
        amount,
        paymentMethod,
        cardDetails?.card_number ? cardDetails.card_number.slice(-4) : null,
        cardDetails?.card_number ? this.detectCardBrand(cardDetails.card_number) : null,
        status,
      ]
    );

    const payment = result.rows[0];

    return {
      success: status === 'completed',
      payment,
      transaction_id: transactionId,
      status,
      error: status === 'failed' ? 'Payment was declined. Please try another payment method.' : null,
    };
  },

  /**
   * Validate payment details based on method.
   */
  validatePayment(paymentMethod, cardDetails) {
    if (paymentMethod === 'cod') {
      return { valid: true };
    }

    if (paymentMethod === 'paypal') {
      return { valid: true };
    }

    // Card-based payments
    if (!cardDetails) {
      return { valid: false, error: 'Card details are required.' };
    }

    const { card_number, card_expiry, card_cvv, card_name } = cardDetails;

    if (!card_number || !card_expiry || !card_cvv || !card_name) {
      return { valid: false, error: 'All card fields are required.' };
    }

    // Strip spaces/dashes from card number
    const cleanNumber = card_number.replace(/[\s-]/g, '');

    if (!/^\d{13,19}$/.test(cleanNumber)) {
      return { valid: false, error: 'Invalid card number.' };
    }

    // Luhn check
    if (!this.luhnCheck(cleanNumber)) {
      return { valid: false, error: 'Invalid card number (checksum failed).' };
    }

    // Expiry format MM/YY
    if (!/^\d{2}\/\d{2}$/.test(card_expiry)) {
      return { valid: false, error: 'Expiry must be in MM/YY format.' };
    }

    const [month, year] = card_expiry.split('/').map(Number);
    if (month < 1 || month > 12) {
      return { valid: false, error: 'Invalid expiry month.' };
    }

    const now = new Date();
    const expiryDate = new Date(2000 + year, month);
    if (expiryDate <= now) {
      return { valid: false, error: 'Card has expired.' };
    }

    // CVV
    if (!/^\d{3,4}$/.test(card_cvv)) {
      return { valid: false, error: 'Invalid CVV.' };
    }

    return { valid: true };
  },

  /**
   * Simulate payment processing result.
   * Use card number 4000000000000002 to simulate a decline.
   */
  simulateProcessing(paymentMethod, cardDetails) {
    if (paymentMethod === 'cod') {
      return 'pending'; // COD payments start as pending
    }

    // Test decline card
    if (cardDetails?.card_number) {
      const cleanNumber = cardDetails.card_number.replace(/[\s-]/g, '');
      if (cleanNumber === '4000000000000002') {
        return 'failed';
      }
    }

    return 'completed';
  },

  /**
   * Luhn algorithm for card number validation.
   */
  luhnCheck(number) {
    let sum = 0;
    let alternate = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let n = parseInt(number[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  },

  /**
   * Detect card brand from number.
   */
  detectCardBrand(number) {
    const cleanNumber = number.replace(/[\s-]/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    return 'unknown';
  },

  /**
   * Find payment by order ID.
   */
  async findByOrderId(orderId) {
    const result = await db.query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find payment by transaction ID.
   */
  async findByTransactionId(transactionId) {
    const result = await db.query(
      'SELECT * FROM payments WHERE transaction_id = $1',
      [transactionId]
    );
    return result.rows[0] || null;
  },

  /**
   * Update payment status (e.g. for refunds).
   */
  async updateStatus(paymentId, status) {
    const result = await db.query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, paymentId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get payments for a user.
   */
  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const countResult = await db.query('SELECT COUNT(*) FROM payments WHERE user_id = $1', [userId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await db.query(
      `SELECT p.*, o.status as order_status
       FROM payments p
       LEFT JOIN orders o ON p.order_id = o.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      payments: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },
};

module.exports = Payment;

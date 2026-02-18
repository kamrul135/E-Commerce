import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, ArrowRight, Truck, Lock, CheckCircle, DollarSign, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { id: 'debit_card', label: 'Debit Card', icon: Wallet },
  { id: 'paypal', label: 'PayPal', icon: DollarSign },
  { id: 'cod', label: 'Cash on Delivery', icon: Truck },
];

const formatCardNumber = (value) => {
  const v = value.replace(/\D/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < v.length; i += 4) {
    parts.push(v.slice(i, i + 4));
  }
  return parts.join(' ');
};

const formatExpiry = (value) => {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2);
  return v;
};

const detectCardBrand = (number) => {
  const clean = number.replace(/\s/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^5[1-5]/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^6(?:011|5)/.test(clean)) return 'discover';
  return null;
};

const CardBrandIcon = ({ brand }) => {
  const logos = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
    discover: '💳 Discover',
  };
  if (!brand) return null;
  return <span className="card-brand-badge">{logos[brand] || '💳'}</span>;
};

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = shipping, 2 = payment

  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
  });

  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardData, setCardData] = useState({
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;

    if (name === 'card_number') formatted = formatCardNumber(value);
    if (name === 'card_expiry') formatted = formatExpiry(value);
    if (name === 'card_cvv') formatted = value.replace(/\D/g, '').slice(0, 4);

    setCardData({ ...cardData, [name]: formatted });

    // Clear error on change
    if (cardErrors[name]) {
      setCardErrors({ ...cardErrors, [name]: null });
    }
  };

  const validateCard = () => {
    const errors = {};
    const clean = cardData.card_number.replace(/\s/g, '');

    if (!cardData.card_name.trim()) errors.card_name = 'Cardholder name is required';
    if (clean.length < 13) errors.card_number = 'Enter a valid card number';
    if (!/^\d{2}\/\d{2}$/.test(cardData.card_expiry)) {
      errors.card_expiry = 'Use MM/YY format';
    } else {
      const [m, y] = cardData.card_expiry.split('/').map(Number);
      if (m < 1 || m > 12) errors.card_expiry = 'Invalid month';
      const exp = new Date(2000 + y, m);
      if (exp <= new Date()) errors.card_expiry = 'Card has expired';
    }
    if (!/^\d{3,4}$/.test(cardData.card_cvv)) errors.card_cvv = 'Enter 3 or 4 digit CVV';

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToPayment = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate card if paying by card
    const isCardPayment = paymentMethod === 'credit_card' || paymentMethod === 'debit_card';
    if (isCardPayment && !validateCard()) return;

    setLoading(true);
    try {
      const orderData = {
        shipping_address: formData.shipping_address,
        shipping_city: `${formData.shipping_city}${formData.shipping_state ? ', ' + formData.shipping_state : ''}`,
        shipping_postal_code: formData.shipping_zip,
        shipping_country: formData.shipping_country,
        payment_method: paymentMethod,
      };

      // Include card details for card payments
      if (isCardPayment) {
        orderData.card_details = {
          card_name: cardData.card_name,
          card_number: cardData.card_number.replace(/\s/g, ''),
          card_expiry: cardData.card_expiry,
          card_cvv: cardData.card_cvv,
        };
      }

      const { data } = await ordersAPI.create(orderData);
      await clearCart();
      toast.success(data.message || 'Order placed successfully!');
      navigate(`/orders/${data.order.id}`);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to place order';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const shipping = total >= 50 ? 0 : 5.99;
  const grandTotal = total + shipping;
  const cardBrand = detectCardBrand(cardData.card_number);
  const isCardPayment = paymentMethod === 'credit_card' || paymentMethod === 'debit_card';

  return (
    <div className="page">
      <div className="container">
        <button className="btn btn-outline btn-sm back-btn" onClick={() => step === 2 ? setStep(1) : navigate('/cart')}>
          <ArrowLeft size={16} /> {step === 2 ? 'Back to Shipping' : 'Back to Cart'}
        </button>

        <div className="page-header">
          <h1>Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="checkout-steps">
          <div className={`checkout-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-number">{step > 1 ? <CheckCircle size={18} /> : '1'}</div>
            <span>Shipping</span>
          </div>
          <div className="step-line"></div>
          <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Payment</span>
          </div>
        </div>

        <div className="checkout-layout">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <form onSubmit={goToPayment} className="checkout-form">
              <div className="checkout-section">
                <h2><Truck size={20} /> Shipping Information</h2>

                <div className="form-group">
                  <label htmlFor="shipping_address">Street Address</label>
                  <input
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_city">City</label>
                    <input
                      id="shipping_city"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_state">State</label>
                    <input
                      id="shipping_state"
                      name="shipping_state"
                      value={formData.shipping_state}
                      onChange={handleChange}
                      placeholder="NY"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_zip">ZIP Code</label>
                    <input
                      id="shipping_zip"
                      name="shipping_zip"
                      value={formData.shipping_zip}
                      onChange={handleChange}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_country">Country</label>
                    <select
                      id="shipping_country"
                      name="shipping_country"
                      value={formData.shipping_country}
                      onChange={handleChange}
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block">
                Continue to Payment <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="checkout-section">
                <h2><CreditCard size={20} /> Payment Method</h2>

                <div className="payment-methods">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        className={`payment-method-option ${paymentMethod === method.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        />
                        <Icon size={20} />
                        <span>{method.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Card Form */}
              {isCardPayment && (
                <div className="checkout-section card-details-section">
                  <h3><Lock size={16} /> Card Details</h3>
                  <div className="secure-badge">
                    <Lock size={12} /> Your payment info is encrypted and secure
                  </div>

                  <div className="form-group">
                    <label htmlFor="card_name">Name on Card</label>
                    <input
                      id="card_name"
                      name="card_name"
                      value={cardData.card_name}
                      onChange={handleCardChange}
                      placeholder="John Doe"
                      className={cardErrors.card_name ? 'input-error' : ''}
                    />
                    {cardErrors.card_name && <span className="field-error">{cardErrors.card_name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="card_number">Card Number</label>
                    <div className="card-number-input">
                      <input
                        id="card_number"
                        name="card_number"
                        value={cardData.card_number}
                        onChange={handleCardChange}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        className={cardErrors.card_number ? 'input-error' : ''}
                      />
                      <CardBrandIcon brand={cardBrand} />
                    </div>
                    {cardErrors.card_number && <span className="field-error">{cardErrors.card_number}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="card_expiry">Expiry Date</label>
                      <input
                        id="card_expiry"
                        name="card_expiry"
                        value={cardData.card_expiry}
                        onChange={handleCardChange}
                        placeholder="MM/YY"
                        inputMode="numeric"
                        className={cardErrors.card_expiry ? 'input-error' : ''}
                      />
                      {cardErrors.card_expiry && <span className="field-error">{cardErrors.card_expiry}</span>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="card_cvv">CVV</label>
                      <input
                        id="card_cvv"
                        name="card_cvv"
                        value={cardData.card_cvv}
                        onChange={handleCardChange}
                        placeholder="123"
                        inputMode="numeric"
                        type="password"
                        className={cardErrors.card_cvv ? 'input-error' : ''}
                      />
                      {cardErrors.card_cvv && <span className="field-error">{cardErrors.card_cvv}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal */}
              {paymentMethod === 'paypal' && (
                <div className="checkout-section paypal-section">
                  <div className="paypal-info">
                    <DollarSign size={32} />
                    <p>You will be redirected to complete payment via PayPal after placing your order.</p>
                  </div>
                </div>
              )}

              {/* COD */}
              {paymentMethod === 'cod' && (
                <div className="checkout-section cod-section">
                  <div className="cod-info">
                    <Truck size={32} />
                    <div>
                      <p><strong>Cash on Delivery</strong></p>
                      <p>Pay when your order arrives. An additional fee may apply.</p>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg btn-block pay-btn" disabled={loading}>
                <Lock size={16} />
                {loading ? 'Processing Payment...' : `Pay $${grandTotal.toFixed(2)}`}
              </button>

              <p className="checkout-disclaimer">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}

          {/* Order Summary */}
          <div className="checkout-summary">
            <h3>Order Summary</h3>
            <div className="checkout-items">
              {items.map((item) => (
                <div key={item.product_id} className="checkout-item">
                  <img src={item.image_url || 'https://via.placeholder.com/50'} alt={item.name} />
                  <div>
                    <p className="checkout-item-name">{item.name}</p>
                    <p className="checkout-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

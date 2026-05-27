import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, ArrowRight, Truck, Lock, CheckCircle, Smartphone, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import bdLocations from '../utils/bdLocations';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'mobile_banking', label: 'Mobile Banking', icon: Smartphone },
  { id: 'credit_card', label: 'Credit / Debit Card', icon: CreditCard },
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
    shipping_upazila: '',
    shipping_zip: '',
    shipping_country: 'BD',
  });

  const [paymentMethod, setPaymentMethod] = useState('mobile_banking');
  const [cardData, setCardData] = useState({
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
  });
  const [mobileBankingData, setMobileBankingData] = useState({
    provider: 'bkash',
    account_number: '',
    trx_id: ''
  });

  const [cardErrors, setCardErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shipping_state') {
      setFormData({ ...formData, shipping_state: value, shipping_city: '', shipping_upazila: '' });
    } else if (name === 'shipping_city') {
      setFormData({ ...formData, shipping_city: value, shipping_upazila: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleMobileBankingChange = (e) => {
    setMobileBankingData({ ...mobileBankingData, [e.target.name]: e.target.value });
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
    const isCardPayment = paymentMethod === 'credit_card';
    if (isCardPayment && !validateCard()) return;

    setLoading(true);
    try {
      const orderData = {
        shipping_address: formData.shipping_address,
        shipping_city: `${formData.shipping_upazila}, ${formData.shipping_city}, ${formData.shipping_state}`,
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

  const getShippingCharge = () => {
    if (total >= 5000) return 0;
    if (!formData.shipping_state || !formData.shipping_city) return 0;
    if (formData.shipping_city === 'Dhaka') return 60; // Inside Dhaka Core
    if (formData.shipping_state === 'Dhaka') return 80; // Dhaka Suburbs (Gazipur, Narayanganj, etc)
    return 120; // Outside Dhaka / Other Divisions
  };

  const getShippingLabel = () => {
    if (!formData.shipping_state || !formData.shipping_city) return 'Delivery Charge';
    if (formData.shipping_city === 'Dhaka') return 'Delivery Charge (Inside Dhaka)';
    if (formData.shipping_state === 'Dhaka') return 'Delivery Charge (Dhaka Suburbs)';
    return 'Delivery Charge (Outside Dhaka)';
  };

  const shipping = getShippingCharge();
  const grandTotal = total + shipping;
  const cardBrand = detectCardBrand(cardData.card_number);
  const isCardPayment = paymentMethod === 'credit_card';

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
                    placeholder="House 12, Road 5, Dhanmondi"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_state">Division</label>
                    <select
                      id="shipping_state"
                      name="shipping_state"
                      value={formData.shipping_state}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>Select Division</option>
                      {Object.keys(bdLocations).map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_city">City / District</label>
                    <select
                      id="shipping_city"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      required
                      disabled={!formData.shipping_state}
                    >
                      <option value="" disabled>Select City / District</option>
                      {formData.shipping_state && Object.keys(bdLocations[formData.shipping_state]).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_upazila">Upazila / Area</label>
                    <select
                      id="shipping_upazila"
                      name="shipping_upazila"
                      value={formData.shipping_upazila}
                      onChange={handleChange}
                      required
                      disabled={!formData.shipping_city}
                    >
                      <option value="" disabled>Select Upazila / Area</option>
                      {formData.shipping_city && bdLocations[formData.shipping_state][formData.shipping_city]?.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="shipping_zip">Postal / ZIP Code</label>
                    <input
                      id="shipping_zip"
                      name="shipping_zip"
                      value={formData.shipping_zip}
                      onChange={handleChange}
                      placeholder="1205"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ maxWidth: '50%' }}>
                    <label htmlFor="shipping_country">Country</label>
                    <select
                      id="shipping_country"
                      name="shipping_country"
                      value={formData.shipping_country}
                      onChange={handleChange}
                      disabled
                    >
                      <option value="BD">Bangladesh</option>
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

              {/* Mobile Banking Options */}
              {paymentMethod === 'mobile_banking' && (
                <div className="checkout-section">
                  <div className="mobile-banking-selector" style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="provider" value="bkash" checked={mobileBankingData.provider === 'bkash'} onChange={handleMobileBankingChange} /> 
                      <span style={{ fontWeight: '600', color: '#e2136e' }}>bKash</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="provider" value="nagad" checked={mobileBankingData.provider === 'nagad'} onChange={handleMobileBankingChange} /> 
                      <span style={{ fontWeight: '600', color: '#f7931e' }}>Nagad</span>
                    </label>
                  </div>

                  <div className="mobile-banking-info" style={{ marginBottom: '1.5rem', background: 'var(--gray-50)', padding: '1rem', borderRadius: '8px' }}>
                    <Smartphone size={32} style={{ color: mobileBankingData.provider === 'bkash' ? '#e2136e' : '#f7931e', marginBottom: '0.5rem' }} />
                    <p><strong>Step 1:</strong> Send <strong>৳{grandTotal.toFixed(2)}</strong> to our {mobileBankingData.provider === 'bkash' ? 'bKash' : 'Nagad'} Merchant Number <strong>01608418807</strong></p>
                    <p><strong>Step 2:</strong> Enter your account number and Transaction ID (TrxID) below to verify your payment.</p>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="account_number">Your {mobileBankingData.provider === 'bkash' ? 'bKash' : 'Nagad'} Number</label>
                      <input
                        id="account_number"
                        name="account_number"
                        value={mobileBankingData.account_number}
                        onChange={handleMobileBankingChange}
                        placeholder="01XXXXXXXXX"
                        required
                        inputMode="numeric"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="trx_id">Transaction ID (TrxID)</label>
                      <input
                        id="trx_id"
                        name="trx_id"
                        value={mobileBankingData.trx_id}
                        onChange={handleMobileBankingChange}
                        placeholder="8X7A9B2C4D"
                        required
                      />
                    </div>
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
                {loading ? 'Processing Payment...' : `Pay ৳${grandTotal.toFixed(2)}`}
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
                  <span>৳{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>৳{total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>{getShippingLabel()}</span>
              <span>{shipping === 0 && total >= 5000 ? 'Free' : (formData.shipping_city ? `৳${shipping.toFixed(2)}` : 'Calculated at next step')}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>৳{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

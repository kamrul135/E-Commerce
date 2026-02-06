import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        shipping_address: formData.shipping_address,
        shipping_city: `${formData.shipping_city}${formData.shipping_state ? ', ' + formData.shipping_state : ''}`,
        shipping_postal_code: formData.shipping_zip,
        shipping_country: formData.shipping_country,
      };
      const { data } = await ordersAPI.create(orderData);
      await clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.order.id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const shipping = total >= 50 ? 0 : 5.99;

  return (
    <div className="page">
      <div className="container">
        <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate('/cart')}>
          <ArrowLeft size={16} /> Back to Cart
        </button>

        <div className="page-header">
          <h1>Checkout</h1>
        </div>

        <div className="checkout-layout">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="checkout-section">
              <h2><CreditCard size={20} /> Shipping Information</h2>

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

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? 'Placing Order...' : `Place Order - $${(total + shipping).toFixed(2)}`}
            </button>
          </form>

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
              <span>${(total + shipping).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

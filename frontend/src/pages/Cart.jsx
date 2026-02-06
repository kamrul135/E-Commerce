import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { items, loading, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <ShoppingBag size={64} />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items yet</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Shopping Cart</h1>
          <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.product_id} className="cart-item">
                <img
                  src={item.image_url || 'https://via.placeholder.com/100'}
                  alt={item.name}
                  className="cart-item-image"
                />
                <div className="cart-item-info">
                  <Link to={`/products/${item.product_id}`} className="cart-item-name">
                    {item.name}
                  </Link>
                  <p className="cart-item-price">${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="cart-item-quantity">
                  <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                    <Minus size={14} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <p className="cart-item-total">
                  ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
                <button className="cart-item-remove" onClick={() => removeFromCart(item.product_id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button className="btn btn-outline btn-sm" onClick={clearCart}>
              Clear Cart
            </button>
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{total >= 50 ? 'Free' : '$5.99'}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${(total >= 50 ? total : total + 5.99).toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary btn-lg btn-block"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link to="/products" className="btn btn-outline btn-block" style={{ marginTop: '0.5rem' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

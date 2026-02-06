import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Orders.css';

const statusColors = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await ordersAPI.getById(id);
        setOrder(data.order);
      } catch (error) {
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!order) return null;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '800px' }}>
        <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <div className="order-detail">
          <div className="order-detail-header">
            <div>
              <h1>Order #{order.id.slice(0, 8)}</h1>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`order-status ${order.status}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {/* Shipping */}
          <div className="order-detail-section">
            <h3><MapPin size={18} /> Shipping Address</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: 1.6 }}>
              {order.shipping_address}<br />
              {order.shipping_city} {order.shipping_postal_code}<br />
              {order.shipping_country}
            </p>
          </div>

          {/* Items */}
          <div className="order-detail-section">
            <h3><Package size={18} /> Items ({order.items?.length || 0})</h3>
            {order.items?.map((item, idx) => (
              <div key={idx} className="order-detail-item">
                <div className="order-detail-item-image">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/60'}
                    alt={item.product_name}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.product_name}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                    Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                  ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="order-detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
              <span>Total</span>
              <span>${parseFloat(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

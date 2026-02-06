import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye } from 'lucide-react';
import { ordersAPI } from '../services/api';
import './Orders.css';

const statusColors = {
  pending: 'badge-warning',
  processing: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await ordersAPI.getAll();
        setOrders(data.orders || []);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  if (orders.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <Package size={64} />
            <h2>No orders yet</h2>
            <p>Start shopping to place your first order</p>
            <Link to="/products" className="btn btn-primary btn-lg">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Order #{order.id.slice(0, 8)}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
                <span className={`badge ${statusColors[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="order-card-body">
                <div className="order-info">
                  <span>Items: {order.item_count}</span>
                  <span className="order-total">${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                  <Eye size={16} /> View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
